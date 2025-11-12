import { Response } from 'express';
import { PrismaClient } from '@prisma/client';

// NOTE: UserStatus import removed as it does not exist in the current schema
import { AuthRequest } from '../types';

const prisma = new PrismaClient();

export const createLog = async (req: AuthRequest, res: Response) => {
  try {
    const { type, location, notes } = req.body;
    const userId = req.user!.id;

    // The logic that updated UserStatus is removed here, as the field does not exist.

    const log = await prisma.entryExitLog.create({
      data: {
        userId,
        type,
        location,
        notes,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });

    res.status(201).json(log);
  } catch (error) {
    console.error('Create log error:', error);
    res.status(500).json({ error: 'Failed to create log' });
  }
};

export const getLogs = async (req: AuthRequest, res: Response) => {
  try {
    const { userId, type, startDate, endDate } = req.query;
    const where: any = {};

    if (userId) where.userId = userId as string;
    if (type) where.type = type as string;
    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = new Date(startDate as string);
      if (endDate) where.timestamp.lte = new Date(endDate as string);
    }

    const logs = await prisma.entryExitLog.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
      orderBy: { timestamp: 'desc' },
    });

    res.json(logs);
  } catch (error) {
    console.error('Get logs error:', error);
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
};
