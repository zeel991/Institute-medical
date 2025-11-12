import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../types';

const prisma = new PrismaClient();

// --- GET: List Medicines (Public availability check) ---
export const getMedicines = async (req: AuthRequest, res: Response) => {
  try {
    const { search, availability } = req.query;
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
      ];
    }
    
    if (availability === 'in_stock') {
        where.stockLevel = { gt: 0 };
    } else if (availability === 'low_stock') {
        where.stockLevel = { gt: 0, lte: 10 }; // Low stock defined as 10 units or less
    } else if (availability === 'out_of_stock') {
        where.stockLevel = 0;
    }

    const medicines = await prisma.medicine.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    res.json(medicines);
  } catch (error) {
    console.error('Get medicines error:', error);
    res.status(500).json({ error: 'Failed to fetch medicines' });
  }
};

// --- POST: Create Medicine (Staff/Admin Only) ---
export const createMedicine = async (req: AuthRequest, res: Response) => {
  try {
    const { name, description, stockLevel, unit, expiryDate, location } = req.body;

    const medicine = await prisma.medicine.create({
      data: {
        name,
        description,
        stockLevel: parseInt(stockLevel) || 0,
        unit,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        location,
      },
    });

    res.status(201).json(medicine);
  } catch (error) {
    console.error('Create medicine error:', error);
    if (error.code === 'P2002') {
        return res.status(400).json({ error: 'Medicine name already exists.' });
    }
    res.status(500).json({ error: 'Failed to create medicine entry' });
  }
};

// --- PUT: Update Medicine (Staff/Admin Only) ---
export const updateMedicine = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, stockLevel, unit, expiryDate, location } = req.body;

    const medicine = await prisma.medicine.update({
      where: { id },
      data: {
        name,
        description,
        stockLevel: stockLevel !== undefined ? parseInt(stockLevel) : undefined,
        unit,
        expiryDate: expiryDate ? new Date(expiryDate) : undefined,
        location,
      },
    });

    res.json(medicine);
  } catch (error) {
    console.error('Update medicine error:', error);
    if (error.code === 'P2002') {
        return res.status(400).json({ error: 'Medicine name already exists.' });
    }
    res.status(500).json({ error: 'Failed to update medicine entry' });
  }
};

// --- DELETE: Delete Medicine (Admin Only) ---
export const deleteMedicine = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.medicine.delete({
      where: { id },
    });

    res.json({ message: 'Medicine entry deleted successfully' });
  } catch (error) {
    console.error('Delete medicine error:', error);
    res.status(500).json({ error: 'Failed to delete medicine entry' });
  }
};
