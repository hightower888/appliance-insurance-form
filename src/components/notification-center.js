/**
 * Notification Center Component
 * UI for displaying and managing notifications
 */

class NotificationCenter {
  /**
   * @param {HTMLElement} container - Container element
   * @param {Object} options - Options
   */
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      notificationService: options.notificationService || (typeof notificationService !== 'undefined' ? notificationService : null),
      maxVisible: options.maxVisible || 5,
      ...options
    };

    this.isOpen = false;
    this.unreadCount = 0;

    this.init();
  }

  /**
   * Initialize notification center
   */
  init() {
    if (!this.container) {
      throw new Error('NotificationCenter: Container not set');
    }

    if (!this.options.notificationService) {
      console.warn('NotificationCenter: NotificationService not provided');
      return;
    }

    // Subscribe to notification changes
    this.options.notificationService.onNotificationsChange((notifications, unreadCount) => {
      this.unreadCount = unreadCount;
      this.updateBadge();
      if (this.isOpen) {
        this.render();
      }
    });

    this.render();
  }

  /**
   * Render notification center
   */
  render() {
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="notification-center-container">
        <button class="notification-center-toggle" id="notificationToggleBtn" title="Notifications">
          <span class="notification-icon">🔔</span>
          ${this.unreadCount > 0 ? `<span class="notification-badge">${this.unreadCount > 99 ? '99+' : this.unreadCount}</span>` : ''}
        </button>
        <div class="notification-center-panel" id="notificationPanel" style="display: ${this.isOpen ? 'block' : 'none'};">
          <div class="notification-panel-header">
            <h3>Notifications</h3>
            <div class="notification-panel-actions">
              ${this.unreadCount > 0 ? `
                <button class="btn btn-sm btn-secondary" id="markAllReadBtn">Mark all read</button>
              ` : ''}
              <button class="btn btn-sm btn-secondary" id="closeNotificationPanelBtn">✕</button>
            </div>
          </div>
          <div class="notification-panel-content" id="notificationContent">
            ${this.renderNotifications()}
          </div>
        </div>
      </div>
    `;

    this.setupEventListeners();
  }

  /**
   * Render notifications list
   * @returns {string} HTML
   */
  renderNotifications() {
    if (!this.options.notificationService) {
      return '<p style="color: var(--text-secondary); padding: 20px; text-align: center;">Notification service not available</p>';
    }

    const notifications = this.options.notificationService.getNotifications({ limit: 20 });

    if (notifications.length === 0) {
      return '<p style="color: var(--text-secondary); padding: 20px; text-align: center;">No notifications</p>';
    }

    return `
      <div class="notification-list">
        ${notifications.map(notification => this.renderNotification(notification)).join('')}
      </div>
    `;
  }

  /**
   * Render single notification
   * @param {Object} notification - Notification object
   * @returns {string} HTML
   */
  renderNotification(notification) {
    const readClass = notification.read ? 'read' : 'unread';
    const typeClass = `notification-${notification.type || 'info'}`;
    const timeAgo = this.getTimeAgo(notification.timestamp);

    return `
      <div class="notification-item ${readClass} ${typeClass}" data-notification-id="${notification.id}">
        <div class="notification-icon">${notification.icon || '📢'}</div>
        <div class="notification-content">
          <div class="notification-title">${this.escapeHtml(notification.title || 'Notification')}</div>
          <div class="notification-message">${this.escapeHtml(notification.message || '')}</div>
          <div class="notification-time">${timeAgo}</div>
        </div>
        <div class="notification-actions">
          ${!notification.read ? `
            <button class="btn btn-sm btn-link mark-read-btn" data-notification-id="${notification.id}" title="Mark as read">✓</button>
          ` : ''}
          <button class="btn btn-sm btn-link delete-notification-btn" data-notification-id="${notification.id}" title="Delete">✕</button>
        </div>
      </div>
    `;
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Toggle button
    const toggleBtn = document.getElementById('notificationToggleBtn');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        this.toggle();
      });
    }

    // Close button
    const closeBtn = document.getElementById('closeNotificationPanelBtn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        this.close();
      });
    }

    // Mark all read button
    const markAllReadBtn = document.getElementById('markAllReadBtn');
    if (markAllReadBtn) {
      markAllReadBtn.addEventListener('click', () => {
        if (this.options.notificationService) {
          this.options.notificationService.markAllAsRead();
        }
      });
    }

    // Mark as read buttons
    this.container.querySelectorAll('.mark-read-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const notificationId = btn.getAttribute('data-notification-id');
        if (this.options.notificationService) {
          this.options.notificationService.markAsRead(notificationId);
        }
      });
    });

    // Delete buttons
    this.container.querySelectorAll('.delete-notification-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const notificationId = btn.getAttribute('data-notification-id');
        if (this.options.notificationService) {
          this.options.notificationService.deleteNotification(notificationId);
        }
      });
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (this.isOpen && !this.container.contains(e.target)) {
        this.close();
      }
    });
  }

  /**
   * Toggle notification panel
   */
  toggle() {
    this.isOpen = !this.isOpen;
    const panel = document.getElementById('notificationPanel');
    if (panel) {
      panel.style.display = this.isOpen ? 'block' : 'none';
    }
    
    if (this.isOpen) {
      this.render();
    }
  }

  /**
   * Open notification panel
   */
  open() {
    this.isOpen = true;
    const panel = document.getElementById('notificationPanel');
    if (panel) {
      panel.style.display = 'block';
    }
    this.render();
  }

  /**
   * Close notification panel
   */
  close() {
    this.isOpen = false;
    const panel = document.getElementById('notificationPanel');
    if (panel) {
      panel.style.display = 'none';
    }
  }

  /**
   * Update badge count
   */
  updateBadge() {
    const badge = this.container.querySelector('.notification-badge');
    const toggleBtn = document.getElementById('notificationToggleBtn');
    
    if (this.unreadCount > 0) {
      if (!badge && toggleBtn) {
        const badgeEl = document.createElement('span');
        badgeEl.className = 'notification-badge';
        badgeEl.textContent = this.unreadCount > 99 ? '99+' : this.unreadCount;
        toggleBtn.appendChild(badgeEl);
      } else if (badge) {
        badge.textContent = this.unreadCount > 99 ? '99+' : this.unreadCount;
      }
    } else {
      if (badge) {
        badge.remove();
      }
    }
  }

  /**
   * Get time ago string
   * @param {number} timestamp - Timestamp
   * @returns {string} Time ago string
   */
  getTimeAgo(timestamp) {
    if (!timestamp) return '';

    const now = Date.now();
    const diff = now - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} day${days !== 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    return 'Just now';
  }

  /**
   * Escape HTML
   * @param {string} text - Text to escape
   * @returns {string} Escaped text
   */
  escapeHtml(text) {
    if (text == null) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { NotificationCenter };
}

// Make available globally
if (typeof window !== 'undefined') {
  window.NotificationCenter = NotificationCenter;
}
