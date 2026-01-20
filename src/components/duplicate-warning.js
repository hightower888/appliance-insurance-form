/**
 * Duplicate Warning Component
 * Displays duplicate customer warnings with confidence scoring
 */

class DuplicateWarning {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      onOverride: null,
      onDismiss: null,
      ...options
    };
    this.matches = [];
    this.confidence = null;
    this.isVisible = false;
    this.overrideState = false;
  }

  /**
   * Render duplicate warning
   * @param {Array} matches - Array of matching customers
   * @param {string} confidence - Confidence level (HIGH/MEDIUM/LOW)
   */
  render(matches = [], confidence = null) {
    if (!this.container) return;
    
    this.matches = matches;
    this.confidence = confidence;
    
    if (matches.length === 0 || !confidence) {
      this.hide();
      return;
    }
    
    this.isVisible = true;
    
    // Determine color based on confidence
    const colorClass = this.getConfidenceColor(confidence);
    const icon = this.getConfidenceIcon(confidence);
    
    // Limit matches to top 3 for display
    const displayMatches = matches.slice(0, 3);
    
    this.container.innerHTML = `
      <div class="duplicate-warning ${colorClass}" role="alert">
        <div class="duplicate-warning-header">
          <div class="duplicate-warning-icon">${icon}</div>
          <div class="duplicate-warning-title">
            <strong>Potential Duplicate Customer Detected</strong>
            <span class="duplicate-confidence-badge ${colorClass}">${confidence} Confidence</span>
          </div>
          <button class="duplicate-warning-close" aria-label="Dismiss warning" onclick="this.closest('.duplicate-warning').remove()">×</button>
        </div>
        <div class="duplicate-warning-content">
          <p class="duplicate-warning-message">
            We found ${matches.length} existing ${matches.length === 1 ? 'customer' : 'customers'} that may match this entry.
          </p>
          <div class="duplicate-matches">
            ${displayMatches.map((match, index) => this.renderMatch(match, index)).join('')}
            ${matches.length > 3 ? `<p class="duplicate-more">... and ${matches.length - 3} more match${matches.length - 3 === 1 ? '' : 'es'}</p>` : ''}
          </div>
          <div class="duplicate-warning-actions">
            <button class="btn btn-secondary btn-sm" onclick="this.closest('.duplicate-warning').querySelector('.duplicate-override-btn').click()">
              Review Details
            </button>
            <button class="btn btn-primary btn-sm duplicate-override-btn" data-override="false">
              Continue Anyway
            </button>
          </div>
        </div>
      </div>
    `;
    
    this.setupEventListeners();
    this.show();
  }

  /**
   * Render a single match
   * @param {Object} match - Match object
   * @param {number} index - Match index
   * @returns {string} HTML string
   */
  renderMatch(match, index) {
    const contact = match.contact || {};
    const matchType = match.matchType || 'unknown';
    const matchConfidence = match.matchConfidence || 'LOW';
    
    return `
      <div class="duplicate-match-item">
        <div class="duplicate-match-header">
          <span class="duplicate-match-number">#${index + 1}</span>
          <span class="duplicate-match-type badge-${matchType}">${matchType.toUpperCase()}</span>
          <span class="duplicate-match-confidence ${this.getConfidenceColor(matchConfidence)}">${matchConfidence}</span>
        </div>
        <div class="duplicate-match-details">
          <div class="duplicate-match-field">
            <strong>Name:</strong> ${this.escapeHtml(contact.name || 'N/A')}
          </div>
          <div class="duplicate-match-field">
            <strong>Phone:</strong> ${this.escapeHtml(contact.phone || 'N/A')}
          </div>
          <div class="duplicate-match-field">
            <strong>Email:</strong> ${this.escapeHtml(contact.email || 'N/A')}
          </div>
          ${contact.address ? `
            <div class="duplicate-match-field">
              <strong>Address:</strong> ${this.escapeHtml(contact.address)}${contact.postcode ? `, ${this.escapeHtml(contact.postcode)}` : ''}
            </div>
          ` : ''}
          ${match.submittedAt ? `
            <div class="duplicate-match-field">
              <strong>Submitted:</strong> ${new Date(match.submittedAt).toLocaleDateString()}
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  /**
   * Get confidence color class
   * @param {string} confidence - Confidence level
   * @returns {string} Color class
   */
  getConfidenceColor(confidence) {
    switch (confidence) {
      case 'HIGH':
        return 'confidence-high';
      case 'MEDIUM':
        return 'confidence-medium';
      case 'LOW':
        return 'confidence-low';
      default:
        return 'confidence-unknown';
    }
  }

  /**
   * Get confidence icon
   * @param {string} confidence - Confidence level
   * @returns {string} Icon emoji
   */
  getConfidenceIcon(confidence) {
    switch (confidence) {
      case 'HIGH':
        return '🔴';
      case 'MEDIUM':
        return '🟡';
      case 'LOW':
        return '🟠';
      default:
        return '⚪';
    }
  }

  /**
   * Set up event listeners
   */
  setupEventListeners() {
    const overrideBtn = this.container.querySelector('.duplicate-override-btn');
    if (overrideBtn) {
      overrideBtn.addEventListener('click', () => {
        this.overrideState = true;
        if (this.options.onOverride) {
          this.options.onOverride(this.matches, this.confidence);
        }
        this.hide();
      });
    }
    
    const closeBtn = this.container.querySelector('.duplicate-warning-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        if (this.options.onDismiss) {
          this.options.onDismiss();
        }
        this.hide();
      });
    }
  }

  /**
   * Show warning
   */
  show() {
    if (this.container) {
      this.container.style.display = 'block';
      this.isVisible = true;
    }
  }

  /**
   * Hide warning
   */
  hide() {
    if (this.container) {
      this.container.style.display = 'none';
      this.isVisible = false;
    }
  }

  /**
   * Get override state
   * @returns {boolean} True if overridden
   */
  getOverrideState() {
    return this.overrideState;
  }

  /**
   * Reset override state
   */
  resetOverride() {
    this.overrideState = false;
  }

  /**
   * Escape HTML
   * @param {string} text - Text to escape
   * @returns {string} Escaped text
   */
  escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Destroy component
   */
  destroy() {
    if (this.container) {
      this.container.innerHTML = '';
    }
    this.isVisible = false;
    this.matches = [];
    this.confidence = null;
    this.overrideState = false;
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { DuplicateWarning };
}

// Make available globally
if (typeof window !== 'undefined') {
  window.DuplicateWarning = DuplicateWarning;
}
