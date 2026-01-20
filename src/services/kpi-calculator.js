/**
 * KPI Calculator Service (TASK-2.7.1)
 * Comprehensive KPI calculations for CRM dashboard
 */

class KPICalculator {
  constructor() {
    this.database = null;
    this.cache = null;
    this.cacheTTL = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Initialize calculator with database and cache
   * @param {Object} database - Firebase database reference
   * @param {Object} cacheManager - Cache manager instance (optional)
   */
  initialize(database, cacheManager = null) {
    this.database = database;
    this.cache = cacheManager || (typeof cacheManager !== 'undefined' ? cacheManager : null);
  }

  /**
   * Get database reference
   */
  getDatabase() {
    if (!this.database) {
      this.database = database || window.database;
    }
    if (!this.database) {
      throw new Error('Database not initialized. Please refresh the page.');
    }
    return this.database;
  }

  /**
   * Get cached value or calculate
   * @param {string} key - Cache key
   * @param {Function} calculateFn - Function to calculate value
   * @returns {Promise<*>} Cached or calculated value
   */
  async getCachedOrCalculate(key, calculateFn) {
    if (this.cache && this.cache.has(key)) {
      return this.cache.get(key);
    }

    const value = await calculateFn();
    
    if (this.cache) {
      this.cache.set(key, value, this.cacheTTL);
    }

    return value;
  }

  /**
   * Calculate Customer Lifetime Value (LTV)
   * @param {Object} filters - Filter options (dateFrom, dateTo, agent, etc.)
   * @returns {Promise<Object>} LTV metrics
   */
  async calculateLTV(filters = {}) {
    const cacheKey = `ltv_${JSON.stringify(filters)}`;
    
    return this.getCachedOrCalculate(cacheKey, async () => {
      try {
        const db = this.getDatabase();
        const salesRef = db.ref('sales');
        
        // Build optimized query with limits
        let query = salesRef.orderByChild('timestamp');
        
        // Apply date filters at query level if provided
        if (filters.dateFrom) {
          query = query.startAt(filters.dateFrom);
        }
        if (filters.dateTo) {
          query = query.endAt(filters.dateTo);
        }
        
        // Limit to last 1000 records for recent metrics (or all if date range specified)
        // This prevents loading entire database for KPI calculations
        if (!filters.dateFrom && !filters.dateTo) {
          query = query.limitToLast(1000); // Last 1000 records for recent metrics
        }
        
        const snapshot = await query.once('value');
        
        let totalLTV = 0;
        let customerCount = 0;
        const ltvByPlan = {};
        
        if (snapshot.exists()) {
          snapshot.forEach((childSnapshot) => {
            const saleData = childSnapshot.val();
            
            // Apply agent filter client-side (if needed)
            if (filters.agent && saleData.agentEmail !== filters.agent) return;
            
            // Only count converted customers
            if (saleData.submittedAt || saleData.leadStatus === 'converted') {
              const monthlyCost = saleData.plan?.monthlyCost || 0;
              const planType = saleData.plan?.type || 'unknown';
              
              // Estimate LTV: monthly cost * expected months (12 for annual, 24 for premium)
              const expectedMonths = planType === 'premium' ? 24 : planType === 'standard' ? 18 : 12;
              const ltv = monthlyCost * expectedMonths;
              
              totalLTV += ltv;
              customerCount++;
              
              if (!ltvByPlan[planType]) {
                ltvByPlan[planType] = { total: 0, count: 0 };
              }
              ltvByPlan[planType].total += ltv;
              ltvByPlan[planType].count++;
            }
          });
        }
        
        const avgLTV = customerCount > 0 ? (totalLTV / customerCount).toFixed(2) : 0;
        
        return {
          totalLTV: totalLTV.toFixed(2),
          avgLTV: parseFloat(avgLTV),
          customerCount: customerCount,
          ltvByPlan: ltvByPlan
        };
      } catch (error) {
        console.error('KPI Calculator: Error calculating LTV:', error);
        throw error;
      }
    }, 5 * 60 * 1000); // 5 minute cache TTL
  }

  /**
   * Calculate Customer Retention Rate
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>} Retention metrics
   */
  async calculateRetentionRate(filters = {}) {
    const cacheKey = `retention_${JSON.stringify(filters)}`;
    
    return this.getCachedOrCalculate(cacheKey, async () => {
      try {
        const db = this.getDatabase();
        const salesRef = db.ref('sales');
        
        // Build optimized query with limits
        let query = salesRef.orderByChild('timestamp');
        
        if (filters.dateFrom) {
          query = query.startAt(filters.dateFrom);
        }
        if (filters.dateTo) {
          query = query.endAt(filters.dateTo);
        }
        
        // Limit to last 1000 records if no date range
        if (!filters.dateFrom && !filters.dateTo) {
          query = query.limitToLast(1000);
        }
        
        const snapshot = await query.once('value');
        
        let totalCustomers = 0;
        let retainedCustomers = 0;
        const retentionByPeriod = {};
        
        if (snapshot.exists()) {
          snapshot.forEach((childSnapshot) => {
            const saleData = childSnapshot.val();
            
            // Apply filters
            if (filters.dateFrom && saleData.timestamp < filters.dateFrom) return;
            if (filters.dateTo && saleData.timestamp > filters.dateTo) return;
            
            // Only count converted customers
            if (saleData.submittedAt || saleData.leadStatus === 'converted') {
              totalCustomers++;
              
              // Check if customer is retained (has active subscription or recent activity)
              const submittedDate = saleData.submittedAt ? new Date(saleData.submittedAt) : new Date(saleData.timestamp);
              const monthsSince = (Date.now() - submittedDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
              
              // Consider retained if less than 2 months old or has recent activity
              const isRetained = monthsSince < 2 || saleData.lastActivityDate;
              
              if (isRetained) {
                retainedCustomers++;
              }
              
              // Group by period
              const period = monthsSince < 1 ? '0-1' : monthsSince < 3 ? '1-3' : monthsSince < 6 ? '3-6' : '6+';
              if (!retentionByPeriod[period]) {
                retentionByPeriod[period] = { total: 0, retained: 0 };
              }
              retentionByPeriod[period].total++;
              if (isRetained) {
                retentionByPeriod[period].retained++;
              }
            }
          });
        }
        
        const retentionRate = totalCustomers > 0 ? ((retainedCustomers / totalCustomers) * 100).toFixed(2) : 0;
        
        return {
          totalCustomers: totalCustomers,
          retainedCustomers: retainedCustomers,
          retentionRate: parseFloat(retentionRate),
          retentionByPeriod: retentionByPeriod
        };
      } catch (error) {
        console.error('KPI Calculator: Error calculating retention rate:', error);
        throw error;
      }
    });
  }

  /**
   * Calculate Churn Rate
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>} Churn metrics
   */
  async calculateChurnRate(filters = {}) {
    const cacheKey = `churn_${JSON.stringify(filters)}`;
    
    return this.getCachedOrCalculate(cacheKey, async () => {
      try {
        const db = this.getDatabase();
        const salesRef = db.ref('sales');
        
        // Build optimized query with limits
        let query = salesRef.orderByChild('timestamp');
        
        if (filters.dateFrom) {
          query = query.startAt(filters.dateFrom);
        }
        if (filters.dateTo) {
          query = query.endAt(filters.dateTo);
        }
        
        // Limit to last 1000 records if no date range
        if (!filters.dateFrom && !filters.dateTo) {
          query = query.limitToLast(1000);
        }
        
        const snapshot = await query.once('value');
        
        let totalCustomers = 0;
        let churnedCustomers = 0;
        const churnByPeriod = {};
        
        if (snapshot.exists()) {
          snapshot.forEach((childSnapshot) => {
            const saleData = childSnapshot.val();
            
            // Apply filters
            if (filters.dateFrom && saleData.timestamp < filters.dateFrom) return;
            if (filters.dateTo && saleData.timestamp > filters.dateTo) return;
            
            // Only count converted customers
            if (saleData.submittedAt || saleData.leadStatus === 'converted') {
              totalCustomers++;
              
              // Check if customer churned (no recent activity and older than 2 months)
              const submittedDate = saleData.submittedAt ? new Date(saleData.submittedAt) : new Date(saleData.timestamp);
              const monthsSince = (Date.now() - submittedDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
              
              const isChurned = monthsSince >= 2 && !saleData.lastActivityDate;
              
              if (isChurned) {
                churnedCustomers++;
              }
              
              // Group by period
              const period = monthsSince < 1 ? '0-1' : monthsSince < 3 ? '1-3' : monthsSince < 6 ? '3-6' : '6+';
              if (!churnByPeriod[period]) {
                churnByPeriod[period] = { total: 0, churned: 0 };
              }
              churnByPeriod[period].total++;
              if (isChurned) {
                churnByPeriod[period].churned++;
              }
            }
          });
        }
        
        const churnRate = totalCustomers > 0 ? ((churnedCustomers / totalCustomers) * 100).toFixed(2) : 0;
        
        return {
          totalCustomers: totalCustomers,
          churnedCustomers: churnedCustomers,
          churnRate: parseFloat(churnRate),
          churnByPeriod: churnByPeriod
        };
      } catch (error) {
        console.error('KPI Calculator: Error calculating churn rate:', error);
        throw error;
      }
    });
  }

  /**
   * Calculate Average Revenue Per Customer (ARPC)
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>} ARPC metrics
   */
  async calculateARPC(filters = {}) {
    const cacheKey = `arpc_${JSON.stringify(filters)}`;
    
    return this.getCachedOrCalculate(cacheKey, async () => {
      try {
        const db = this.getDatabase();
        const salesRef = db.ref('sales');
        
        // Build optimized query with limits
        let query = salesRef.orderByChild('timestamp');
        
        if (filters.dateFrom) {
          query = query.startAt(filters.dateFrom);
        }
        if (filters.dateTo) {
          query = query.endAt(filters.dateTo);
        }
        
        // Limit to last 1000 records if no date range
        if (!filters.dateFrom && !filters.dateTo) {
          query = query.limitToLast(1000);
        }
        
        const snapshot = await query.once('value');
        const snapshot = await salesRef.once('value');
        
        let totalRevenue = 0;
        let customerCount = 0;
        const revenueByPlan = {};
        
        if (snapshot.exists()) {
          snapshot.forEach((childSnapshot) => {
            const saleData = childSnapshot.val();
            
            // Apply filters
            if (filters.dateFrom && saleData.timestamp < filters.dateFrom) return;
            if (filters.dateTo && saleData.timestamp > filters.dateTo) return;
            if (filters.agent && saleData.agentEmail !== filters.agent) return;
            
            // Only count converted customers
            if (saleData.submittedAt || saleData.leadStatus === 'converted') {
              const monthlyCost = saleData.plan?.monthlyCost || 0;
              const planType = saleData.plan?.type || 'unknown';
              
              totalRevenue += monthlyCost;
              customerCount++;
              
              if (!revenueByPlan[planType]) {
                revenueByPlan[planType] = { total: 0, count: 0 };
              }
              revenueByPlan[planType].total += monthlyCost;
              revenueByPlan[planType].count++;
            }
          });
        }
        
        const arpc = customerCount > 0 ? (totalRevenue / customerCount).toFixed(2) : 0;
        
        return {
          totalRevenue: totalRevenue.toFixed(2),
          arpc: parseFloat(arpc),
          customerCount: customerCount,
          revenueByPlan: revenueByPlan
        };
      } catch (error) {
        console.error('KPI Calculator: Error calculating ARPC:', error);
        throw error;
      }
    });
  }

  /**
   * Calculate Agent Performance Metrics
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>} Agent metrics
   */
  async calculateAgentMetrics(filters = {}) {
    const cacheKey = `agent_metrics_${JSON.stringify(filters)}`;
    
    return this.getCachedOrCalculate(cacheKey, async () => {
      try {
        const db = this.getDatabase();
        const salesRef = db.ref('sales');
        
        // Build optimized query with limits
        let query = salesRef.orderByChild('timestamp');
        
        if (filters.dateFrom) {
          query = query.startAt(filters.dateFrom);
        }
        if (filters.dateTo) {
          query = query.endAt(filters.dateTo);
        }
        
        // Limit to last 2000 records if no date range (enough for agent metrics)
        if (!filters.dateFrom && !filters.dateTo) {
          query = query.limitToLast(2000);
        }
        
        const snapshot = await query.once('value');
        
        const agentMetrics = {};
        
        if (snapshot.exists()) {
          snapshot.forEach((childSnapshot) => {
            const saleData = childSnapshot.val();
            
            // Apply filters
            if (filters.dateFrom && saleData.timestamp < filters.dateFrom) return;
            if (filters.dateTo && saleData.timestamp > filters.dateTo) return;
            
            const agentEmail = saleData.agentEmail || saleData.agentId || 'unknown';
            
            if (!agentMetrics[agentEmail]) {
              agentMetrics[agentEmail] = {
                leads: 0,
                conversions: 0,
                totalTimeToConvert: 0,
                convertCount: 0,
                interestedLeads: 0
              };
            }
            
            // Count leads
            const isLead = !saleData.submittedAt || 
                          saleData.leadStatus === 'new' || 
                          saleData.leadStatus === 'contacted' || 
                          saleData.leadStatus === 'dispositioned';
            
            if (isLead || saleData.submittedAt) {
              agentMetrics[agentEmail].leads++;
              
              if (saleData.disposition === 'interested') {
                agentMetrics[agentEmail].interestedLeads++;
              }
            }
            
            // Count conversions
            if (saleData.submittedAt || saleData.leadStatus === 'converted') {
              agentMetrics[agentEmail].conversions++;
              
              // Calculate time to convert
              if (saleData.createdAt && saleData.submittedAt) {
                const created = new Date(saleData.createdAt);
                const converted = new Date(saleData.submittedAt);
                const days = (converted - created) / (1000 * 60 * 60 * 24);
                agentMetrics[agentEmail].totalTimeToConvert += days;
                agentMetrics[agentEmail].convertCount++;
              }
            }
          });
        }
        
        // Calculate rates and averages
        const agentResults = Object.entries(agentMetrics).map(([agent, metrics]) => {
          const conversionRate = metrics.leads > 0 ? ((metrics.conversions / metrics.leads) * 100).toFixed(2) : 0;
          const avgTimeToConvert = metrics.convertCount > 0 ? (metrics.totalTimeToConvert / metrics.convertCount).toFixed(1) : 0;
          const interestRate = metrics.leads > 0 ? ((metrics.interestedLeads / metrics.leads) * 100).toFixed(2) : 0;
          
          return {
            agent: agent,
            leads: metrics.leads,
            conversions: metrics.conversions,
            conversionRate: parseFloat(conversionRate),
            avgTimeToConvert: parseFloat(avgTimeToConvert),
            interestedLeads: metrics.interestedLeads,
            interestRate: parseFloat(interestRate)
          };
        });
        
        // Sort by conversion rate descending
        agentResults.sort((a, b) => b.conversionRate - a.conversionRate);
        
        return {
          agents: agentResults,
          totalAgents: agentResults.length,
          topPerformer: agentResults[0] || null
        };
      } catch (error) {
        console.error('KPI Calculator: Error calculating agent metrics:', error);
        throw error;
      }
    });
  }

  /**
   * Calculate all KPIs at once
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>} All KPI metrics
   */
  async calculateAllKPIs(filters = {}) {
    try {
      const [ltv, retention, churn, arpc, agentMetrics] = await Promise.all([
        this.calculateLTV(filters),
        this.calculateRetentionRate(filters),
        this.calculateChurnRate(filters),
        this.calculateARPC(filters),
        this.calculateAgentMetrics(filters)
      ]);
      
      return {
        ltv: ltv,
        retention: retention,
        churn: churn,
        arpc: arpc,
        agentMetrics: agentMetrics,
        calculatedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('KPI Calculator: Error calculating all KPIs:', error);
      throw error;
    }
  }

  /**
   * Clear cache
   */
  clearCache() {
    if (this.cache) {
      this.cache.invalidate(/^(ltv_|retention_|churn_|arpc_|agent_metrics_)/);
    }
  }
}

// Create singleton instance
const kpiCalculator = new KPICalculator();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { KPICalculator, kpiCalculator };
}

// Make available globally
if (typeof window !== 'undefined') {
  window.kpiCalculator = kpiCalculator;
  window.KPICalculator = KPICalculator;
}
