import { Response } from 'express';
import { PrismaClient, ComplaintStatus } from '@prisma/client';
import { AuthRequest, DashboardStats } from '../types';

const prisma = new PrismaClient();

export const getDashboardStats = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const userRole = req.user!.role;
    
    // Define the base WHERE clause: filter by user ID if they are a resident
    const baseWhere: any = {};
    if (userRole === 'resident') {
        baseWhere.createdById = userId;
    }

    const totalComplaints = await prisma.complaint.count({ where: baseWhere });

    const openComplaints = await prisma.complaint.count({
      where: {
        ...baseWhere, // Apply user filter
        status: {
          not: ComplaintStatus.closed,
        },
      },
    });

    const closedComplaints = await prisma.complaint.count({
      where: {
        ...baseWhere, // Apply user filter
        status: ComplaintStatus.closed,
      },
    });

    // Calculate Average Resolution Time only for complaints created by the resident
    const resolvedComplaints = await prisma.complaint.findMany({
      where: {
        ...baseWhere, // Apply user filter
        status: {
          in: [ComplaintStatus.resolved, ComplaintStatus.closed],
        },
        resolvedAt: {
          not: null,
        },
      },
      select: {
        createdAt: true,
        resolvedAt: true,
      },
    });

    let avgResolutionTime = 0;
    if (resolvedComplaints.length > 0) {
      const totalTime = resolvedComplaints.reduce((sum, complaint) => {
        const created = new Date(complaint.createdAt).getTime();
        const resolved = new Date(complaint.resolvedAt!).getTime();
        return sum + (resolved - created);
      }, 0);
      // Convert milliseconds to hours, rounded to one decimal place
      avgResolutionTime = Math.round((totalTime / resolvedComplaints.length / (1000 * 60 * 60)) * 10) / 10;
    }

    const complaintsByStatus = await prisma.complaint.groupBy({
      by: ['status'],
      where: baseWhere, // Apply user filter
      _count: {
        status: true,
      },
    });

    const statusCounts = complaintsByStatus.map((item) => ({
      status: item.status,
      count: item._count.status,
    }));

    const complaintsByPriority = await prisma.complaint.groupBy({
      by: ['priority'],
      where: baseWhere, // Apply user filter
      _count: {
        priority: true,
      },
    });

    const priorityCounts = complaintsByPriority.map((item) => ({
      priority: item.priority,
      count: item._count.priority,
    }));

    const stats: DashboardStats = {
      totalComplaints,
      openComplaints,
      closedComplaints,
      avgResolutionTime,
      complaintsByStatus: statusCounts,
      complaintsByPriority: priorityCounts,
    };

    res.json(stats);
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  }
};
