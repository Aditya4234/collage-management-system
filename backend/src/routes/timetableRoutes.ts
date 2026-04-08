import { Router } from 'express';
import { getTimetable, createTimetableEntry, updateTimetableEntry, deleteTimetableEntry } from '../controllers/timetableController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.get('/', authMiddleware, getTimetable);
router.post('/', authMiddleware, createTimetableEntry);
router.put('/:id', authMiddleware, updateTimetableEntry);
router.delete('/:id', authMiddleware, deleteTimetableEntry);

export default router;