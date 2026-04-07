import { Router } from 'express';
import {
  markAttendance,
  getAttendance,
  getAttendanceByStudent,
  updateAttendance,
  deleteAttendance,
  getAttendanceStats,
  bulkMarkAttendance,
  markAllPresent,
} from '../controllers/attendanceController';
import { authMiddleware, adminMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

router.post('/', markAttendance);
router.post('/bulk', adminMiddleware, bulkMarkAttendance);
router.post('/mark-all', adminMiddleware, markAllPresent);
router.get('/', getAttendance);
router.get('/stats', getAttendanceStats);
router.get('/student/:studentId', getAttendanceByStudent);
router.put('/:id', adminMiddleware, updateAttendance);
router.delete('/:id', adminMiddleware, deleteAttendance);

export default router;
