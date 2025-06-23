import React, { createContext, useContext, useState, useEffect } from 'react';
import { notificationTypes } from '../data/notificationData';
import { Platform, Alert, Vibration } from 'react-native';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useAuth } from './AuthContext';

// Define type for notification types from data
interface NotificationType {
  icon: string;
  color: string;
  importance: string;
}

export interface Notification {
  id: number;
  title: string;
  message: string;
  read: boolean;
  time: string;
  type: string;
  actionable?: boolean;
  action?: string;
  priority?: 'low' | 'medium' | 'high';
  productId?: string;
  orderId?: string;
  appointmentId?: string;
  collectionId?: string;
  transactionId?: string;
  role?: 'renter' | 'freelancer';
}

type FilterType = 'all' | 'unread' | 'high-priority' | string;

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  showNotificationPanel: boolean;
  setShowNotificationPanel: (show: boolean) => void;
  markAsRead: (id: number) => void;
  markAllAsRead: () => void;
  addNotification: (notification: Omit<Notification, 'id' | 'read' | 'time'>) => number;
  deleteNotification: (id: number) => void;
  handleNotificationAction: (notification: Notification) => void;
  filterNotifications: (filter: FilterType) => Notification[];
  activeFilter: FilterType;
  setActiveFilter: (filter: FilterType) => void;
  simulatePushNotification: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Type-safe notificationTypes lookup
const getNotificationImportance = (type: string): string => {
  const typeConfig = (notificationTypes as Record<string, NotificationType>)[type];
  return typeConfig ? typeConfig.importance : 'low';
};

import { notificationService } from '../app/services/notification.service';

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user, token } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotificationPanel, setShowNotificationPanel] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  
  // Calculate unread count whenever notifications change
  const unreadCount = notifications.filter(notification => !notification.read).length;

  // Filter notifications based on criteria
  const filterNotifications = (filter: FilterType): Notification[] => {
    switch(filter) {
      case 'unread':
        return notifications.filter(n => !n.read);
      case 'high-priority':
        return notifications.filter(n => n.priority === 'high' || 
          getNotificationImportance(n.type) === 'high');
      case 'all':
        return notifications;
      default:
        // Filter by type
        return notifications.filter(n => n.type === filter);
    }
  };

  // Debug logging for state changes
  useEffect(() => {
    console.log("NotificationContext: Panel visibility state changed:", showNotificationPanel);
  }, [showNotificationPanel]);

  useEffect(() => {
    console.log("NotificationContext: Notifications updated, count:", notifications.length);
    console.log("NotificationContext: Unread count:", unreadCount);
  }, [notifications, unreadCount]);

  const markAsRead = (id: number) => {
    console.log("NotificationContext: Marking notification as read:", id);
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  };

  const markAllAsRead = () => {
    console.log("NotificationContext: Marking all notifications as read");
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  const deleteNotification = (id: number) => {
    console.log("NotificationContext: Deleting notification:", id);
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  const handleNotificationAction = (notification: Notification) => {
    console.log("NotificationContext: Handling action for notification:", notification.id, notification.action);
    
    // Mark notification as read when handling its action
    markAsRead(notification.id);
    
    // Close notification panel
    setShowNotificationPanel(false);
    
    // Handle different action types
    switch(notification.action) {
      case 'view_order':
        if (notification.orderId) {
          // The paths are likely correct, but Expo's typed routes might be stale.
          // Using 'as any' to bypass the type checker for now.
          const path = user?.role === 'freelancer' ? `/(freelancer)/booking-details` : `/(renter)/bookings`;
          router.push({ pathname: path, params: { id: notification.orderId } } as any);
        }
        break;
      case 'view_product':
        if (notification.productId) {
          router.push({ pathname: `/(renter)/product-details`, params: { id: notification.productId } } as any);
        }
        break;
      case 'view_collection':
        if (notification.collectionId) {
          router.push({ pathname: `/(renter)/products`, params: { collection: notification.collectionId } } as any);
        }
        break;
      case 'edit_profile':
        if (user?.role) {
          const path = user.role === 'freelancer' ? `/(freelancer)/profile` : `/(renter)/profile`;
          router.push(path as any);
        }
        break;
      case 'view_appointment':
        if (notification.appointmentId) {
          router.push({ pathname: `/(renter)/appointment-details`, params: { id: notification.appointmentId } } as any);
        }
        break;
      case 'leave_review':
        if (notification.productId) {
          Alert.alert('Review Product', `Leave a review for ${notification.productId}`);
        }
        break;
      case 'view_receipt':
        if (notification.transactionId) {
          Alert.alert('Transaction Receipt', `Receipt for transaction ${notification.transactionId}`);
        }
        break;
      default:
        console.log("No specific action for this notification type");
    }
  };

  const addNotification = (notification: Omit<Notification, 'id' | 'read' | 'time'>) => {
    console.log("NotificationContext: Adding new notification:", notification.title);
    const newNotification: Notification = {
      ...notification,
      id: Date.now(),
      read: false,
      time: 'Just now'
    };
    
    setNotifications(prev => [newNotification, ...prev]);
    
    // Provide haptic feedback for new notifications if available
    if (Platform.OS !== 'web') {
      try {
        Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success
        );
      } catch (error) {
        // Fallback to vibration if haptics not available
        Vibration.vibrate(300);
      }
    }
    
    return newNotification.id;
  };

  // Simulate receiving a push notification
  const simulatePushNotification = () => {
    // Define possible notifications with correct types
    type PossibleNotification = Omit<Notification, 'id' | 'read' | 'time'>;
    
    // Array of possible notifications to simulate
    const possibleNotifications: PossibleNotification[] = [
      {
        title: "Flash Sale: 50% Off!",
        message: "Don't miss our 24-hour flash sale on all formal dresses",
        type: "promotion",
        actionable: true,
        action: "view_collection",
        collectionId: "flash-sale"
      },
      {
        title: "Your dress is ready",
        message: "Your rented dress is ready for pickup at our store",
        type: "status",
        actionable: true,
        action: "view_order",
        orderId: "OR" + Math.floor(10000 + Math.random() * 90000)
      },
      {
        title: "Measurements needed",
        message: "Please update your measurements for your upcoming rental",
        type: "profile",
        actionable: true,
        action: "edit_profile",
        priority: "high" as const
      },
      {
        title: "New collection: Summer Styles",
        message: "Check out our new summer collection perfect for beach events",
        type: "product",
        actionable: true,
        action: "view_collection",
        collectionId: "summer-2023"
      }
    ];
    
    // Select a random notification
    const randomNotification = possibleNotifications[Math.floor(Math.random() * possibleNotifications.length)];
    
    // Add the notification
    const notificationId = addNotification(randomNotification);
    
    // Show an alert to simulate push notification
    if (Platform.OS !== 'web') {
      Alert.alert(
        randomNotification.title,
        randomNotification.message,
        [
          {
            text: "View",
            onPress: () => {
              setShowNotificationPanel(true);
              // Find the notification we just added
              const notification = notifications.find(n => n.id === notificationId);
              if (notification && notification.actionable) {
                handleNotificationAction(notification);
              }
            }
          },
          {
            text: "Dismiss",
            style: "cancel"
          }
        ]
      );
    }
  };

  // Safely toggle notification panel
  const safeSetShowNotificationPanel = (show: boolean) => {
    console.log("NotificationContext: Setting panel visibility to:", show);
    if (Platform.OS !== 'web') {
      setTimeout(() => {
        setShowNotificationPanel(show);
      }, 0);
    } else {
      setShowNotificationPanel(show);
    }
  };

  // Fetch notifications from backend when token changes
  useEffect(() => {
    if (token) {
      notificationService.getAll(token)
        .then((backendNotifications) => {
          // Map backend notifications to frontend Notification type
          const mapped = backendNotifications.map((n: any) => ({
            id: Date.parse(n.createdAt) + Math.floor(Math.random() * 10000), // unique enough for list
            title: n.title,
            message: n.body,
            read: n.isRead,
            time: new Date(n.createdAt).toLocaleString(),
            type: n.type,
            // Optionally add more mapping if needed
            productId: n.data?.productId,
            orderId: n.data?.bookingId,
            // ...other fields as needed
          }));
          setNotifications(mapped);
        })
        .catch(err => console.error('Failed to fetch notifications', err));
    } else {
      setNotifications([]);
    }
  }, [token]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        showNotificationPanel,
        setShowNotificationPanel: safeSetShowNotificationPanel,
        markAsRead,
        markAllAsRead,
        addNotification,
        deleteNotification,
        handleNotificationAction,
        filterNotifications,
        activeFilter,
        setActiveFilter,
        simulatePushNotification
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    console.error("useNotifications must be used within a NotificationProvider");
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
} 