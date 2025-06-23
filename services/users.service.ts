

import { api } from './api';

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  profileImage?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
  };
  phone?: string;
}

export const getUser = async (userId: string): Promise<User | null> => {
  if (!userId) {
    console.warn('getUser called with no userId');
    return null;
  }
  try {
    const response = await api.get(`/auth/user/${userId}`);
    if (response.data) {
      const { id, uid, username, role, profileImage } = response.data;
      return {
        id: id || uid,
        name: username,
        email: '', // Public profile does not expose email
        role: role,
        profileImage: profileImage,
      };
    }
    return null;
  } catch (error) {
    console.error(`Error fetching user ${userId}:`, error);
    return null;
  }
};