/**
 * Push Notification Service (Phase 4A)
 * Web Push API integration for PWA notifications
 */

class PushNotificationService {
  constructor(options = {}) {
    this.options = {
      vapidPublicKey: options.vapidPublicKey || null, // VAPID public key for push
      onNotificationClick: options.onNotificationClick || null,
      ...options
    };

    this.registration = null;
    this.subscription = null;
    this.isSupported = 'serviceWorker' in navigator && 'PushManager' in window;
  }

  /**
   * Initialize push notifications
   */
  async init() {
    if (!this.isSupported) {
      console.warn('PushNotificationService: Push notifications not supported');
      return false;
    }

    try {
      // Get service worker registration
      this.registration = await navigator.serviceWorker.ready;

      // Request permission
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        console.warn('PushNotificationService: Notification permission denied');
        return false;
      }

      // Subscribe to push
      await this.subscribe();

      // Listen for push events
      this.setupPushListener();

      console.log('PushNotificationService: Initialized');
      return true;
    } catch (error) {
      console.error('PushNotificationService: Initialization failed:', error);
      return false;
    }
  }

  /**
   * Subscribe to push notifications
   */
  async subscribe() {
    if (!this.registration) {
      this.registration = await navigator.serviceWorker.ready;
    }

    try {
      const subscriptionOptions = {};
      if (this.options.vapidPublicKey) {
        subscriptionOptions.applicationServerKey = this.urlBase64ToUint8Array(this.options.vapidPublicKey);
      }

      this.subscription = await this.registration.pushManager.subscribe(subscriptionOptions);
      console.log('PushNotificationService: Subscribed to push');
      return this.subscription;
    } catch (error) {
      console.error('PushNotificationService: Subscription failed:', error);
      throw error;
    }
  }

  /**
   * Unsubscribe from push notifications
   */
  async unsubscribe() {
    if (!this.subscription) return;

    try {
      await this.subscription.unsubscribe();
      this.subscription = null;
      console.log('PushNotificationService: Unsubscribed from push');
    } catch (error) {
      console.error('PushNotificationService: Unsubscribe failed:', error);
    }
  }

  /**
   * Show local notification
   * @param {string} title - Notification title
   * @param {Object} options - Notification options
   */
  async showNotification(title, options = {}) {
    if (!this.registration) {
      this.registration = await navigator.serviceWorker.ready;
    }

    const notificationOptions = {
      body: options.body || '',
      icon: options.icon || '/icons/icon-192x192.png',
      badge: options.badge || '/icons/icon-72x72.png',
      tag: options.tag || 'default',
      data: options.data || {},
      requireInteraction: options.requireInteraction || false,
      actions: options.actions || [],
      ...options
    };

    await this.registration.showNotification(title, notificationOptions);
  }

  /**
   * Setup push event listener in service worker
   */
  setupPushListener() {
    // This is handled in service worker (sw.js)
    // Service worker listens for 'push' events
  }

  /**
   * Convert VAPID key from URL-safe base64 to Uint8Array
   * @param {string} base64String - Base64 string
   * @returns {Uint8Array} Uint8Array
   */
  urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    return Uint8Array.from([...rawData].map(char => char.charCodeAt(0)));
  }

  /**
   * Get subscription
   * @returns {PushSubscription|null} Subscription
   */
  getSubscription() {
    return this.subscription;
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { PushNotificationService };
}

// Make available globally
if (typeof window !== 'undefined') {
  window.PushNotificationService = PushNotificationService;
}
