import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../types';

const prisma = new PrismaClient();

export const getFacilities = async (req: AuthRequest, res: Response) => {
  try {
    const { type, isActive } = req.query;
    const where: any = {};

    if (type) where.type = type;
    if (isActive !== undefined) where.isActive = isActive === 'true';

    const facilities = await prisma.facility.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    res.json(facilities);
  } catch (error) {
    console.error('Get facilities error:', error);
    res.status(500).json({ error: 'Failed to fetch facilities' });
  }
};

export const createFacility = async (req: AuthRequest, res: Response) => {
  try {
    const { name, type, description, location } = req.body;

    const facility = await prisma.facility.create({
      data: {
        name,
        type,
        description,
        location,
      },
    });

    res.status(201).json(facility);
  } catch (error) {
    console.error('Create facility error:', error);
    res.status(500).json({ error: 'Failed to create facility' });
  }
};

export const updateFacility = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, type, description, location, isActive } = req.body;

    const facility = await prisma.facility.update({
      where: { id },
      data: {
        name,
        type,
        description,
        location,
        isActive,
      },
    });

    res.json(facility);
  } catch (error) {
    console.error('Update facility error:', error);
    res.status(500).json({ error: 'Failed to update facility' });
  }
};

export const deleteFacility = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.facility.delete({
      where: { id },
    });

    res.json({ message: 'Facility deleted successfully' });
  } catch (error) {
    console.error('Delete facility error:', error);
    res.status(500).json({ error: 'Failed to delete facility' });
  }
};
