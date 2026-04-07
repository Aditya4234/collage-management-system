import prisma from '../lib/prisma';

export async function createNotification(
  userId: string,
  title: string,
  message: string,
  type: string = 'info'
) {
  try {
    await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type,
      },
    });
  } catch (error) {
    console.error('Error creating notification:', error);
  }
}

export async function createNotificationForAdmins(
  title: string,
  message: string,
  type: string = 'info'
) {
  try {
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
    });

    await prisma.notification.createMany({
      data: admins.map((admin) => ({
        userId: admin.id,
        title,
        message,
        type,
      })),
    });
  } catch (error) {
    console.error('Error creating admin notifications:', error);
  }
}