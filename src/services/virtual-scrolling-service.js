/**
 * Virtual Scrolling Service (Phase 3)
 * Efficiently renders large lists by only showing visible items
 */

class VirtualScrollingService {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      itemHeight: options.itemHeight || 50, // Height of each item in pixels
      buffer: options.buffer || 5, // Number of items to render outside viewport
      renderItem: options.renderItem || null, // Function to render each item
      onScroll: options.onScroll || null,
      ...options
    };

    this.data = [];
    this.visibleStart = 0;
    this.visibleEnd = 0;
    this.scrollTop = 0;
    this.containerHeight = 0;
    this.totalHeight = 0;
  }

  /**
   * Initialize virtual scrolling
   * @param {Array} data - Data array
   */
  init(data) {
    this.data = data || [];
    this.calculateVisibleRange();
    this.setupScrollListener();
    this.render();
  }

  /**
   * Update data
   * @param {Array} newData - New data array
   */
  update(newData) {
    this.data = newData || [];
    this.calculateVisibleRange();
    this.render();
  }

  /**
   * Calculate visible range
   */
  calculateVisibleRange() {
    if (!this.container) return;

    const container = this.container;
    this.containerHeight = container.clientHeight || container.offsetHeight;
    this.scrollTop = container.scrollTop || 0;
    this.totalHeight = this.data.length * this.options.itemHeight;

    // Calculate visible range
    const startIndex = Math.max(0, Math.floor(this.scrollTop / this.options.itemHeight) - this.options.buffer);
    const endIndex = Math.min(
      this.data.length - 1,
      Math.ceil((this.scrollTop + this.containerHeight) / this.options.itemHeight) + this.options.buffer
    );

    this.visibleStart = startIndex;
    this.visibleEnd = endIndex;
  }

  /**
   * Render visible items
   */
  render() {
    if (!this.container) return;

    const visibleData = this.data.slice(this.visibleStart, this.visibleEnd + 1);
    const offsetY = this.visibleStart * this.options.itemHeight;

    // Create container structure
    this.container.innerHTML = `
      <div class="virtual-scroll-spacer" style="height: ${offsetY}px;"></div>
      <div class="virtual-scroll-content">
        ${this.renderItems(visibleData)}
      </div>
      <div class="virtual-scroll-spacer" style="height: ${Math.max(0, this.totalHeight - (this.visibleEnd + 1) * this.options.itemHeight)}px;"></div>
    `;

    // Store reference for item interactions
    this.contentElement = this.container.querySelector('.virtual-scroll-content');
  }

  /**
   * Render items
   * @param {Array} items - Items to render
   * @returns {string} HTML string
   */
  renderItems(items) {
    if (!this.options.renderItem) {
      // Default renderer
      return items.map((item, index) => `
        <div class="virtual-scroll-item" style="height: ${this.options.itemHeight}px;" data-index="${this.visibleStart + index}">
          ${this.escapeHtml(JSON.stringify(item))}
        </div>
      `).join('');
    }

    return items.map((item, index) => {
      const html = this.options.renderItem(item, this.visibleStart + index);
      return `
        <div class="virtual-scroll-item" style="height: ${this.options.itemHeight}px;" data-index="${this.visibleStart + index}">
          ${html}
        </div>
      `;
    }).join('');
  }

  /**
   * Setup scroll listener
   */
  setupScrollListener() {
    if (!this.container) return;

    let scrollTimer = null;
    this.container.addEventListener('scroll', () => {
      // Throttle scroll events
      if (scrollTimer) {
        clearTimeout(scrollTimer);
      }

      scrollTimer = setTimeout(() => {
        const oldStart = this.visibleStart;
        const oldEnd = this.visibleEnd;

        this.calculateVisibleRange();

        // Only re-render if visible range changed significantly
        if (Math.abs(this.visibleStart - oldStart) > this.options.buffer ||
            Math.abs(this.visibleEnd - oldEnd) > this.options.buffer) {
          this.render();
        }

        if (this.options.onScroll) {
          this.options.onScroll(this.scrollTop, this.visibleStart, this.visibleEnd);
        }
      }, 16); // ~60fps
    });
  }

  /**
   * Scroll to item
   * @param {number} index - Item index
   */
  scrollToItem(index) {
    if (!this.container || index < 0 || index >= this.data.length) {
      return;
    }

    const scrollTop = index * this.options.itemHeight;
    this.container.scrollTop = scrollTop;
    this.calculateVisibleRange();
    this.render();
  }

  /**
   * Get visible items
   * @returns {Array} Visible items
   */
  getVisibleItems() {
    return this.data.slice(this.visibleStart, this.visibleEnd + 1);
  }

  /**
   * Get visible indices
   * @returns {Object} { start, end }
   */
  getVisibleRange() {
    return {
      start: this.visibleStart,
      end: this.visibleEnd
    };
  }

  /**
   * Update item height (for dynamic heights)
   * @param {number} index - Item index
   * @param {number} height - New height
   */
  updateItemHeight(index, height) {
    // For dynamic heights, would need to track individual heights
    // This is a simplified version - assumes uniform height
    if (height !== this.options.itemHeight) {
      console.warn('VirtualScrolling: Dynamic item heights not fully supported');
    }
  }

  /**
   * Destroy virtual scrolling
   */
  destroy() {
    if (this.container) {
      this.container.innerHTML = '';
    }
    this.data = [];
    this.visibleStart = 0;
    this.visibleEnd = 0;
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
  module.exports = { VirtualScrollingService };
}

// Make available globally
if (typeof window !== 'undefined') {
  window.VirtualScrollingService = VirtualScrollingService;
}
