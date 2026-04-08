import { Request, Response } from 'express';

interface MockStudent {
  id: string;
  name: string;
  rollNo: string;
  email: string;
  phone: string;
  course: string;
  semester: string;
  admissionDate: string;
}

interface MockAttendance {
  id: string;
  studentId: string;
  studentName: string;
  date: string;
  status: 'present' | 'absent' | 'late';
}

const mockStudents: MockStudent[] = [
  { id: '1', name: 'Rahul Kumar', rollNo: 'CS001', email: 'rahul@example.com', phone: '1234567890', course: 'Computer Science', semester: '6th', admissionDate: '2024-01-15' },
  { id: '2', name: 'Priya Singh', rollNo: 'CS002', email: 'priya@example.com', phone: '1234567891', course: 'Computer Science', semester: '6th', admissionDate: '2024-01-15' },
  { id: '3', name: 'Amit Sharma', rollNo: 'CS003', email: 'amit@example.com', phone: '1234567892', course: 'Computer Science', semester: '6th', admissionDate: '2024-01-15' },
  { id: '4', name: 'Sneha Gupta', rollNo: 'CS004', email: 'sneha@example.com', phone: '1234567893', course: 'Computer Science', semester: '6th', admissionDate: '2024-01-16' },
  { id: '5', name: 'Rohit Verma', rollNo: 'CS005', email: 'rohit@example.com', phone: '1234567894', course: 'Computer Science', semester: '6th', admissionDate: '2024-01-16' },
];

const mockAttendance: MockAttendance[] = [
  { id: '1', studentId: '1', studentName: 'Rahul Kumar', date: '2026-04-01', status: 'present' },
  { id: '2', studentId: '2', studentName: 'Priya Singh', date: '2026-04-01', status: 'present' },
  { id: '3', studentId: '3', studentName: 'Amit Sharma', date: '2026-04-01', status: 'present' },
  { id: '4', studentId: '4', studentName: 'Sneha Gupta', date: '2026-04-01', status: 'absent' },
  { id: '5', studentId: '5', studentName: 'Rohit Verma', date: '2026-04-01', status: 'late' },
  { id: '6', studentId: '1', studentName: 'Rahul Kumar', date: '2026-04-02', status: 'present' },
  { id: '7', studentId: '2', studentName: 'Priya Singh', date: '2026-04-02', status: 'present' },
  { id: '8', studentId: '3', studentName: 'Amit Sharma', date: '2026-04-02', status: 'late' },
  { id: '9', studentId: '4', studentName: 'Sneha Gupta', date: '2026-04-02', status: 'present' },
  { id: '10', studentId: '5', studentName: 'Rohit Verma', date: '2026-04-02', status: 'present' },
];

export const generateAttendanceReport = async (req: Request, res: Response) => {
  try {
    const { dateFrom, dateTo, reportType } = req.body;
    
    let startDate = dateFrom || '2026-04-01';
    let endDate = dateTo || '2026-04-06';

    const filteredAttendance = mockAttendance.filter(a => a.date >= startDate && a.date <= endDate);

    const summary = mockStudents.map(student => {
      const studentAttendance = filteredAttendance.filter(a => a.studentId === student.id);
      const present = studentAttendance.filter(a => a.status === 'present').length;
      const absent = studentAttendance.filter(a => a.status === 'absent').length;
      const late = studentAttendance.filter(a => a.status === 'late').length;
      const total = studentAttendance.length;
      const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

      return {
        studentId: student.id,
        name: student.name,
        rollNo: student.rollNo,
        course: student.course,
        present,
        absent,
        late,
        totalDays: total,
        percentage,
      };
    });

    const stats = {
      totalStudents: mockStudents.length,
      totalRecords: filteredAttendance.length,
      overallAttendance: summary.length > 0 
        ? Math.round(summary.reduce((acc, s) => acc + s.percentage, 0) / summary.length)
        : 0,
      dateRange: {
        from: startDate,
        to: endDate,
      },
    };

    res.json({ stats, summary, reportType: reportType || 'attendance' });
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({ error: 'Failed to generate report' });
  }
};

export const generateStudentReport = async (req: Request, res: Response) => {
  try {
    const { dateFrom, dateTo } = req.body;
    
    const report = mockStudents.map(student => ({
      id: student.id,
      name: student.name,
      rollNo: student.rollNo,
      email: student.email,
      phone: student.phone,
      course: student.course,
      semester: student.semester,
      admissionDate: student.admissionDate,
      attendanceCount: mockAttendance.filter(a => a.studentId === student.id).length,
    }));

    res.json({ report, totalStudents: mockStudents.length });
  } catch (error) {
    console.error('Error generating student report:', error);
    res.status(500).json({ error: 'Failed to generate student report' });
  }
};

export const downloadReport = async (req: Request, res: Response) => {
  try {
    const { dateFrom, dateTo, format } = req.body;
    
    let startDate = dateFrom || '2026-04-01';
    let endDate = dateTo || '2026-04-06';

    const filteredAttendance = mockAttendance.filter(a => a.date >= startDate && a.date <= endDate);

    const rows = mockStudents.map(student => {
      const studentAttendance = filteredAttendance.filter(a => a.studentId === student.id);
      const present = studentAttendance.filter(a => a.status === 'present').length;
      const total = studentAttendance.length;
      return [student.name, student.rollNo, student.course, String(present), String(total)];
    });

    const csvContent = [
      ['Name', 'Roll No', 'Course', 'Present', 'Total Days'].join(','),
      ...rows.map(r => r.join(',')),
    ].join('\n');

    if (format === 'pdf') {
      res.json({ 
        message: 'PDF generation not implemented yet',
        csvData: csvContent 
      });
    } else {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="report_${Date.now()}.csv"`);
      res.send(csvContent);
    }
  } catch (error) {
    console.error('Error downloading report:', error);
    res.status(500).json({ error: 'Failed to download report' });
  }
};