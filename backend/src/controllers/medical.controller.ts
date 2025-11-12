import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../types';

const prisma = new PrismaClient();

// Get or create a record (accessible by medical staff/admin)
export const getOrCreateMedicalRecord = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;

    let record = await prisma.medicalRecord.findUnique({
      where: { userId },
    });

    if (!record) {
      // Create a new default record if none exists
      record = await prisma.medicalRecord.create({
        data: { userId },
      });
    }

    res.json(record);
  } catch (error) {
    console.error('Get/Create Medical Record error:', error);
    res.status(500).json({ error: 'Failed to fetch medical record' });
  }
};

// Update record details (allergies, blood type, etc.)
export const updateMedicalRecord = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const { bloodType, allergies, chronicConditions, emergencyContact } = req.body;

    const record = await prisma.medicalRecord.update({
      where: { userId },
      data: { bloodType, allergies, chronicConditions, emergencyContact },
    });

    res.json(record);
  } catch (error) {
    console.error('Update Medical Record error:', error);
    res.status(500).json({ error: 'Failed to update medical record' });
  }
};

// Get all logs for a specific record/user
export const getMedicalLogs = async (req: AuthRequest, res: Response) => {
    try {
        const { userId } = req.params;
        
        const record = await prisma.medicalRecord.findUnique({ where: { userId } });
        if (!record) {
            return res.status(404).json({ error: 'Medical record not found for this user.' });
        }

        const logs = await prisma.medicalLog.findMany({
            where: { recordId: record.id },
            include: { staff: { select: { name: true, role: true } } },
            orderBy: { timestamp: 'desc' },
        });

        res.json(logs);
    } catch (error) {
        console.error('Get Medical Logs error:', error);
        res.status(500).json({ error: 'Failed to fetch medical logs' });
    }
};

// Create a new medical log entry
export const createMedicalLog = async (req: AuthRequest, res: Response) => {
  try {
    const staffId = req.user!.id;
    const { userId } = req.params;
    const { diagnosis, treatment, medication } = req.body;

    const record = await prisma.medicalRecord.findUnique({ where: { userId } });
    if (!record) {
      return res.status(404).json({ error: 'Medical record not found for logging.' });
    }

    const log = await prisma.medicalLog.create({
      data: {
        recordId: record.id,
        staffId,
        diagnosis,
        treatment,
        medication,
      },
      include: { staff: { select: { name: true, role: true } } },
    });

    res.status(201).json(log);
  } catch (error) {
    console.error('Create Medical Log error:', error);
    res.status(500).json({ error: 'Failed to create medical log' });
  }
};
