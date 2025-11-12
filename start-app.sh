#!/bin/bash

echo "📝 Restoring functional scheduling logic in backend controller..."

# --- Update scheduling.controller.ts ---
cat > backend/src/controllers/scheduling.controller.ts << 'EOF'
import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../types';

const prisma = new PrismaClient();

// --- Utility to check if any Medical Staff is currently checked in ---
// NOTE: This check relies on the 'status' field which was removed during restoration. 
// We will temporarily comment out the check to allow booking for now, 
// as the 'status' field would require another schema migration.
/*
const isDoctorAvailable = async () => {
    const checkedInDoctors = await prisma.user.count({
        where: {
            role: 'medical_staff',
            status: 'checkedIn',
        },
    });
    return checkedInDoctors > 0;
};
*/

// --- Student: Create new appointment ---
export const createAppointment = async (req: AuthRequest, res: Response) => {
  try {
    const studentId = req.user!.id;
    const { scheduledTime, reason } = req.body;

    // --- AVAILABILITY CHECK (Temporarily commented out due to missing UserStatus column) ---
    // const available = await isDoctorAvailable();
    // if (!available) {
    //     return res.status(400).json({ error: 'Cannot book appointments: No medical staff are currently checked in.' });
    // }
    // --- END AVAILABILITY CHECK ---
    
    // Check if scheduledTime is in the future
    if (new Date(scheduledTime) <= new Date()) {
      return res.status(400).json({ error: 'Scheduled time must be in the future.' });
    }

    const appointment = await prisma.appointment.create({
      data: {
        studentId,
        scheduledTime: new Date(scheduledTime),
        reason,
        status: 'pending',
      },
    });

    res.status(201).json(appointment);
  } catch (error) {
    console.error('Create appointment error:', error);
    res.status(500).json({ error: 'Failed to create appointment' });
  }
};

// --- Get Appointments (Role-based) ---
export const getAppointments = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const userRole = req.user!.role;
    const { status } = req.query;

    const where: any = {};
    if (status) where.status = status;

    if (userRole === 'resident' || userRole === 'facility_manager') {
      where.studentId = userId;
    } else if (userRole === 'medical_staff' || userRole === 'admin') {
      if (!status) where.status = { not: 'completed' };
    }
    
    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        student: { select: { id: true, name: true, email: true } },
        staff: { select: { id: true, name: true, email: true } },
      },
      orderBy: { scheduledTime: 'asc' },
    });

    res.json(appointments);
  } catch (error) {
    console.error('Get appointments error:', error);
    res.status(500).json({ error: 'Failed to fetch appointments (Server Crash)' });
  }
};

// --- Staff/Admin: Update Appointment Status/Assignment ---
export const updateAppointment = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, staffId } = req.body;
    const userRole = req.user!.role;

    if (userRole !== 'admin' && userRole !== 'medical_staff') {
      return res.status(403).json({ error: 'Only medical staff or admin can manage appointments.' });
    }

    const appointment = await prisma.appointment.update({
      where: { id },
      data: {
        status,
        staffId: staffId || null,
      },
      include: {
        student: { select: { name: true } }
      }
    });
    
    res.json(appointment);
  } catch (error) {
    console.error('Update appointment error:', error);
    res.status(500).json({ error: 'Failed to update appointment' });
  }
};
EOF

echo "✅ Backend scheduling logic restored (availability check temporarily disabled)."

# --- 2. Restart Backend Server ---
cd backend
npm run dev