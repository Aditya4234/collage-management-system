import { Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';
import { createNotificationForAdmins } from '../lib/notifications';

export const createStudent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, email, rollNo, phone, course, semester, address, fatherName, admissionDate } = req.body;

    if (!name || !email || !rollNo) {
      res.status(400).json({ error: 'Name, email, and roll number are required' });
      return;
    }

    const existingStudent = await prisma.student.findFirst({
      where: {
        OR: [{ email }, { rollNo }],
      },
    });

    if (existingStudent) {
      res.status(400).json({ error: 'Student with this email or roll number already exists' });
      return;
    }

    const student = await prisma.student.create({
      data: {
        name,
        email,
        rollNo,
        phone: phone || null,
        course: course || null,
        semester: semester || null,
        address: address || null,
        fatherName: fatherName || null,
        admissionDate: admissionDate ? new Date(admissionDate) : null,
      },
    });

    await createNotificationForAdmins(
      'New Student Admission',
      `${name} has been admitted with roll number ${rollNo}`,
      'student'
    );

    res.status(201).json({ message: 'Student created successfully', student });
  } catch (error) {
    console.error('Create student error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getStudents = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { page = '1', limit = '10', search, course, semester } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
        { rollNo: { contains: search as string, mode: 'insensitive' } },
        { phone: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    if (course) {
      where.course = course;
    }

    if (semester) {
      where.semester = semester;
    }

    const [students, total] = await Promise.all([
      prisma.student.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          rollNo: true,
          phone: true,
          course: true,
          semester: true,
          address: true,
          fatherName: true,
          admissionDate: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.student.count({ where }),
    ]);

    res.json({
      students,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getStudentById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        attendance: {
          orderBy: { date: 'desc' },
          take: 30,
        },
      },
    });

    if (!student) {
      res.status(404).json({ error: 'Student not found' });
      return;
    }

    res.json(student);
  } catch (error) {
    console.error('Get student by ID error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateStudent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, email, rollNo, phone, course, semester, address, fatherName, admissionDate } = req.body;

    const existingStudent = await prisma.student.findUnique({ where: { id } });
    if (!existingStudent) {
      res.status(404).json({ error: 'Student not found' });
      return;
    }

    if (email !== existingStudent.email || rollNo !== existingStudent.rollNo) {
      const duplicate = await prisma.student.findFirst({
        where: {
          id: { not: id },
          OR: [{ email }, { rollNo }],
        },
      });

      if (duplicate) {
        res.status(400).json({ error: 'Email or roll number already in use' });
        return;
      }
    }

    const student = await prisma.student.update({
      where: { id },
      data: {
        name: name || existingStudent.name,
        email: email || existingStudent.email,
        rollNo: rollNo || existingStudent.rollNo,
        phone: phone !== undefined ? phone : existingStudent.phone,
        course: course !== undefined ? course : existingStudent.course,
        semester: semester !== undefined ? semester : existingStudent.semester,
        address: address !== undefined ? address : existingStudent.address,
        fatherName: fatherName !== undefined ? fatherName : existingStudent.fatherName,
        admissionDate: admissionDate !== undefined 
          ? (admissionDate ? new Date(admissionDate) : null) 
          : existingStudent.admissionDate,
      },
    });

    res.json({ message: 'Student updated successfully', student });
  } catch (error) {
    console.error('Update student error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteStudent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const existingStudent = await prisma.student.findUnique({ where: { id } });
    if (!existingStudent) {
      res.status(404).json({ error: 'Student not found' });
      return;
    }

    await prisma.student.delete({ where: { id } });

    res.json({ message: 'Student deleted successfully' });
  } catch (error) {
    console.error('Delete student error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getStudentStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const total = await prisma.student.count();
    
    const courses = await prisma.student.groupBy({
      by: ['course'],
      _count: true,
    });

    res.json({
      totalStudents: total,
      byCourse: courses.map(c => ({
        course: c.course || 'Not Specified',
        count: c._count,
      })),
    });
  } catch (error) {
    console.error('Get student stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
