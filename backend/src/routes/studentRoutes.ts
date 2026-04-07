import { Router } from 'express';
import {
  createStudent,
  getStudents,
  getStudentById,
  updateStudent,
  deleteStudent,
  getStudentStats,
} from '../controllers/studentController';
import { authMiddleware, adminMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

router.post('/', adminMiddleware, createStudent);
router.get('/', getStudents);
router.get('/stats', getStudentStats);
router.get('/:id', getStudentById);
router.put('/:id', adminMiddleware, updateStudent);
router.delete('/:id', adminMiddleware, deleteStudent);

export default router;
