/*
// Static notification data to simulate backend responses
export const notifications = [
  { 
    id: 1, 
    title: "New Gown Collection Available", 
    message: "Check out our latest gown collection for your special events", 
    read: false, 
    time: "2 hours ago",
    type: "product"
  },
  { 
    id: 2, 
    title: "Your rental expires tomorrow", 
    message: "Don't forget to return your Modern Bridal Dress", 
    read: false, 
    time: "1 day ago",
    type: "reminder" 
  },
  { 
    id: 3, 
    title: "Price drop on Modern Bridal Dress", 
    message: "The dress you've been viewing is now 15% off!", 
    read: true, 
    time: "3 days ago",
    type: "price" 
  },
  { 
    id: 4, 
    title: "Rental request approved", 
    message: "Your request for the Evening Gown has been approved", 
    read: true, 
    time: "1 week ago",
    type: "status" 
  },
  { 
    id: 5, 
    title: "Welcome to Elite Glam!", 
    message: "Thanks for joining. Explore our collection of premium garments.", 
    read: true, 
    time: "2 weeks ago",
    type: "system" 
  },
]; 
*/

// Define proper types for notifications
/**
 * @typedef {'low' | 'medium' | 'high'} PriorityLevel
 * 
 * @typedef {Object} NotificationType
 * @property {string} icon - Icon name for this notification type
 * @property {string} color - Color code for this notification type
 * @property {PriorityLevel} importance - Importance level of this notification type
 */

/**
 * @typedef {Object} Notification
 * @property {number} id - Unique identifier for the notification
 * @property {string} title - Title of the notification
 * @property {string} message - Message content of the notification
 * @property {boolean} read - Whether the notification has been read
 * @property {string} time - Timestamp or relative time
 * @property {string} type - Type of notification (corresponds to keys in notificationTypes)
 * @property {boolean} [actionable] - Whether this notification has an associated action
 * @property {string} [action] - Action type for actionable notifications
 * @property {PriorityLevel} [priority] - Optional priority override
 * @property {string} [productId] - Optional product ID reference
 * @property {string} [orderId] - Optional order ID reference
 * @property {string} [appointmentId] - Optional appointment ID reference
 * @property {string} [collectionId] - Optional collection ID reference
 * @property {string} [transactionId] - Optional transaction ID reference
 */

/** @type {Notification[]} */
export const notifications = [
  { 
    id: 1, 
    title: "Your rental is due tomorrow", 
    message: "Don't forget to return your Modern Bridal Dress", 
    read: false, 
    time: "1h ago",
    type: "reminder",
    actionable: true,
    action: "view_rental"
  },
  { 
    id: 2, 
    title: "New arrival: Midnight Ball Gown", 
    message: "Check out our latest gown collection for your special events", 
    read: false, 
    time: "3h ago",
    type: "product",
    actionable: true,
    action: "view_product",
    productId: "midnight-ball-gown"
  },
  { 
    id: 3, 
    title: "Price dropped on an item in your cart", 
    message: "The dress you've been viewing is now 15% off!", 
    read: false, 
    time: "5h ago",
    type: "price",
    actionable: true,
    action: "view_cart"
  },
  { 
    id: 4, 
    title: "Rental request approved", 
    message: "Your request for the Evening Gown has been approved", 
    read: true, 
    time: "Yesterday",
    type: "status",
    actionable: true,
    action: "view_order",
    orderId: "EG12345"
  },
  { 
    id: 5, 
    title: "Welcome to Elite Glam!", 
    message: "Thanks for joining. Explore our collection of premium garments.", 
    read: true, 
    time: "2 days ago",
    type: "system",
    actionable: false 
  },
  {
    id: 6,
    title: "Complete your profile",
    message: "Add your measurements to get personalized dress recommendations",
    read: false,
    time: "1 day ago",
    type: "profile",
    actionable: true,
    action: "edit_profile",
    priority: "high"
  },
  {
    id: 7,
    title: "Upcoming event reminder",
    message: "Your scheduled fitting appointment is tomorrow at 2:00 PM",
    read: false,
    time: "Yesterday",
    type: "appointment",
    actionable: true,
    action: "view_appointment",
    appointmentId: "AP98765"
  },
  {
    id: 8,
    title: "Trending: Wedding Season Styles",
    message: "See what's hot for this wedding season",
    read: true,
    time: "3 days ago",
    type: "promotion",
    actionable: true,
    action: "view_collection",
    collectionId: "wedding-2023"
  },
  {
    id: 9,
    title: "Review your recent rental",
    message: "How was your experience with the Elegant Purple Gown?",
    read: false,
    time: "4 days ago",
    type: "feedback",
    actionable: true,
    action: "leave_review",
    productId: "elegant-purple-gown"
  },
  {
    id: 10,
    title: "Payment successful",
    message: "Your payment of PHP 1,834 for Modern Bridal Dress was successful",
    read: true,
    time: "1 week ago",
    type: "payment",
    actionable: true,
    action: "view_receipt",
    transactionId: "TXN87654"
  }
]; 

/** @type {Object.<string, NotificationType>} */
export const notificationTypes = {
  reminder: {
    icon: "time-outline",
    color: "#FF9500",
    importance: "medium"
  },
  product: {
    icon: "new-releases",
    color: "#6B4EFF",
    importance: "low"
  },
  price: {
    icon: "local-offer",
    color: "#34C759", 
    importance: "medium"
  },
  status: {
    icon: "checkmark-circle",
    color: "#007AFF",
    importance: "high"
  },
  system: {
    icon: "information-circle",
    color: "#5856D6",
    importance: "low"
  },
  profile: {
    icon: "person",
    color: "#FF2D55",
    importance: "high"
  },
  appointment: {
    icon: "calendar",
    color: "#FF9500",
    importance: "high"
  },
  promotion: {
    icon: "pricetag",
    color: "#AF52DE",
    importance: "low"
  },
  feedback: {
    icon: "star",
    color: "#FFCC00",
    importance: "medium"
  },
  payment: {
    icon: "card",
    color: "#00C7BE",
    importance: "high"
  }
}; 