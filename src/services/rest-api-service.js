/**
 * REST API Service (Phase 4C)
 * Foundation for backend API integration
 */

class RestAPIService {
  constructor(options = {}) {
    this.options = {
      baseURL: options.baseURL || '/api',
      timeout: options.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };

    this.requestInterceptors = [];
    this.responseInterceptors = [];
  }

  /**
   * Make HTTP request
   * @param {string} method - HTTP method
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Request data
   * @param {Object} options - Request options
   * @returns {Promise<Object>} Response data
   */
  async request(method, endpoint, data = null, options = {}) {
    const url = `${this.options.baseURL}${endpoint}`;
    const config = {
      method,
      headers: { ...this.options.headers, ...options.headers },
      ...options
    };

    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      config.body = JSON.stringify(data);
    }

    // Apply request interceptors
    for (const interceptor of this.requestInterceptors) {
      await interceptor(config);
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.options.timeout);
      config.signal = controller.signal;

      const response = await fetch(url, config);
      clearTimeout(timeoutId);

      let responseData = await response.json().catch(() => response.text());

      // Apply response interceptors
      for (const interceptor of this.responseInterceptors) {
        responseData = await interceptor(response, responseData);
      }

      if (!response.ok) {
        throw new Error(responseData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      return responseData;
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      throw error;
    }
  }

  /**
   * GET request
   * @param {string} endpoint - API endpoint
   * @param {Object} options - Request options
   * @returns {Promise<Object>} Response data
   */
  async get(endpoint, options = {}) {
    return this.request('GET', endpoint, null, options);
  }

  /**
   * POST request
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Request data
   * @param {Object} options - Request options
   * @returns {Promise<Object>} Response data
   */
  async post(endpoint, data, options = {}) {
    return this.request('POST', endpoint, data, options);
  }

  /**
   * PUT request
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Request data
   * @param {Object} options - Request options
   * @returns {Promise<Object>} Response data
   */
  async put(endpoint, data, options = {}) {
    return this.request('PUT', endpoint, data, options);
  }

  /**
   * PATCH request
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Request data
   * @param {Object} options - Request options
   * @returns {Promise<Object>} Response data
   */
  async patch(endpoint, data, options = {}) {
    return this.request('PATCH', endpoint, data, options);
  }

  /**
   * DELETE request
   * @param {string} endpoint - API endpoint
   * @param {Object} options - Request options
   * @returns {Promise<Object>} Response data
   */
  async delete(endpoint, options = {}) {
    return this.request('DELETE', endpoint, null, options);
  }

  /**
   * Add request interceptor
   * @param {Function} interceptor - Interceptor function
   */
  addRequestInterceptor(interceptor) {
    this.requestInterceptors.push(interceptor);
  }

  /**
   * Add response interceptor
   * @param {Function} interceptor - Interceptor function
   */
  addResponseInterceptor(interceptor) {
    this.responseInterceptors.push(interceptor);
  }

  /**
   * Set authentication token
   * @param {string} token - Auth token
   */
  setAuthToken(token) {
    this.options.headers['Authorization'] = `Bearer ${token}`;
  }

  /**
   * Remove authentication token
   */
  removeAuthToken() {
    delete this.options.headers['Authorization'];
  }

  // CRM-specific API methods
  /**
   * Get leads
   * @param {Object} filters - Filter options
   * @returns {Promise<Array>} Leads array
   */
  async getLeads(filters = {}) {
    const queryParams = new URLSearchParams(filters).toString();
    return this.get(`/leads${queryParams ? '?' + queryParams : ''}`);
  }

  /**
   * Get lead by ID
   * @param {string} leadId - Lead ID
   * @returns {Promise<Object>} Lead object
   */
  async getLead(leadId) {
    return this.get(`/leads/${leadId}`);
  }

  /**
   * Create lead
   * @param {Object} leadData - Lead data
   * @returns {Promise<Object>} Created lead
   */
  async createLead(leadData) {
    return this.post('/leads', leadData);
  }

  /**
   * Update lead
   * @param {string} leadId - Lead ID
   * @param {Object} leadData - Lead data
   * @returns {Promise<Object>} Updated lead
   */
  async updateLead(leadId, leadData) {
    return this.put(`/leads/${leadId}`, leadData);
  }

  /**
   * Delete lead
   * @param {string} leadId - Lead ID
   * @returns {Promise<void>}
   */
  async deleteLead(leadId) {
    return this.delete(`/leads/${leadId}`);
  }

  /**
   * Get analytics data
   * @param {Object} options - Analytics options
   * @returns {Promise<Object>} Analytics data
   */
  async getAnalytics(options = {}) {
    return this.get('/analytics', { params: options });
  }
}

// Create singleton instance
const restAPIService = new RestAPIService();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { RestAPIService, restAPIService };
}

// Make available globally
if (typeof window !== 'undefined') {
  window.RestAPIService = RestAPIService;
  window.restAPIService = restAPIService;
}
