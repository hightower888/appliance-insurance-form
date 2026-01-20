/**
 * Recent Items Component (Phase 3 Additional)
 * Track and display recently viewed records
 */

class RecentItems {
  constructor(options = {}) {
    this.options = {
      storageKey: options.storageKey || 'crm_recent_items',
      maxItems: options.maxItems || 20,
      onItemClick: options.onItemClick || null,
      ...options
    };
    
    this.recentItems = this.loadRecentItems();
  }

  /**
   * Add item to recent items
   * @param {string} itemId - Item ID
   * @param {string} itemType - Item type (lead, customer, etc.)
   * @param {Object} itemData - Item data (name, etc.)
   */
  addItem(itemId, itemType = 'lead', itemData = {}) {
    if (!itemId) return;

    // Remove existing item with same ID
    this.recentItems = this.recentItems.filter(item => item.id !== itemId);

    // Add new item at beginning
    const recentItem = {
      id: itemId,
      type: itemType,
      name: itemData.name || itemData.contact?.name || `Item ${itemId}`,
      timestamp: Date.now(),
      data: itemData
    };

    this.recentItems.unshift(recentItem);

    // Limit to maxItems
    if (this.recentItems.length > this.options.maxItems) {
      this.recentItems = this.recentItems.slice(0, this.options.maxItems);
    }

    this.saveRecentItems();
  }

  /**
   * Get recent items
   * @param {number} limit - Limit number of items
   * @returns {Array} Recent items
   */
  getRecentItems(limit = null) {
    const items = [...this.recentItems];
    return limit ? items.slice(0, limit) : items;
  }

  /**
   * Clear recent items
   */
  clearRecentItems() {
    this.recentItems = [];
    this.saveRecentItems();
  }

  /**
   * Remove a specific item
   * @param {string} itemId - Item ID
   */
  removeItem(itemId) {
    this.recentItems = this.recentItems.filter(item => item.id !== itemId);
    this.saveRecentItems();
  }

  /**
   * Render recent items in sidebar or container
   * @param {HTMLElement} container - Container element
   */
  render(container) {
    if (!container) return;

    const items = this.getRecentItems(10); // Show last 10 in sidebar

    container.innerHTML = `
      <div class="recent-items-container">
        <div class="recent-items-header">
          <h4>Recent Items</h4>
          ${items.length > 0 ? `<button class="btn btn-xs btn-secondary" id="clearRecentItemsBtn">Clear</button>` : ''}
        </div>
        <div class="recent-items-list">
          ${this.renderRecentItemsList(items)}
        </div>
      </div>
    `;

    this.setupEventListeners(container);
  }

  /**
   * Render recent items list
   * @param {Array} items - Items to render
   * @returns {string} HTML string
   */
  renderRecentItemsList(items) {
    if (items.length === 0) {
      return '<p style="color: var(--text-secondary); font-size: 12px; padding: 10px; text-align: center;">No recent items</p>';
    }

    return items.map(item => {
      const timeAgo = this.getTimeAgo(item.timestamp);
      return `
        <div class="recent-item" data-item-id="${item.id}" data-item-type="${item.type}">
          <div class="recent-item-content">
            <div class="recent-item-name">${this.escapeHtml(item.name)}</div>
            <div class="recent-item-meta">
              <span class="recent-item-type">${item.type}</span>
              <span class="recent-item-time">${timeAgo}</span>
            </div>
          </div>
          <button class="recent-item-remove" onclick="event.stopPropagation(); this.closest('.recent-items-container').__recentItems?.removeItem('${item.id}')">×</button>
        </div>
      `;
    }).join('');
  }

  /**
   * Get time ago string
   * @param {number} timestamp - Timestamp
   * @returns {string} Time ago string
   */
  getTimeAgo(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  }

  /**
   * Setup event listeners
   * @param {HTMLElement} container - Container element
   */
  setupEventListeners(container) {
    // Store reference
    const itemsContainer = container.querySelector('.recent-items-container');
    if (itemsContainer) {
      itemsContainer.__recentItems = this;
    }

    // Clear button
    const clearBtn = document.getElementById('clearRecentItemsBtn');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        if (confirm('Clear all recent items?')) {
          this.clearRecentItems();
          this.render(container);
        }
      });
    }

    // Item click handlers
    const itemElements = container.querySelectorAll('.recent-item');
    itemElements.forEach(itemEl => {
      itemEl.addEventListener('click', () => {
        const itemId = itemEl.dataset.itemId;
        const itemType = itemEl.dataset.itemType;
        
        if (this.options.onItemClick) {
          this.options.onItemClick(itemId, itemType);
        } else {
          // Default: navigate to item
          if (itemType === 'lead' && typeof viewLeadDetails === 'function') {
            viewLeadDetails(itemId);
          } else if (itemType === 'customer' && typeof viewCustomerDetails === 'function') {
            viewCustomerDetails(itemId);
          }
        }
      });
    });
  }

  /**
   * Load recent items from storage
   * @returns {Array} Recent items
   */
  loadRecentItems() {
    try {
      const saved = localStorage.getItem(this.options.storageKey);
      if (!saved) return [];
      
      const items = JSON.parse(saved);
      // Filter out items older than 30 days
      const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
      return items.filter(item => item.timestamp > thirtyDaysAgo);
    } catch (error) {
      console.error('RecentItems: Error loading recent items:', error);
      return [];
    }
  }

  /**
   * Save recent items to storage
   */
  saveRecentItems() {
    try {
      localStorage.setItem(this.options.storageKey, JSON.stringify(this.recentItems));
    } catch (error) {
      console.error('RecentItems: Error saving recent items:', error);
    }
  }

  /**
   * Escape HTML
   * @param {string} str - String to escape
   * @returns {string} Escaped string
   */
  escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { RecentItems };
}

// Make available globally
if (typeof window !== 'undefined') {
  window.RecentItems = RecentItems;
}
