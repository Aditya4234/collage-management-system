import { Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';

export const markAttendance = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { studentId, date, status } = req.body;

    if (!studentId || !date || !status) {
      res.status(400).json({ error: 'Student ID, date, and status are required' });
      return;
    }

    const student = await prisma.student.findUnique({ where: { id: studentId } });
    if (!student) {
      res.status(404).json({ error: 'Student not found' });
      return;
    }

    const attendance = await prisma.attendance.upsert({
      where: {
        studentId_date: {
          studentId,
          date: new Date(date),
        },
      },
      update: { status: status as any },
      create: {
        studentId,
        date: new Date(date),
        status: status as any,
      },
      include: {
        student: {
          select: { id: true, name: true, rollNo: true },
        },
      },
    });

    res.json({ message: 'Attendance marked successfully', attendance });
  } catch (error) {
    console.error('Mark attendance error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getAttendance = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { date, studentId } = req.query;

    const where: any = {};

    if (date) {
      where.date = new Date(date as string);
    }

    if (studentId) {
      where.studentId = studentId;
    }

    const attendance = await prisma.attendance.findMany({
      where,
      include: {
        student: {
          select: { id: true, name: true, rollNo: true },
        },
      },
    });

    res.json({ attendance });
  } catch (error) {
    console.error('Get attendance error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getAttendanceStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { date } = req.query;
    const dateStr = (date as string) || new Date().toISOString().split('T')[0];

    const dayAttendance = await prisma.attendance.findMany({
      where: { date: new Date(dateStr) },
    });

    const present = dayAttendance.filter((a: any) => (a.status as string).toLowerCase() === 'present').length;
    const absent = dayAttendance.filter((a: any) => (a.status as string).toLowerCase() === 'absent').length;
    const late = dayAttendance.filter((a: any) => (a.status as string).toLowerCase() === 'late').length;

    res.json({
      date: dateStr,
      present,
      absent,
      late,
      total: dayAttendance.length,
      attendanceRate: dayAttendance.length > 0 ? Math.round((present / dayAttendance.length) * 100) : 0,
    });
  } catch (error) {
    console.error('Get attendance stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getAttendanceByStudent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { studentId } = req.params;

    const attendance = await prisma.attendance.findMany({
      where: { studentId },
      orderBy: { date: 'desc' },
      include: {
        student: {
          select: { id: true, name: true, rollNo: true },
        },
      },
    });

    res.json({ attendance });
  } catch (error) {
    console.error('Get attendance by student error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateAttendance = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const attendance = await prisma.attendance.update({
      where: { id },
      data: { status: status.toUpperCase() as any },
    });

    res.json({ message: 'Attendance updated successfully', attendance });
  } catch (error) {
    console.error('Update attendance error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteAttendance = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    await prisma.attendance.delete({ where: { id } });

    res.json({ message: 'Attendance deleted successfully' });
  } catch (error) {
    console.error('Delete attendance error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const bulkMarkAttendance = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { date, records } = req.body;

    if (!date || !records || !Array.isArray(records)) {
      res.status(400).json({ error: 'Date and records array are required' });
      return;
    }

    const results = await Promise.all(
      records.map(async (record: { studentId: string; status: string }) => {
        return prisma.attendance.upsert({
          where: {
            studentId_date: {
              studentId: record.studentId,
              date: new Date(date),
            },
          },
          update: { status: record.status as any },
          create: {
            studentId: record.studentId,
            date: new Date(date),
            status: record.status as any,
          },
        });
      })
    );

    res.json({ message: 'Bulk attendance marked successfully', results });
  } catch (error) {
    console.error('Bulk mark attendance error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const markAllPresent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { date } = req.body;
    const dateStr = date || new Date().toISOString().split('T')[0];

    const students = await prisma.student.findMany();

    await Promise.all(
      students.map(async (student) => {
        return prisma.attendance.upsert({
          where: {
            studentId_date: {
              studentId: student.id,
              date: new Date(dateStr),
            },
          },
          update: { status: 'PRESENT' as any },
          create: {
            studentId: student.id,
            date: new Date(dateStr),
            status: 'PRESENT' as any,
          },
        });
      })
    );

    res.json({ message: 'All students marked present', date: dateStr });
  } catch (error) {
    console.error('Mark all present error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};