import { Request, Response } from 'express';

const mockTimetable = [
  { id: 1, day: 'Monday', time: '09:00 - 10:00', subject: 'Data Structures', room: 'Room 101' },
  { id: 2, day: 'Monday', time: '10:00 - 11:00', subject: 'Database Management', room: 'Room 102' },
  { id: 3, day: 'Monday', time: '11:15 - 12:15', subject: 'Operating Systems', room: 'Room 103' },
  { id: 4, day: 'Tuesday', time: '09:00 - 10:00', subject: 'Database Management', room: 'Room 102' },
  { id: 5, day: 'Tuesday', time: '10:00 - 11:00', subject: 'Data Structures', room: 'Room 101' },
];

let timetableStore: any[] = [...mockTimetable];
let nextId = 6;

export const getTimetable = async (req: Request, res: Response) => {
  try {
    res.json(timetableStore);
  } catch (error) {
    console.error('Error fetching timetable:', error);
    res.status(500).json({ error: 'Failed to fetch timetable' });
  }
};

export const createTimetableEntry = async (req: Request, res: Response) => {
  try {
    const { day, time, subject, room } = req.body;
    const entry = { id: nextId++, day, time, subject, room };
    timetableStore.push(entry);
    res.json(entry);
  } catch (error) {
    console.error('Error creating timetable entry:', error);
    res.status(500).json({ error: 'Failed to create timetable entry' });
  }
};

export const updateTimetableEntry = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { day, time, subject, room } = req.body;
    const index = timetableStore.findIndex(e => e.id === parseInt(id));
    if (index >= 0) {
      timetableStore[index] = { ...timetableStore[index], day, time, subject, room };
      res.json(timetableStore[index]);
    } else {
      res.status(404).json({ error: 'Entry not found' });
    }
  } catch (error) {
    console.error('Error updating timetable entry:', error);
    res.status(500).json({ error: 'Failed to update timetable entry' });
  }
};

export const deleteTimetableEntry = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    timetableStore = timetableStore.filter(e => e.id !== parseInt(id));
    res.json({ message: 'Timetable entry deleted' });
  } catch (error) {
    console.error('Error deleting timetable entry:', error);
    res.status(500).json({ error: 'Failed to delete timetable entry' });
  }
};