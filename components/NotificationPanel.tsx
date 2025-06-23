import React, { useState, forwardRef, useEffect, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SectionList,
  TouchableOpacity, 
  Animated,
  Dimensions,
  TouchableWithoutFeedback,
  Platform,
  Image,
  ScrollView
} from 'react-native';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { Swipeable } from 'react-native-gesture-handler';
import { formatDistanceToNow, format, isToday, isYesterday, isThisWeek } from 'date-fns';
import { Notification } from '../contexts/NotificationContext';
import { notificationTypes } from '../data/notificationData';

// If BlurView causes issues, we can handle it safely
let BlurView: any = View;
try {
  BlurView = require('expo-blur').BlurView;
} catch (error) {
  console.log('expo-blur not available, using fallback');
}

interface NotificationPanelProps {
  visible: boolean;
  notifications: Notification[];
  onClose: () => void;
  onMarkAsRead: (id: number) => void;
  onMarkAllAsRead: () => void;
  onDeleteNotification?: (id: number) => void;
  onNotificationAction?: (notification: Notification) => void;
}

type FilterType = 'all' | 'unread' | 'high-priority' | string;

// Avatar/image mapping for notification types
const getAvatarByType = (type: string) => {
  switch (type) {
    case 'product':
      return require('../assets/images/Gown.png');
    case 'reminder':
      return null; // We'll use an icon for reminders
    case 'price':
      return require('../assets/images/dressProduct.png');
    case 'status':
      return null; // We'll use an icon for status updates
    case 'system':
      return null; // We'll use an icon for system notifications
    default:
      return null;
  }
};

// Format timestamp to human-readable format
const formatTimestamp = (timestamp: string) => {
  // Try to parse the time string into a date object
  try {
    // Check if it's a relative format already like "2 hours ago"
    if (timestamp.includes('ago') || timestamp === 'Just now') {
      return timestamp;
    }
    
    // Check if it's "Yesterday"
    if (timestamp === 'Yesterday') {
      return 'Yesterday';
    }

    // Try to parse as date if it's something like "2023-04-15" or other format
    const date = new Date(timestamp);
    if (!isNaN(date.getTime())) {
      if (isToday(date)) {
        return formatDistanceToNow(date, { addSuffix: true });
      }
      if (isYesterday(date)) {
        return 'Yesterday';
      }
      if (isThisWeek(date)) {
        return format(date, 'EEEE'); // e.g. "Monday"
      }
      return format(date, 'MMM d'); // e.g. "Apr 15"
    }
    
    // Fallback if parsing fails
    return timestamp;
  } catch (e) {
    // If parsing fails, return the original timestamp
    return timestamp;
  }
};

interface NotificationGroup {
  title: string;
  data: Notification[];
}

const NotificationPanel = forwardRef<View, NotificationPanelProps>(({ 
  visible,
  notifications,
  onClose,
  onMarkAsRead,
  onMarkAllAsRead,
  onDeleteNotification,
  onNotificationAction
}, ref) => {
  const [panelHeight] = useState(Dimensions.get('window').height * (Platform.OS === 'web' ? 0.8 : 0.7));
  const [windowWidth, setWindowWidth] = useState(Dimensions.get('window').width);
  const slideAnim = React.useRef(new Animated.Value(visible ? 0 : -400)).current;
  const fadeAnim = React.useRef(new Animated.Value(visible ? 1 : 0)).current;
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  // Update dimensions on window resize (for web)
  useEffect(() => {
    if (Platform.OS === 'web') {
      const handleResize = () => {
        setWindowWidth(Dimensions.get('window').width);
      };
      
      // The way to handle dimension changes varies by React Native version
      const subscription = Dimensions.addEventListener('change', handleResize);
      
      return () => {
        // Modern API uses subscription object
        if (subscription && typeof subscription.remove === 'function') {
          subscription.remove();
        }
      };
    }
  }, []);

  // Filter notifications based on active filter
  const filteredNotifications = useMemo(() => {
    if (activeFilter === 'all') {
      return notifications;
    } else if (activeFilter === 'unread') {
      return notifications.filter(notification => !notification.read);
    } else if (activeFilter === 'high-priority') {
      return notifications.filter(notification => {
        const typeConfig = (notificationTypes as Record<string, any>)[notification.type];
        return notification.priority === 'high' || 
          (typeConfig && typeConfig.importance === 'high');
      });
    } else {
      // Filter by type
      return notifications.filter(notification => notification.type === activeFilter);
    }
  }, [notifications, activeFilter]);

  // Group notifications by date
  const groupedNotifications = useMemo(() => {
    const groups: { [key: string]: Notification[] } = {
      'Today': [],
      'Yesterday': [],
      'This Week': [],
      'Earlier': []
    };

    filteredNotifications.forEach(notification => {
      const time = notification.time.toLowerCase();
      if (time.includes('now') || time.includes('minute') || time.includes('hour') || time === 'today') {
        groups['Today'].push(notification);
      } else if (time.includes('yesterday')) {
        groups['Yesterday'].push(notification);
      } else if (time.includes('day') || time.includes('monday') || time.includes('tuesday') || 
                 time.includes('wednesday') || time.includes('thursday') || time.includes('friday') || 
                 time.includes('saturday') || time.includes('sunday')) {
        groups['This Week'].push(notification);
      } else {
        groups['Earlier'].push(notification);
      }
    });

    const result: NotificationGroup[] = [];
    Object.entries(groups).forEach(([title, data]) => {
      if (data.length > 0) {
        result.push({ title, data });
      }
    });

    return result;
  }, [filteredNotifications]);

  // Animation effect when visibility changes
  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -400,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, slideAnim, fadeAnim]);

  const getIconByType = (type: string) => {
    const typeConfig = (notificationTypes as Record<string, any>)[type] || {};
    const iconName = typeConfig.icon || "notifications-outline";
    const iconColor = typeConfig.color || "#6B4EFF";

    switch (type) {
      case 'product':
        return <MaterialIcons name={iconName} size={24} color={iconColor} />;
      case 'reminder':
        return <Ionicons name={iconName} size={24} color={iconColor} />;
      case 'price':
        return <MaterialIcons name={iconName} size={24} color={iconColor} />;
      case 'status':
        return <Ionicons name={iconName} size={24} color={iconColor} />;
      case 'system':
        return <Ionicons name={iconName} size={24} color={iconColor} />;
      case 'profile':
        return <Ionicons name={iconName} size={24} color={iconColor} />;
      case 'appointment':
        return <Ionicons name={iconName} size={24} color={iconColor} />;
      case 'promotion':
        return <Ionicons name={iconName} size={24} color={iconColor} />;
      case 'feedback':
        return <Ionicons name={iconName} size={24} color={iconColor} />;
      case 'payment':
        return <Ionicons name={iconName} size={24} color={iconColor} />;
      default:
        return <Ionicons name="notifications" size={24} color="#6B4EFF" />;
    }
  };

  const renderRightActions = (item: Notification) => {
    return (
      <View style={styles.swipeableActions}>
        <TouchableOpacity 
          style={[styles.swipeAction, styles.markReadAction]}
          onPress={() => onMarkAsRead(item.id)}
        >
          <Ionicons name="checkmark-circle" size={22} color="#FFF" />
          <Text style={styles.swipeActionText}>Mark Read</Text>
        </TouchableOpacity>
        
        {onDeleteNotification && (
          <TouchableOpacity 
            style={[styles.swipeAction, styles.deleteAction]}
            onPress={() => onDeleteNotification(item.id)}
          >
            <Ionicons name="trash-outline" size={22} color="#FFF" />
            <Text style={styles.swipeActionText}>Delete</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const getNotificationTypeColor = (type: string): string => {
    const typeConfig = (notificationTypes as Record<string, any>)[type];
    return typeConfig ? typeConfig.color : "#6B4EFF";
  };

  const renderNotificationItem = ({ item }: { item: Notification }) => {
    const avatar = getAvatarByType(item.type);
    const typeColor = getNotificationTypeColor(item.type);
    
    const handlePress = () => {
      if (item.actionable && onNotificationAction) {
        onNotificationAction(item);
      } else {
        onMarkAsRead(item.id);
      }
    };
    
    const notificationContent = (
      <TouchableOpacity
        style={[
          styles.notificationItem, 
          item.read ? styles.readNotification : styles.unreadNotification,
          item.actionable && styles.actionableNotification
        ]}
        onPress={handlePress}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={`Notification: ${item.title}`}
        accessibilityHint={item.actionable ? "Double tap to perform action" : "Double tap to mark as read"}
      >
        {/* Left Side: Avatar or Icon */}
        <View style={[
          styles.iconContainer, 
          !item.read && styles.unreadIconContainer,
          { backgroundColor: item.read ? '#F5F5F5' : `${typeColor}20` }
        ]}>
          {avatar ? (
            <Image source={avatar} style={styles.avatar} />
          ) : (
            getIconByType(item.type)
          )}
        </View>
        
        {/* Right Side: Content */}
        <View style={styles.notificationContent}>
          <Text 
            style={[
              styles.notificationTitle, 
              item.read ? styles.readText : styles.unreadTitle
            ]}
            numberOfLines={1}
          >
            {item.title}
          </Text>
          <Text 
            style={[styles.notificationMessage, item.read && styles.readText]}
            numberOfLines={2}
          >
            {item.message}
          </Text>
          <Text style={styles.notificationTime}>
            {formatTimestamp(item.time)}
          </Text>

          {/* Action indicator */}
          {item.actionable && (
            <View style={[styles.actionIndicator, { backgroundColor: typeColor }]}>
              <Text style={styles.actionText}>Tap to {getActionText(item.action)}</Text>
            </View>
          )}
        </View>
        
        {/* Unread Indicator */}
        {!item.read && (
          <View style={[styles.unreadDot, { backgroundColor: typeColor }]} />
        )}
      </TouchableOpacity>
    );

    // Helper function to get readable action text
    function getActionText(action?: string): string {
      if (!action) return 'view';
      
      // Convert camelCase or snake_case to readable text
      return action
        .replace(/([A-Z])/g, ' $1') // Add space before capital letters
        .replace(/_/g, ' ') // Replace underscores with spaces
        .replace(/^view /i, '') // Remove leading "view "
        .toLowerCase(); // Convert to lowercase
    }

    // Wrap with Swipeable for swipe actions
    return (
      <Swipeable
        renderRightActions={() => renderRightActions(item)}
        friction={2}
        rightThreshold={40}
      >
        {notificationContent}
      </Swipeable>
    );
  };

  const renderSectionHeader = ({ section }: { section: NotificationGroup }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{section.title}</Text>
    </View>
  );

  const hasUnreadNotifications = filteredNotifications.some(notification => !notification.read);
  const notificationCount = filteredNotifications.length;

  // Filter tabs
  const renderFilterTabs = () => {
    const filters: { id: FilterType; label: string }[] = [
      { id: 'all', label: 'All' },
      { id: 'unread', label: 'Unread' },
      { id: 'high-priority', label: 'Important' }
    ];
    
    // Add dynamic filter tabs based on notification types that exist in data
    const typeSet = new Set<string>();
    notifications.forEach(notification => {
      if (!typeSet.has(notification.type)) {
        typeSet.add(notification.type);
      }
    });
    
    return (
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterTabsContainer}
      >
        {filters.map(filter => (
          <TouchableOpacity
            key={filter.id}
            style={[
              styles.filterTab,
              activeFilter === filter.id && styles.activeFilterTab
            ]}
            onPress={() => setActiveFilter(filter.id)}
          >
            <Text style={[
              styles.filterTabText,
              activeFilter === filter.id && styles.activeFilterTabText
            ]}>
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
        
        {Array.from(typeSet).map(type => {
          const typeConfig = (notificationTypes as Record<string, any>)[type];
          const color = typeConfig?.color || "#6B4EFF";
          const label = type.charAt(0).toUpperCase() + type.slice(1);
          
          return (
            <TouchableOpacity
              key={type}
              style={[
                styles.filterTab,
                activeFilter === type && styles.activeFilterTab,
                activeFilter === type && { borderColor: color }
              ]}
              onPress={() => setActiveFilter(type)}
            >
              <View style={styles.filterTabContent}>
                <View 
                  style={[
                    styles.filterTabDot,
                    { backgroundColor: color }
                  ]} 
                />
                <Text style={[
                  styles.filterTabText,
                  activeFilter === type && styles.activeFilterTabText,
                  activeFilter === type && { color }
                ]}>
                  {label}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    );
  };

  // Early return if not visible
  if (!visible) {
    return null;
  }

  const PanelWithContent = ({ children }: { children: React.ReactNode }) => {
    // Use BlurView if on iOS, otherwise use regular View
    if (Platform.OS === 'ios' && BlurView !== View) {
      return (
        <BlurView intensity={10} style={styles.blurContainer}>
          {children}
        </BlurView>
      );
    }
    return <View style={styles.container}>{children}</View>;
  };

  return (
    <TouchableWithoutFeedback onPress={onClose}>
      <View style={styles.overlay}>
        <TouchableWithoutFeedback>
          <Animated.View 
            style={[
              styles.panel,
              Platform.OS === 'web' 
                ? { 
                    opacity: fadeAnim,
                    maxHeight: panelHeight,
                    transform: [{ scale: fadeAnim }]
                  }
                : {
                    transform: [{ translateY: slideAnim }],
                    opacity: fadeAnim,
                    maxHeight: panelHeight
                  }
            ]}
            ref={ref}
          >
            <PanelWithContent>
              <View style={styles.header}>
                <Text style={styles.title}>Notifications</Text>
                <TouchableOpacity 
                  onPress={onClose}
                  style={styles.closeButton}
                  accessibilityLabel="Close notifications"
                  accessibilityRole="button"
                >
                  <Ionicons name="close" size={24} color="#6B4EFF" />
                </TouchableOpacity>
              </View>
              
              {renderFilterTabs()}
              
              <View style={styles.statusBar}>
                <Text style={styles.statusText}>
                  {notificationCount === 0 
                    ? "No notifications" 
                    : `${notificationCount} notification${notificationCount !== 1 ? 's' : ''}`}
                </Text>
                {hasUnreadNotifications && (
                  <TouchableOpacity 
                    onPress={onMarkAllAsRead}
                    style={styles.markAllButton}
                    accessibilityLabel="Mark all as read"
                    accessibilityRole="button"
                  >
                    <Text style={styles.markAllText}>Mark all as read</Text>
                  </TouchableOpacity>
                )}
              </View>
              
              {notificationCount === 0 ? (
                <View style={styles.emptyContainer}>
                  <FontAwesome5 name="bell-slash" size={50} color="#CCCCCC" />
                  <Text style={styles.emptyText}>No notifications yet</Text>
                  <Text style={styles.emptySubText}>
                    We'll notify you when something important happens
                  </Text>
                </View>
              ) : (
                <SectionList
                  sections={groupedNotifications}
                  renderItem={renderNotificationItem}
                  renderSectionHeader={renderSectionHeader}
                  keyExtractor={(item) => item.id.toString()}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.listContainer}
                  ItemSeparatorComponent={() => <View style={styles.separator} />}
                  stickySectionHeadersEnabled={true}
                />
              )}
            </PanelWithContent>
          </Animated.View>
        </TouchableWithoutFeedback>
      </View>
    </TouchableWithoutFeedback>
  );
});

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-start',
    alignItems: Platform.OS === 'web' ? 'center' : 'flex-end',
    zIndex: 9999,
    elevation: 30,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  panel: {
    width: Platform.OS === 'web' ? '50%' : '90%',
    maxWidth: Platform.OS === 'web' ? 500 : 380,
    minWidth: Platform.OS === 'web' ? 300 : 'auto',
    marginTop: Platform.OS === 'web' ? 80 : 60,
    marginRight: Platform.OS === 'web' ? 0 : 10,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 30,
    overflow: 'hidden',
  },
  blurContainer: {
    overflow: 'hidden',
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.85)',
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
    backgroundColor: 'rgba(255,255,255,0.95)',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  closeButton: {
    padding: 6,
  },
  // Filter tabs
  filterTabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F8F8FA',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  filterTab: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E2E2E2',
    backgroundColor: '#FFFFFF',
  },
  activeFilterTab: {
    borderColor: '#6B4EFF',
    backgroundColor: '#F0F2FF',
  },
  filterTabContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterTabDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  filterTabText: {
    fontSize: 13,
    color: '#666666',
    fontWeight: '500',
  },
  activeFilterTabText: {
    color: '#6B4EFF',
    fontWeight: '600',
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#F8F8FA',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  statusText: {
    fontSize: 14,
    color: '#737373',
    fontWeight: '500',
  },
  markAllButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#F2F2F7',
    borderRadius: 14,
  },
  markAllText: {
    color: '#6B4EFF',
    fontSize: 13,
    fontWeight: '600',
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F8F8FA',
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B6B6B',
  },
  listContainer: {
    paddingBottom: 8,
  },
  notificationItem: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    position: 'relative',
  },
  unreadNotification: {
    backgroundColor: '#F0F2FF',
    borderLeftWidth: 3,
    borderLeftColor: '#6B4EFF',
  },
  readNotification: {
    backgroundColor: '#FFFFFF',
  },
  actionableNotification: {
    paddingBottom: 20, // Extra space for action indicator
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    backgroundColor: '#F5F5F5',
  },
  unreadIconContainer: {
    backgroundColor: 'rgba(107, 78, 255, 0.12)',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F5F5F5',
  },
  notificationContent: {
    flex: 1,
    justifyContent: 'center',
  },
  notificationTitle: {
    fontSize: 16,
    marginBottom: 4,
    color: '#1C1C1E',
  },
  unreadTitle: {
    fontWeight: '700',
    color: '#000000',
  },
  notificationMessage: {
    fontSize: 14,
    color: '#3A3A3C',
    marginBottom: 4,
    lineHeight: 20,
  },
  notificationTime: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
  readText: {
    color: '#8E8E93',
    fontWeight: '400',
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#6B4EFF',
    position: 'absolute',
    right: 16,
    top: 16,
  },
  actionIndicator: {
    position: 'absolute',
    bottom: -12,
    left: 0,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
    backgroundColor: '#6B4EFF',
    marginTop: 4,
  },
  actionText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  separator: {
    height: 1,
    backgroundColor: '#F2F2F7',
    marginLeft: 76,
  },
  emptyContainer: {
    padding: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
    color: '#8E8E93',
    textAlign: 'center',
  },
  emptySubText: {
    marginTop: 8,
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  swipeableActions: {
    flexDirection: 'row',
    width: 160, // Increased to accommodate both actions
    height: '100%',
  },
  swipeAction: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: 10,
  },
  swipeActionText: {
    color: 'white',
    fontSize: 12,
    marginTop: 4,
  },
  markReadAction: {
    backgroundColor: '#34C759',
  },
  deleteAction: {
    backgroundColor: '#FF3B30',
  },
});

export default NotificationPanel; 