import { Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';
import { AttendanceStatus } from '@prisma/client';
import { createNotificationForAdmins } from '../lib/notifications';

export const markAttendance = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { studentId, date, status } = req.body;

    if (!studentId || !date || !status) {
      res.status(400).json({ error: 'Student ID, date, and status are required' });
      return;
    }

    const validStatuses = ['PRESENT', 'ABSENT', 'LATE'];
    if (!validStatuses.includes(status.toUpperCase())) {
      res.status(400).json({ error: 'Status must be PRESENT, ABSENT, or LATE' });
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
      update: { status: status.toUpperCase() },
      create: {
        studentId,
        date: new Date(date),
        status: status.toUpperCase(),
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            rollNo: true,
          },
        },
      },
    });

    res.status(201).json({ message: 'Attendance marked successfully', attendance });
  } catch (error) {
    console.error('Mark attendance error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getAttendance = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { date, studentId, startDate, endDate, status, page = '1', limit = '50' } = req.query;

    const where: any = {};

    if (date) {
      const searchDate = new Date(date as string);
      where.date = {
        gte: new Date(searchDate.setHours(0, 0, 0, 0)),
        lt: new Date(searchDate.setHours(23, 59, 59, 999)),
      };
    }

    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string),
      };
    }

    if (studentId) {
      where.studentId = studentId;
    }

    if (status) {
      where.status = (status as string).toUpperCase();
    }

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const [attendance, total] = await Promise.all([
      prisma.attendance.findMany({
        where,
        include: {
          student: {
            select: {
              id: true,
              name: true,
              rollNo: true,
              email: true,
              course: true,
              semester: true,
            },
          },
        },
        orderBy: { date: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.attendance.count({ where }),
    ]);

    res.json({
      attendance,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Get attendance error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getAttendanceByStudent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { studentId } = req.params;
    const { startDate, endDate, page = '1', limit = '30' } = req.query;

    const where: any = { studentId };

    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string),
      };
    }

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const [attendance, total] = await Promise.all([
      prisma.attendance.findMany({
        where,
        orderBy: { date: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.attendance.count({ where }),
    ]);

    res.json({
      attendance,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Get attendance by student error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateAttendance = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['PRESENT', 'ABSENT', 'LATE'];
    if (!status || !validStatuses.includes(status.toUpperCase())) {
      res.status(400).json({ error: 'Status must be PRESENT, ABSENT, or LATE' });
      return;
    }

    const existingAttendance = await prisma.attendance.findUnique({ where: { id } });
    if (!existingAttendance) {
      res.status(404).json({ error: 'Attendance record not found' });
      return;
    }

    const attendance = await prisma.attendance.update({
      where: { id },
      data: { status: status.toUpperCase() },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            rollNo: true,
          },
        },
      },
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

    const existingAttendance = await prisma.attendance.findUnique({ where: { id } });
    if (!existingAttendance) {
      res.status(404).json({ error: 'Attendance record not found' });
      return;
    }

    await prisma.attendance.delete({ where: { id } });

    res.json({ message: 'Attendance deleted successfully' });
  } catch (error) {
    console.error('Delete attendance error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getAttendanceStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { startDate, endDate, studentId } = req.query;

    const where: any = {};

    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string),
      };
    }

    if (studentId) {
      where.studentId = studentId;
    }

    const [total, present, absent, late, studentsWithAttendance] = await Promise.all([
      prisma.attendance.count({ where }),
      prisma.attendance.count({ where: { ...where, status: 'PRESENT' } }),
      prisma.attendance.count({ where: { ...where, status: 'ABSENT' } }),
      prisma.attendance.count({ where: { ...where, status: 'LATE' } }),
      prisma.attendance.groupBy({
        by: ['studentId'],
        _count: true,
      }),
    ]);

    const totalStudents = await prisma.student.count();
    const attendanceRate = total > 0 ? Math.round(((present + late) / total) * 100) : 0;

    res.json({
      totalRecords: total,
      present,
      absent,
      late,
      attendanceRate: `${attendanceRate}%`,
      totalStudents,
      studentsMarked: studentsWithAttendance.length,
    });
  } catch (error) {
    console.error('Get attendance stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const bulkMarkAttendance = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { records } = req.body;

    if (!records || !Array.isArray(records)) {
      res.status(400).json({ error: 'Records array is required' });
      return;
    }

    const validStatuses: AttendanceStatus[] = ['PRESENT', 'ABSENT', 'LATE'];

    const results = await Promise.all(
      records.map(async (record: { studentId: string; date: string; status: string }) => {
        const status: AttendanceStatus = validStatuses.includes(record.status.toUpperCase() as AttendanceStatus) 
          ? record.status.toUpperCase() as AttendanceStatus 
          : 'PRESENT';
        return prisma.attendance.upsert({
          where: {
            studentId_date: {
              studentId: record.studentId,
              date: new Date(record.date),
            },
          },
          update: { status },
          create: {
            studentId: record.studentId,
            date: new Date(record.date),
            status,
          },
        });
      })
    );

    res.status(201).json({ message: 'Attendance marked successfully', count: results.length, records: results });
  } catch (error) {
    console.error('Bulk mark attendance error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const markAllPresent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { date } = req.body;

    if (!date) {
      res.status(400).json({ error: 'Date is required' });
      return;
    }

    const students = await prisma.student.findMany({
      select: { id: true },
    });

    const records = students.map((student) => ({
      studentId: student.id,
      date,
      status: 'PRESENT',
    }));

    const results = await Promise.all(
      records.map(async (record) => {
        return prisma.attendance.upsert({
          where: {
            studentId_date: {
              studentId: record.studentId,
              date: new Date(record.date),
            },
          },
          update: { status: 'PRESENT' as AttendanceStatus },
          create: {
            studentId: record.studentId,
            date: new Date(record.date),
            status: 'PRESENT' as AttendanceStatus,
          },
        });
      })
    );

    res.status(201).json({ 
      message: 'All students marked present', 
      count: results.length 
    });

    const presentCount = results.length;
    const dateFormatted = new Date(date).toLocaleDateString('en-IN');
    await createNotificationForAdmins(
      'Attendance Marked',
      `All ${presentCount} students marked present for ${dateFormatted}`,
      'attendance'
    );
  } catch (error) {
    console.error('Mark all present error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
