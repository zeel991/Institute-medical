import { Response } from 'express';
import { PrismaClient, ComplaintStatus } from '@prisma/client';
import { AuthRequest, DashboardStats } from '../types';

const prisma = new PrismaClient();

export const getDashboardStats = async (req: AuthRequest, res: Response) => {
  try {
    const totalComplaints = await prisma.complaint.count();

    const openComplaints = await prisma.complaint.count({
      where: {
        status: {
          not: ComplaintStatus.closed,
        },
      },
    });

    const closedComplaints = await prisma.complaint.count({
      where: {
        status: ComplaintStatus.closed,
      },
    });

    const resolvedComplaints = await prisma.complaint.findMany({
      where: {
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
        const created = new Date(complaint.
        createdAt).getTime();
        const resolved = new Date(complaint.resolvedAt!).getTime();
        return sum + (resolved - created);
      }, 0);
      avgResolutionTime = Math.round((totalTime / resolvedComplaints.length / (1000 * 60 * 60)) * 10) / 10;
    }

    const complaintsByStatus = await prisma.complaint.groupBy({
      by: ['status'],
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
