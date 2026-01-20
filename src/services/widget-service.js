/**
 * Widget Service
 * Manages widget data fetching, caching, and real-time updates
 */

class WidgetService {
  constructor() {
    this.database = null;
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    this.realtimeListeners = new Map();
  }

  /**
   * Initialize service with database reference
   * @param {Object} database - Firebase database reference
   */
  initialize(database) {
    this.database = database || (typeof database !== 'undefined' ? database : null);
    if (!this.database) {
      console.warn('WidgetService: Database not provided');
    }
  }

  /**
   * Get database reference
   * @returns {Object} Firebase database reference
   */
  getDatabase() {
    if (!this.database) {
      this.database = typeof database !== 'undefined' ? database : null;
    }
    if (!this.database) {
      throw new Error('Database not initialized. Please initialize WidgetService with database reference.');
    }
    return this.database;
  }

  /**
   * Fetch data for metric widget
   * @param {Object} options - Options
   * @param {string} options.metric - Metric type (conversionRate, newLeads, conversions, etc.)
   * @param {Object} options.filters - Date filters, etc.
   * @returns {Promise<*>} Metric data
   */
  async fetchMetricData(options = {}) {
    const cacheKey = `metric-${options.metric}-${JSON.stringify(options.filters || {})}`;
    
    // Check cache
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
    }

    try {
      const db = this.getDatabase();
      const salesRef = db.ref('sales');
      const snapshot = await salesRef.once('value');
      
      let data = null;
      
      // Apply filters
      const filters = options.filters || {};
      let allSales = [];
      
      if (snapshot.exists()) {
        snapshot.forEach((childSnapshot) => {
          const saleData = childSnapshot.val();
          
          // Apply date filters
          if (filters.dateFrom && saleData.timestamp < filters.dateFrom) return;
          if (filters.dateTo && saleData.timestamp > filters.dateTo) return;
          if (filters.agent && saleData.agentEmail !== filters.agent) return;
          
          allSales.push({
            id: childSnapshot.key,
            ...saleData
          });
        });
      }

      // Calculate metric based on type
      switch (options.metric) {
        case 'conversionRate':
          const totalLeads = allSales.filter(s => !s.submittedAt || s.leadStatus !== 'converted').length;
          const interestedLeads = allSales.filter(s => s.disposition === 'interested').length;
          const rate = totalLeads > 0 ? (interestedLeads / totalLeads) * 100 : 0;
          data = {
            value: rate.toFixed(2),
            label: 'Conversion Rate',
            unit: '%',
            detail: `${interestedLeads} of ${totalLeads} leads`
          };
          break;
          
        case 'newLeads':
          const newLeads = allSales.filter(s => s.leadStatus === 'new' || (!s.leadStatus && !s.submittedAt)).length;
          data = {
            value: newLeads,
            label: 'New Leads',
            unit: '',
            detail: 'This period'
          };
          break;
          
        case 'conversions':
          const conversions = allSales.filter(s => s.submittedAt || s.leadStatus === 'converted').length;
          const newLeadsCount = allSales.filter(s => s.leadStatus === 'new' || (!s.leadStatus && !s.submittedAt)).length;
          const convRate = newLeadsCount > 0 ? (conversions / newLeadsCount) * 100 : 0;
          data = {
            value: conversions,
            label: 'Conversions',
            unit: '',
            detail: `Conversion rate: ${convRate.toFixed(2)}%`
          };
          break;
          
        case 'avgTimeToConvert':
          let totalTime = 0;
          let convertCount = 0;
          allSales.forEach(sale => {
            if (sale.submittedAt && sale.createdAt) {
              const created = new Date(sale.createdAt);
              const converted = new Date(sale.submittedAt);
              const days = (converted - created) / (1000 * 60 * 60 * 24);
              totalTime += days;
              convertCount++;
            }
          });
          const avgTime = convertCount > 0 ? (totalTime / convertCount).toFixed(1) : 0;
          data = {
            value: avgTime,
            label: 'Avg Time to Convert',
            unit: ' days',
            detail: ''
          };
          break;
          
        default:
          data = { value: 0, label: 'Unknown Metric', unit: '', detail: '' };
      }

      // Cache result
      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });

      return data;
    } catch (error) {
      console.error('Error fetching metric data:', error);
      throw error;
    }
  }

  /**
   * Fetch data for chart widget
   * @param {Object} options - Options
   * @param {string} options.chartType - Chart type (pie, bar, line)
   * @param {string} options.dataType - Data type (disposition, conversion, acquisition)
   * @param {Object} options.filters - Filters
   * @returns {Promise<*>} Chart data
   */
  async fetchChartData(options = {}) {
    const cacheKey = `chart-${options.chartType}-${options.dataType}-${JSON.stringify(options.filters || {})}`;
    
    // Check cache
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
    }

    try {
      // This will be enhanced in Phase 2 with interactive charts
      // For now, return basic chart data structure
      const data = {
        labels: [],
        datasets: [{
          data: [],
          backgroundColor: []
        }]
      };

      // Cache result
      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });

      return data;
    } catch (error) {
      console.error('Error fetching chart data:', error);
      throw error;
    }
  }

  /**
   * Fetch data for list widget
   * @param {Object} options - Options
   * @param {string} options.listType - List type (recent, top, etc.)
   * @param {number} options.limit - Number of items
   * @param {Object} options.filters - Filters
   * @returns {Promise<Array>} List data
   */
  async fetchListData(options = {}) {
    const cacheKey = `list-${options.listType}-${options.limit}-${JSON.stringify(options.filters || {})}`;
    
    // Check cache
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
    }

    try {
      const db = this.getDatabase();
      const salesRef = db.ref('sales');
      const snapshot = await salesRef.once('value');
      
      let items = [];
      
      if (snapshot.exists()) {
        snapshot.forEach((childSnapshot) => {
          const saleData = childSnapshot.val();
          
          // Apply filters
          const filters = options.filters || {};
          if (filters.dateFrom && saleData.timestamp < filters.dateFrom) return;
          if (filters.dateTo && saleData.timestamp > filters.dateTo) return;
          
          items.push({
            id: childSnapshot.key,
            ...saleData
          });
        });
      }

      // Sort and limit
      if (options.listType === 'recent') {
        items.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      }
      
      items = items.slice(0, options.limit || 10);

      // Cache result
      this.cache.set(cacheKey, {
        data: items,
        timestamp: Date.now()
      });

      return items;
    } catch (error) {
      console.error('Error fetching list data:', error);
      throw error;
    }
  }

  /**
   * Fetch data for activity widget
   * @param {Object} options - Options
   * @param {number} options.limit - Number of activities
   * @returns {Promise<Array>} Activity data
   */
  async fetchActivityData(options = {}) {
    const cacheKey = `activity-${options.limit || 10}`;
    
    // Check cache
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
    }

    try {
      const db = this.getDatabase();
      const logsRef = db.ref('security_logs');
      const snapshot = await logsRef.once('value');
      
      let activities = [];
      
      if (snapshot.exists()) {
        snapshot.forEach((childSnapshot) => {
          const logData = childSnapshot.val();
          activities.push({
            id: childSnapshot.key,
            ...logData
          });
        });
      }

      // Sort by timestamp (newest first) and limit
      activities.sort((a, b) => {
        const aTime = new Date(a.timestamp || 0).getTime();
        const bTime = new Date(b.timestamp || 0).getTime();
        return bTime - aTime;
      });
      
      activities = activities.slice(0, options.limit || 10);

      // Cache result
      this.cache.set(cacheKey, {
        data: activities,
        timestamp: Date.now()
      });

      return activities;
    } catch (error) {
      console.error('Error fetching activity data:', error);
      throw error;
    }
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Clear cache for specific key pattern
   * @param {string} pattern - Cache key pattern
   */
  clearCachePattern(pattern) {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }
}

// Create singleton instance
const widgetService = new WidgetService();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { WidgetService, widgetService };
}

// Make available globally
if (typeof window !== 'undefined') {
  window.WidgetService = WidgetService;
  window.widgetService = widgetService;
}
