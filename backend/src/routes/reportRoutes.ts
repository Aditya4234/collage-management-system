import { Router } from 'express';
import { generateAttendanceReport, generateStudentReport, downloadReport } from '../controllers/reportController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.post('/generate', authMiddleware, generateAttendanceReport);
router.post('/students', authMiddleware, generateStudentReport);
router.post('/download', authMiddleware, downloadReport);

export default router;