import { Request, Response } from 'express';
import { PrismaClient, ComplaintStatus, Priority } from '@prisma/client';
import { AuthRequest } from '../types';
import { createNotification } from '../services/notification.service';

const prisma = new PrismaClient();

export const createComplaint = async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, facilityId, priority } = req.body;
    const userId = req.user!.id;

    const facility = await prisma.facility.findUnique({
      where: { id: facilityId },
    });

    if (!facility) {
      return res.status(404).json({ error: 'Facility not found' });
    }

    const attachment = req.file ? `/uploads/${req.file.filename}` : null;

    const complaint = await prisma.complaint.create({
      data: {
        title,
        description,
        priority: priority || Priority.medium,
        facilityId,
        createdById: userId,
        attachment,
      },
      include: {
        facility: true,
        createdBy: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });

    await prisma.complaintStatusHistory.create({
      data: {
        complaintId: complaint.id,
        toStatus: ComplaintStatus.new,
        notes: 'Complaint created',
      },
    });

    const managers = await prisma.user.findMany({
      where: { role: 'facility_manager' },
    });

    for (const manager of managers) {
      await createNotification(
        manager.id,
        'New Complaint',
        `New complaint: ${title} at ${facility.name}`
      );
    }

    res.status(201).json(complaint);
  } catch (error) {
    console.error('Create complaint error:', error);
    res.status(500).json({ error: 'Failed to create complaint' });
  }
};

export const getComplaints = async (req: AuthRequest, res: Response) => {
  try {
    const { status, priority, facilityId } = req.query;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    const where: any = {};

    if (userRole === 'resident') {
      where.createdById = userId;
    } else if (userRole === 'medical_staff') {
      where.assignments = {
        some: { assignedToId: userId, isActive: true },
      };
    }

    if (status) where.status = status as ComplaintStatus;
    if (priority) where.priority = priority as Priority;
    if (facilityId) where.facilityId = facilityId as string;

    const complaints = await prisma.complaint.findMany({
      where,
      include: {
        facility: true,
        createdBy: {
          select: { id: true, name: true, email: true, role: true },
        },
        assignments: {
          where: { isActive: true },
          include: {
            assignedTo: {
              select: { id: true, name: true, email: true, role: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(complaints);
  } catch (error) {
    console.error('Get complaints error:', error);
    res.status(500).json({ error: 'Failed to fetch complaints' });
  }
};

export const getComplaintById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const complaint = await prisma.complaint.findUnique({
      where: { id },
      include: {
        facility: true,
        createdBy: {
          select: { id: true, name: true, email: true, role: true },
        },
        assignments: {
          orderBy: { assignedAt: 'desc' },
          include: {
            assignedTo: {
              select: { id: true, name: true, email: true, role: true },
            },
          },
        },
        statusHistory: {
          orderBy: { changedAt: 'asc' },
        },
      },
    });

    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found' });
    }

    res.json(complaint);
  } catch (error) {
    // THIS CATCH BLOCK IS CRITICAL. IT WILL LOG THE SERVER CRASH.
    console.error('Get complaint error:', error);
    // Send 500 status to frontend so it doesn't just hang
    res.status(500).json({ error: 'Failed to fetch complaint details (Server Error)' });
  }
};

export const assignComplaint = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { assignedToId, notes } = req.body;

    const complaint = await prisma.complaint.findUnique({
      where: { id },
      include: { facility: true },
    });

    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found' });
    }

    const assignedUser = await prisma.user.findUnique({
      where: { id: assignedToId },
    });

    if (!assignedUser) {
      return res.status(404).json({ error: 'Assigned user not found' });
    }

    await prisma.complaintAssignment.updateMany({
      where: { complaintId: id, isActive: true },
      data: { isActive: false },
    });

    const assignment = await prisma.complaintAssignment.create({
      data: {
        complaintId: id,
        assignedToId,
        notes,
      },
      include: {
        assignedTo: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });

    if (complaint.status === ComplaintStatus.new) {
      await prisma.complaint.update({
        where: { id },
        data: { status: ComplaintStatus.assigned },
      });

      await prisma.complaintStatusHistory.create({
        data: {
          complaintId: id,
          fromStatus: ComplaintStatus.new,
          toStatus: ComplaintStatus.assigned,
          notes: `Assigned to ${assignedUser.name}`,
        },
      });
    }

    await createNotification(
      assignedToId,
      'Complaint Assigned',
      `You have been assigned to: ${complaint.title}`
    );

    res.json(assignment);
  } catch (error) {
    console.error('Assign complaint error:', error);
    res.status(500).json({ error: 'Failed to assign complaint' });
  }
};

export const updateComplaintStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const complaint = await prisma.complaint.findUnique({
      where: { id },
      include: { createdBy: true },
    });

    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found' });
    }

    const validTransitions: Record<ComplaintStatus, ComplaintStatus[]> = {
      new: [ComplaintStatus.assigned],
      assigned: [ComplaintStatus.in_progress],
      in_progress: [ComplaintStatus.resolved],
      resolved: [ComplaintStatus.closed],
      closed: [],
    };

    if (!validTransitions[complaint.status].includes(status as ComplaintStatus)) {
      return res.status(400).json({ 
        error: `Invalid status transition from ${complaint.status} to ${status}` 
      });
    }

    const updateData: any = { status };
    if (status === ComplaintStatus.resolved) {
      updateData.resolvedAt = new Date();
    } else if (status === ComplaintStatus.closed) {
      updateData.closedAt = new Date();
    }

    const updatedComplaint = await prisma.complaint.update({
      where: { id },
      data: updateData,
      include: {
        facility: true,
        createdBy: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });

    await prisma.complaintStatusHistory.create({
      data: {
        complaintId: id,
        fromStatus: complaint.status,
        toStatus: status as ComplaintStatus,
        notes,
      },
    });

    await createNotification(
      complaint.createdById,
      'Complaint Status Updated',
      `Your complaint "${complaint.title}" status changed to ${status}`
    );

    res.json(updatedComplaint);
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ error: 'Failed to update complaint status' });
  }
};
