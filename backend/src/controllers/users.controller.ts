import { Response } from 'express';
import { PrismaClient, Role } from '@prisma/client';
import { AuthRequest } from '../types';

const prisma = new PrismaClient();

export const getUsers = async (req: AuthRequest, res: Response) => {
  try {
    const { role, all } = req.query;
    const userRole = req.user!.role; // Role of the logged-in user

    const where: any = {};
    
    // Logic: If the user is an Admin AND requests 'all=true', DO NOT add role filters.
    if (userRole === 'admin' && all === 'true') {
        // No 'where.role' filter is applied, fetching ALL users.
    } else {
        // Otherwise, apply role filtering:
        if (role) {
            // Filter by specific roles requested
            const roles = (role as string).split(',');
            where.role = { in: roles };
        } else {
            // Default filter for assignable staff (Manager/Medical Staff/Admin)
            where.role = {
                in: ['admin', 'facility_manager', 'medical_staff'],
            };
        }
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
      orderBy: { name: 'asc' },
    });

    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

export const updateUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, role } = req.body;
    
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Only Admin can update user details.' });
    }

    const validRoles = Object.keys(Role);
    if (role && !validRoles.includes(role)) {
        return res.status(400).json({ error: `Invalid role specified. Must be one of: ${validRoles.join(', ')}` });
    }

    const user = await prisma.user.update({
      where: { id },
      data: { name, role: role as Role },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    res.json(user);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
};
