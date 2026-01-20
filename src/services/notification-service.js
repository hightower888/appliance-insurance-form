/**
 * Notification Service
 * Manages push notifications and in-app notifications
 */

class NotificationService {
  constructor() {
    this.notifications = [];
    this.listeners = new Set();
    this.permission = null;
    this.realtimeService = null;
    this.currentUserId = null;
  }

  /**
   * Initialize notification service
   * @param {Object} realtimeService - RealtimeService instance
   * @param {string} userId - Current user ID
   */
  initialize(realtimeService, userId = null) {
    this.realtimeService = realtimeService || (typeof realtimeService !== 'undefined' ? realtimeService : null);
    this.currentUserId = userId || this.getCurrentUserId();
    
    // Request notification permission
    this.requestPermission();
    
    // Subscribe to notification updates
    if (this.realtimeService && this.currentUserId) {
      this.subscribeToNotifications();
    }
  }

  /**
   * Get current user ID
   * @returns {string|null} User ID
   */
  getCurrentUserId() {
    if (typeof firebase !== 'undefined' && firebase.auth) {
      const user = firebase.auth().currentUser;
      if (user) return user.uid;
    }
    
    try {
      const userData = localStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        return user.uid || user.email || null;
      }
    } catch (e) {
      // Ignore
    }
    
    return 'anonymous';
  }

  /**
   * Request browser notification permission
   * @returns {Promise<string>} Permission status
   */
  async requestPermission() {
    if (!('Notification' in window)) {
      this.permission = 'unsupported';
      return 'unsupported';
    }

    if (Notification.permission === 'granted') {
      this.permission = 'granted';
      return 'granted';
    }

    if (Notification.permission === 'denied') {
      this.permission = 'denied';
      return 'denied';
    }

    try {
      const permission = await Notification.requestPermission();
      this.permission = permission;
      return permission;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      this.permission = 'denied';
      return 'denied';
    }
  }

  /**
   * Subscribe to notification updates from Firebase
   */
  subscribeToNotifications() {
    if (!this.realtimeService || !this.currentUserId) return;

    // Subscribe to user notifications
    const path = `user_notifications/${this.currentUserId}`;
    
    this.realtimeService.subscribe(path, (data) => {
      if (data) {
        // Convert object to array
        const notifications = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        
        // Sort by timestamp (newest first)
        notifications.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        
        this.notifications = notifications;
        this.notifyListeners();
        
        // Show browser notification for new items
        this.showBrowserNotifications(notifications.slice(0, 5));
      }
    });
  }

  /**
   * Show browser notifications
   * @param {Array} notifications - Notifications to show
   */
  showBrowserNotifications(notifications) {
    if (this.permission !== 'granted') return;

    notifications.forEach(notification => {
      if (!notification.read) {
        this.showBrowserNotification(notification);
      }
    });
  }

  /**
   * Show browser notification
   * @param {Object} notification - Notification object
   */
  showBrowserNotification(notification) {
    if (this.permission !== 'granted') return;

    const options = {
      body: notification.message || notification.title,
      icon: notification.icon || '/icon.png',
      badge: '/badge.png',
      tag: notification.id,
      requireInteraction: notification.important || false
    };

    try {
      const notif = new Notification(notification.title || 'New Notification', options);
      
      notif.onclick = () => {
        window.focus();
        this.markAsRead(notification.id);
        notif.close();
      };
    } catch (error) {
      console.error('Error showing browser notification:', error);
    }
  }

  /**
   * Create notification
   * @param {Object} notification - Notification data
   * @returns {Promise<string>} Notification ID
   */
  async createNotification(notification) {
    if (!this.realtimeService || !this.currentUserId) {
      console.warn('NotificationService: Cannot create notification - service not initialized');
      return null;
    }

    const notificationData = {
      title: notification.title || 'Notification',
      message: notification.message || '',
      type: notification.type || 'info', // info, success, warning, error
      icon: notification.icon || '📢',
      read: false,
      important: notification.important || false,
      timestamp: Date.now(),
      userId: this.currentUserId,
      actionUrl: notification.actionUrl || null
    };

    try {
      const path = `user_notifications/${this.currentUserId}`;
      const id = await this.realtimeService.pushData(path, notificationData);
      
      // Show browser notification if permission granted
      if (this.permission === 'granted') {
        this.showBrowserNotification({ ...notificationData, id });
      }
      
      return id;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  /**
   * Mark notification as read
   * @param {string} notificationId - Notification ID
   * @returns {Promise<void>}
   */
  async markAsRead(notificationId) {
    if (!this.realtimeService || !this.currentUserId) return;

    try {
      const path = `user_notifications/${this.currentUserId}/${notificationId}/read`;
      await this.realtimeService.writeData(path, true);
      
      // Update local state
      const notification = this.notifications.find(n => n.id === notificationId);
      if (notification) {
        notification.read = true;
        this.notifyListeners();
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }

  /**
   * Mark all notifications as read
   * @returns {Promise<void>}
   */
  async markAllAsRead() {
    if (!this.realtimeService || !this.currentUserId) return;

    try {
      const updates = {};
      this.notifications.forEach(notification => {
        if (!notification.read) {
          updates[`${notification.id}/read`] = true;
        }
      });

      if (Object.keys(updates).length > 0) {
        const path = `user_notifications/${this.currentUserId}`;
        await this.realtimeService.updateData(path, updates);
        
        // Update local state
        this.notifications.forEach(n => n.read = true);
        this.notifyListeners();
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }

  /**
   * Delete notification
   * @param {string} notificationId - Notification ID
   * @returns {Promise<void>}
   */
  async deleteNotification(notificationId) {
    if (!this.realtimeService || !this.currentUserId) return;

    try {
      const path = `user_notifications/${this.currentUserId}/${notificationId}`;
      await this.realtimeService.removeData(path);
      
      // Update local state
      this.notifications = this.notifications.filter(n => n.id !== notificationId);
      this.notifyListeners();
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  }

  /**
   * Get notifications
   * @param {Object} options - Options { unreadOnly, limit }
   * @returns {Array} Notifications
   */
  getNotifications(options = {}) {
    let notifications = [...this.notifications];

    if (options.unreadOnly) {
      notifications = notifications.filter(n => !n.read);
    }

    if (options.limit) {
      notifications = notifications.slice(0, options.limit);
    }

    return notifications;
  }

  /**
   * Get unread count
   * @returns {number} Unread count
   */
  getUnreadCount() {
    return this.notifications.filter(n => !n.read).length;
  }

  /**
   * Subscribe to notification changes
   * @param {Function} callback - Callback function
   * @returns {Function} Unsubscribe function
   */
  onNotificationsChange(callback) {
    this.listeners.add(callback);
    
    // Immediately call with current notifications
    callback(this.notifications, this.getUnreadCount());

    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Notify listeners of changes
   */
  notifyListeners() {
    this.listeners.forEach(callback => {
      try {
        callback(this.notifications, this.getUnreadCount());
      } catch (error) {
        console.error('Error in notification listener:', error);
      }
    });
  }

  /**
   * Get notification preferences
   * @returns {Promise<Object>} Preferences
   */
  async getPreferences() {
    // Load from localStorage or Firebase
    try {
      const stored = localStorage.getItem('notification_preferences');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      // Ignore
    }

    // Default preferences
    return {
      browserNotifications: true,
      inAppNotifications: true,
      soundEnabled: false,
      types: {
        info: true,
        success: true,
        warning: true,
        error: true
      }
    };
  }

  /**
   * Save notification preferences
   * @param {Object} preferences - Preferences
   * @returns {Promise<void>}
   */
  async savePreferences(preferences) {
    try {
      localStorage.setItem('notification_preferences', JSON.stringify(preferences));
    } catch (e) {
      console.error('Error saving notification preferences:', e);
    }
  }
}

// Create singleton instance
const notificationService = new NotificationService();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { NotificationService, notificationService };
}

// Make available globally
if (typeof window !== 'undefined') {
  window.NotificationService = NotificationService;
  window.notificationService = notificationService;
}
