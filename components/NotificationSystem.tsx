import React from 'react';
import { useNotifications } from '../contexts/NotificationContext';
import NotificationBell from './NotificationBell';
import { usePathname } from 'expo-router';

const NotificationSystem = () => {
  const { unreadCount } = useNotifications();
  
  // Get current route to determine if we're on the notifications page
  const pathname = usePathname();
  const isOnNotificationsPage = pathname === '/(tabs)/notifications';
  
  return (
    <NotificationBell
      unreadCount={unreadCount}
      isActive={isOnNotificationsPage}
    />
  );
};

export default NotificationSystem; 