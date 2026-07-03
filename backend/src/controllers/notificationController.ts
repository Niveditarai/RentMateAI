import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { dbService } from '../config/db';

// Get user notifications
export const getNotifications = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const notifications = await dbService.getCollection('notifications').find({ userId });

    // Sort by newest first
    notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return res.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return res.status(500).json({ message: 'Error fetching notifications' });
  }
};

// Mark notification as read
export const markRead = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const notificationId = req.params.id;
    const userId = req.user?.id;

    const notif = await dbService.getCollection('notifications').findById(notificationId);
    if (!notif) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    if (notif.userId !== userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const updated = await dbService.getCollection('notifications').findByIdAndUpdate(notificationId, { read: true });

    return res.json(updated);
  } catch (error) {
    console.error('Error marking notification read:', error);
    return res.status(500).json({ message: 'Error updating notification' });
  }
};

// Mark all as read
export const markAllRead = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    const notifications = await dbService.getCollection('notifications').find({ userId, read: false });

    for (const notif of notifications) {
      await dbService.getCollection('notifications').findByIdAndUpdate(notif._id, { read: true });
    }

    return res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all notifications read:', error);
    return res.status(500).json({ message: 'Error updating notifications' });
  }
};
