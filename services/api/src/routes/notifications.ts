import { Router, Response } from "express";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import {
  getUserNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
} from "../services/notificationService";

const router = Router();

/** GET /api/notifications */
router.get("/", authMiddleware, async (req: AuthRequest, res: Response) => {
  const notifications = await getUserNotifications(req.user!._id.toString());
  const unreadCount = await getUnreadCount(req.user!._id.toString());

  res.json({
    success: true,
    data: { notifications, unreadCount },
  });
});

/** GET /api/notifications/unread-count */
router.get("/unread-count", authMiddleware, async (req: AuthRequest, res: Response) => {
  const count = await getUnreadCount(req.user!._id.toString());
  res.json({ success: true, data: { count } });
});

/** PATCH /api/notifications/:id/read */
router.patch("/:id/read", authMiddleware, async (req: AuthRequest, res: Response) => {
  const notification = await markNotificationRead(
    req.user!._id.toString(),
    req.params.id as string
  );
  if (!notification) {
    res.status(404).json({ success: false, error: "Notification not found" });
    return;
  }
  res.json({ success: true, data: notification });
});

/** POST /api/notifications/read-all */
router.post("/read-all", authMiddleware, async (req: AuthRequest, res: Response) => {
  await markAllNotificationsRead(req.user!._id.toString());
  res.json({ success: true, message: "All notifications marked as read" });
});

export default router;
