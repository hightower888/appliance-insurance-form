/**
 * Card View Component (Phase 3)
 * Card-based layout view for displaying leads/customers
 */

class CardView extends ViewController {
  constructor(container, data = [], options = {}) {
    super('card', container, data, options);
    
    this.columns = options.columns || 3; // Number of columns in grid
    this.onCardClick = options.onCardClick || null;
    this.cardRenderer = options.cardRenderer || null;
    this.showActions = options.showActions !== false;
  }

  /**
   * Render the card view
   */
  render() {
    if (!this.container) return;

    const filteredData = this.applyFilters(this.data);
    const sortedData = this.applySorting(filteredData);
    const paginated = this.applyPagination(sortedData);

    if (sortedData.length === 0) {
      this.showEmpty('No items to display');
      return;
    }

    this.container.innerHTML = `
      <div class="card-view-container">
        <div class="card-view-header">
          <h3>Card View</h3>
          <div class="card-view-actions">
            <label style="color: var(--text-secondary); font-size: 14px; margin-right: 10px;">Columns:</label>
            <select id="cardViewColumns" class="admin-filter">
              <option value="2" ${this.columns === 2 ? 'selected' : ''}>2 Columns</option>
              <option value="3" ${this.columns === 3 ? 'selected' : ''}>3 Columns</option>
              <option value="4" ${this.columns === 4 ? 'selected' : ''}>4 Columns</option>
            </select>
            <button class="btn btn-sm btn-secondary" id="refreshCardView">Refresh</button>
          </div>
        </div>
        
        <div class="card-view-grid" style="grid-template-columns: repeat(${this.columns}, 1fr);">
          ${paginated.paginatedData.map(item => this.renderCard(item)).join('')}
        </div>
        
        ${this.renderPagination(paginated)}
      </div>
    `;

    this.setupEventListeners();
    this.isRendered = true;
  }

  /**
   * Render a card
   * @param {Object} item - Data item
   * @returns {string} HTML string
   */
  renderCard(item) {
    if (this.cardRenderer) {
      return this.cardRenderer(item);
    }

    // Default card renderer
    const id = item.id || 'unknown';
    const name = this.getNestedValue(item, 'contact.name') || 'Unknown';
    const email = this.getNestedValue(item, 'contact.email') || '';
    const phone = this.getNestedValue(item, 'contact.phone') || '';
    const address = this.getNestedValue(item, 'contact.address') || '';
    const postcode = this.getNestedValue(item, 'contact.postcode') || '';
    const status = item.leadStatus || 'new';
    const disposition = item.disposition || null;
    const date = item.timestamp ? new Date(item.timestamp).toLocaleDateString('en-GB') : '';
    const agent = item.agentEmail || '';

    const statusBadge = this.getStatusBadge(status);
    const dispositionBadge = disposition ? this.getDispositionBadge(disposition) : '';

    return `
      <div class="card-view-card" 
           data-item-id="${id}"
           onclick="this.closest('.card-view-container').__cardView?.handleCardClick('${id}')">
        <div class="card-view-card-header">
          <h4>${this.escapeHtml(name)}</h4>
          <div class="card-view-card-badges">
            ${statusBadge}
            ${dispositionBadge}
          </div>
        </div>
        <div class="card-view-card-body">
          ${email ? `<p class="card-view-card-field"><strong>Email:</strong> ${this.escapeHtml(email)}</p>` : ''}
          ${phone ? `<p class="card-view-card-field"><strong>Phone:</strong> ${this.escapeHtml(phone)}</p>` : ''}
          ${address ? `<p class="card-view-card-field"><strong>Address:</strong> ${this.escapeHtml(address)}</p>` : ''}
          ${postcode ? `<p class="card-view-card-field"><strong>Postcode:</strong> ${this.escapeHtml(postcode)}</p>` : ''}
          ${agent ? `<p class="card-view-card-field"><strong>Agent:</strong> ${this.escapeHtml(agent)}</p>` : ''}
          ${date ? `<p class="card-view-card-field"><strong>Date:</strong> ${this.escapeHtml(date)}</p>` : ''}
        </div>
        ${this.showActions ? `
        <div class="card-view-card-actions">
          <button class="btn btn-sm btn-primary" onclick="event.stopPropagation(); this.closest('.card-view-container').__cardView?.handleViewClick('${id}')">View</button>
        </div>
        ` : ''}
      </div>
    `;
  }

  /**
   * Render pagination controls
   * @param {Object} pagination - Pagination data
   * @returns {string} HTML string
   */
  renderPagination(pagination) {
    if (pagination.totalPages <= 1) return '';

    return `
      <div class="card-view-pagination">
        <button class="btn btn-secondary" 
                ${pagination.currentPage <= 1 ? 'disabled' : ''}
                onclick="this.closest('.card-view-container').__cardView?.previousPage()">
          ← Previous
        </button>
        <span class="pagination-info">
          Page ${pagination.currentPage} of ${pagination.totalPages} (${pagination.totalItems} items)
        </span>
        <button class="btn btn-secondary"
                ${pagination.currentPage >= pagination.totalPages ? 'disabled' : ''}
                onclick="this.closest('.card-view-container').__cardView?.nextPage()">
          Next →
        </button>
      </div>
    `;
  }

  /**
   * Get status badge HTML
   * @param {string} status - Status value
   * @returns {string} Badge HTML
   */
  getStatusBadge(status) {
    const badges = {
      'new': '<span class="badge badge-primary">New</span>',
      'contacted': '<span class="badge badge-info">Contacted</span>',
      'dispositioned': '<span class="badge badge-warning">Dispositioned</span>',
      'converted': '<span class="badge badge-success">Converted</span>'
    };
    return badges[status] || `<span class="badge">${status}</span>`;
  }

  /**
   * Get disposition badge HTML
   * @param {string} disposition - Disposition value
   * @returns {string} Badge HTML
   */
  getDispositionBadge(disposition) {
    const badges = {
      'interested': '<span class="badge badge-success">Interested</span>',
      'call_back': '<span class="badge badge-info">Call Back</span>',
      'not_interested': '<span class="badge badge-danger">Not Interested</span>',
      'no_answer': '<span class="badge badge-secondary">No Answer</span>',
      'other': '<span class="badge">Other</span>'
    };
    return badges[disposition] || `<span class="badge">${disposition}</span>`;
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

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Store reference for event handlers
    if (this.container) {
      const container = this.container.querySelector('.card-view-container');
      if (container) {
        container.__cardView = this;
      }
    }

    // Columns selector
    const columnsSelect = this.container.querySelector('#cardViewColumns');
    if (columnsSelect) {
      columnsSelect.addEventListener('change', (e) => {
        this.columns = parseInt(e.target.value);
        this.render();
      });
    }

    // Refresh
    const refreshBtn = this.container.querySelector('#refreshCardView');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        this.render();
      });
    }
  }

  /**
   * Handle card click
   * @param {string} itemId - Item ID
   */
  handleCardClick(itemId) {
    if (this.onCardClick) {
      const item = this.data.find(d => d.id === itemId);
      if (item) {
        this.onCardClick(item, itemId);
      }
    }
  }

  /**
   * Handle view button click
   * @param {string} itemId - Item ID
   */
  handleViewClick(itemId) {
    if (typeof viewLeadDetails === 'function') {
      viewLeadDetails(itemId);
    } else if (this.onCardClick) {
      this.handleCardClick(itemId);
    }
  }

  /**
   * Previous page
   */
  previousPage() {
    if (this.options.currentPage > 1) {
      this.options.currentPage--;
      this.render();
    }
  }

  /**
   * Next page
   */
  nextPage() {
    const paginated = this.applyPagination(this.applyFilters(this.data));
    if (this.options.currentPage < paginated.totalPages) {
      this.options.currentPage++;
      this.render();
    }
  }

  /**
   * Set number of columns
   * @param {number} columns - Number of columns
   */
  setColumns(columns) {
    this.columns = columns;
    this.render();
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CardView };
}

// Make available globally
if (typeof window !== 'undefined') {
  window.CardView = CardView;
}
