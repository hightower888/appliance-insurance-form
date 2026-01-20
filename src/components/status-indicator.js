/**
 * Status Indicator Component
 * Color-coded status indicators throughout UI
 */

class StatusIndicator {
  constructor() {
    this.statusColors = {
      // Lead Status
      'new': { color: '#3b82f6', bg: '#dbeafe', label: 'New' },
      'contacted': { color: '#f59e0b', bg: '#fef3c7', label: 'Contacted' },
      'dispositioned': { color: '#10b981', bg: '#d1fae5', label: 'Dispositioned' },
      'converted': { color: '#8b5cf6', bg: '#ede9fe', label: 'Converted' },
      
      // Disposition
      'interested': { color: '#10b981', bg: '#d1fae5', label: 'Interested' },
      'call_back': { color: '#f59e0b', bg: '#fef3c7', label: 'Call Back' },
      'not_interested': { color: '#ef4444', bg: '#fee2e2', label: 'Not Interested' },
      'no_answer': { color: '#6b7280', bg: '#f3f4f6', label: 'No Answer' },
      'other': { color: '#6b7280', bg: '#f3f4f6', label: 'Other' },
      
      // Default
      'default': { color: '#6b7280', bg: '#f3f4f6', label: 'Unknown' }
    };
  }

  /**
   * Get status configuration
   * @param {string} status - Status value
   * @returns {Object} Status configuration
   */
  getStatusConfig(status) {
    if (!status) {
      return this.statusColors.default;
    }

    const normalizedStatus = String(status).toLowerCase().trim();
    return this.statusColors[normalizedStatus] || this.statusColors.default;
  }

  /**
   * Render status badge
   * @param {string} status - Status value
   * @param {Object} options - Rendering options
   * @returns {string} HTML string
   */
  renderBadge(status, options = {}) {
    const config = this.getStatusConfig(status);
    const {
      size = 'medium', // 'small', 'medium', 'large'
      showIcon = false,
      icon = '●',
      className = '',
      style = ''
    } = options;

    const sizeClasses = {
      small: 'status-badge-sm',
      medium: 'status-badge-md',
      large: 'status-badge-lg'
    };

    return `
      <span 
        class="status-badge ${sizeClasses[size] || sizeClasses.medium} ${className}"
        style="background-color: ${config.bg}; color: ${config.color}; ${style}"
        title="${config.label}">
        ${showIcon ? `<span class="status-icon">${icon}</span>` : ''}
        <span class="status-label">${config.label}</span>
      </span>
    `;
  }

  /**
   * Render status dot (small indicator)
   * @param {string} status - Status value
   * @param {Object} options - Rendering options
   * @returns {string} HTML string
   */
  renderDot(status, options = {}) {
    const config = this.getStatusConfig(status);
    const {
      size = 8,
      className = '',
      style = ''
    } = options;

    return `
      <span 
        class="status-dot ${className}"
        style="background-color: ${config.color}; width: ${size}px; height: ${size}px; ${style}"
        title="${config.label}"
        aria-label="${config.label}">
      </span>
    `;
  }

  /**
   * Render status pill (compact badge)
   * @param {string} status - Status value
   * @param {Object} options - Rendering options
   * @returns {string} HTML string
   */
  renderPill(status, options = {}) {
    const config = this.getStatusConfig(status);
    const {
      size = 'medium',
      className = '',
      style = ''
    } = options;

    const sizeClasses = {
      small: 'status-pill-sm',
      medium: 'status-pill-md',
      large: 'status-pill-lg'
    };

    return `
      <span 
        class="status-pill ${sizeClasses[size] || sizeClasses.medium} ${className}"
        style="background-color: ${config.bg}; color: ${config.color}; ${style}"
        title="${config.label}">
        ${config.label}
      </span>
    `;
  }

  /**
   * Add status indicator to element
   * @param {HTMLElement} element - Element to add indicator to
   * @param {string} status - Status value
   * @param {Object} options - Rendering options
   */
  addToElement(element, status, options = {}) {
    if (!element) return;

    const {
      position = 'before', // 'before', 'after', 'prepend', 'append'
      type = 'badge' // 'badge', 'dot', 'pill'
    } = options;

    let html = '';
    if (type === 'badge') {
      html = this.renderBadge(status, options);
    } else if (type === 'dot') {
      html = this.renderDot(status, options);
    } else if (type === 'pill') {
      html = this.renderPill(status, options);
    }

    if (position === 'before') {
      element.insertAdjacentHTML('beforebegin', html);
    } else if (position === 'after') {
      element.insertAdjacentHTML('afterend', html);
    } else if (position === 'prepend') {
      element.insertAdjacentHTML('afterbegin', html);
    } else if (position === 'append') {
      element.insertAdjacentHTML('beforeend', html);
    }
  }

  /**
   * Update status colors
   * @param {Object} colors - New color definitions
   */
  updateStatusColors(colors) {
    this.statusColors = { ...this.statusColors, ...colors };
  }

  /**
   * Get all status colors
   * @returns {Object} Status colors
   */
  getStatusColors() {
    return { ...this.statusColors };
  }

  /**
   * TASK-1.8.1: Enhanced with priority indicators
   * Render status with priority indicator
   * @param {string} status - Status value
   * @param {string} priority - Priority level ('high', 'medium', 'low')
   * @param {Object} options - Rendering options
   * @returns {string} HTML string
   */
  renderWithPriority(status, priority = 'medium', options = {}) {
    const config = this.getStatusConfig(status);
    const priorityConfig = {
      'high': { icon: '🔴', color: '#ef4444' },
      'medium': { icon: '🟡', color: '#f59e0b' },
      'low': { icon: '🟢', color: '#10b981' }
    };

    const priorityInfo = priorityConfig[priority] || priorityConfig.medium;
    const badge = this.renderBadge(status, options);

    return `
      <div class="status-with-priority" style="display: inline-flex; align-items: center; gap: 4px;">
        ${badge}
        <span class="priority-indicator" style="color: ${priorityInfo.color}; font-size: 10px;" title="Priority: ${priority}">
          ${priorityInfo.icon}
        </span>
      </div>
    `;
  }

  /**
   * TASK-1.8.1: Enhanced with activity indicators
   * Render status with activity indicator
   * @param {string} status - Status value
   * @param {boolean} isActive - Whether item is active/recent
   * @param {Object} options - Rendering options
   * @returns {string} HTML string
   */
  renderWithActivity(status, isActive = false, options = {}) {
    const config = this.getStatusConfig(status);
    const badge = this.renderBadge(status, options);
    const activityClass = isActive ? 'active-pulse' : '';

    return `
      <div class="status-with-activity ${activityClass}" style="display: inline-flex; align-items: center; gap: 4px; position: relative;">
        ${badge}
        ${isActive ? '<span class="activity-indicator" style="position: absolute; top: -2px; right: -2px; width: 8px; height: 8px; background: #10b981; border-radius: 50%; border: 2px solid white; animation: pulse 2s infinite;"></span>' : ''}
      </div>
    `;
  }
}

// Create singleton instance
const statusIndicator = new StatusIndicator();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { StatusIndicator, statusIndicator };
}

// Make available globally
if (typeof window !== 'undefined') {
  window.statusIndicator = statusIndicator;
  window.StatusIndicator = StatusIndicator;
}
