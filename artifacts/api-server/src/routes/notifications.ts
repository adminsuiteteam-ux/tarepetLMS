import { Router, type IRouter, type Request, type Response } from "express";

export interface NotificationRecord {
  id: string;
  role: 'ADMIN' | 'TEACHER' | 'STUDENT' | 'PARENT';
  type: 'info' | 'success' | 'warning' | 'exam' | 'fee' | 'attendance';
  title: string;
  message: string;
  read: boolean;
  time: string;
}

// In-memory / database persistent backing store for Express API server
let inMemoryNotifications: NotificationRecord[] = [
  {
    id: 'adm-1', role: 'ADMIN', type: 'info', read: false,
    title: 'New Student Enrolled',
    message: 'Chisom Adeyemi has been enrolled in SS1 Science.',
    time: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
  },
  {
    id: 'adm-2', role: 'ADMIN', type: 'fee', read: false,
    title: 'Fee Payment Received',
    message: 'Daniel Obi (JSS2) completed ₦85,000 term fee payment.',
    time: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
  },
  {
    id: 'tch-1', role: 'TEACHER', type: 'exam', read: false,
    title: 'CBT Exam Approved',
    message: 'Your Mathematics CBT exam has been approved and is now live.',
    time: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
  },
  {
    id: 'stu-1', role: 'STUDENT', type: 'exam', read: false,
    title: 'CBT Exam Available',
    message: 'Mathematics CBT (MTH-101) is now available. Ends in 48 hours.',
    time: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
  },
  {
    id: 'par-1', role: 'PARENT', type: 'attendance', read: false,
    title: 'Attendance Alert',
    message: 'Your ward was marked absent on Monday, August 5th.',
    time: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
  },
];

const router: IRouter = Router();

// GET /notifications?role=STUDENT
router.get("/notifications", (req: Request, res: Response) => {
  const role = req.query.role as string | undefined;
  let result = inMemoryNotifications;
  if (role) {
    result = result.filter(n => n.role.toUpperCase() === role.toUpperCase());
  }
  res.json({
    success: true,
    notifications: result,
    unread_count: result.filter(n => !n.read).length,
  });
});

// POST /notifications
router.post("/notifications", (req: Request, res: Response) => {
  const { role, type, title, message } = req.body;
  if (!role || !title || !message) {
    res.status(400).json({ error: "Missing required notification fields (role, title, message)" });
    return;
  }
  const newNotif: NotificationRecord = {
    id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    role: role.toUpperCase(),
    type: type || 'info',
    title,
    message,
    read: false,
    time: new Date().toISOString(),
  };
  inMemoryNotifications.unshift(newNotif);
  res.status(201).json({ success: true, notification: newNotif });
});

// POST /notifications/:id/read
router.post("/notifications/:id/read", (req: Request, res: Response) => {
  const { id } = req.params;
  const notif = inMemoryNotifications.find(n => n.id === id);
  if (!notif) {
    res.status(404).json({ error: "Notification not found" });
    return;
  }
  notif.read = true;
  res.json({ success: true, notification: notif });
});

// POST /notifications/read-all
router.post("/notifications/read-all", (req: Request, res: Response) => {
  const { role } = req.body;
  inMemoryNotifications = inMemoryNotifications.map(n => {
    if (!role || n.role.toUpperCase() === (role as string).toUpperCase()) {
      return { ...n, read: true };
    }
    return n;
  });
  res.json({ success: true, message: "All notifications marked as read." });
});

// DELETE /notifications/:id
router.delete("/notifications/:id", (req: Request, res: Response) => {
  const { id } = req.params;
  inMemoryNotifications = inMemoryNotifications.filter(n => n.id !== id);
  res.json({ success: true, message: "Notification cleared." });
});

// DELETE /notifications/clear-all
router.delete("/notifications/clear-all", (req: Request, res: Response) => {
  const { role } = req.body;
  if (role) {
    inMemoryNotifications = inMemoryNotifications.filter(n => n.role.toUpperCase() !== (role as string).toUpperCase());
  } else {
    inMemoryNotifications = [];
  }
  res.json({ success: true, message: "All role notifications cleared." });
});

export default router;
