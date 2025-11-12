import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const createNotification = async (
  userId: string,
  title: string,
  message: string
): Promise<void> => {
  try {
    await prisma.notification.create({
      data: {
        userId,
        title,
        message,
      },
    });
  } catch (error) {
    console.error('Failed to create notification:', error);
  }
};
