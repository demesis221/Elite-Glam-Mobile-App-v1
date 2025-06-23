import { api } from './api';

export interface Notification {
  _id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  data?: any;
  isRead: boolean;
  createdAt: string;
}

export const notificationService = {
  async getAll(token: string): Promise<Notification[]> {
    const res = await api.get('/notifications', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  },

  async markAllAsRead(token: string) {
    await api.post(
      '/notifications/mark-read',
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
  },
};
