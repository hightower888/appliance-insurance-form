/**
 * Dashboard Service
 * Manages dashboard CRUD operations and configuration management
 */

class DashboardService {
  constructor() {
    this.database = null;
    this.currentUserId = null;
    this.currentDashboardId = null;
  }

  /**
   * Initialize service with database reference
   * @param {Object} database - Firebase database reference
   * @param {string} userId - Current user ID
   */
  initialize(database, userId = null) {
    this.database = database || (typeof database !== 'undefined' ? database : null);
    this.currentUserId = userId || this.getCurrentUserId();
    
    if (!this.database) {
      console.warn('DashboardService: Database not provided');
    }
  }

  /**
   * Get current user ID
   * @returns {string|null} User ID
   */
  getCurrentUserId() {
    // Try to get from auth if available
    if (typeof firebase !== 'undefined' && firebase.auth) {
      const user = firebase.auth().currentUser;
      if (user) return user.uid;
    }
    
    // Try to get from localStorage
    try {
      const userData = localStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        return user.uid || user.email || null;
      }
    } catch (e) {
      // Ignore
    }
    
    return this.currentUserId || 'anonymous';
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
      throw new Error('Database not initialized. Please initialize DashboardService with database reference.');
    }
    return this.database;
  }

  /**
   * Save dashboard configuration
   * @param {Object} config - Dashboard configuration
   * @param {string} dashboardId - Dashboard ID (optional, creates new if not provided)
   * @param {string} name - Dashboard name
   * @param {boolean} isDefault - Whether this is the default dashboard
   * @returns {Promise<string>} Dashboard ID
   */
  async saveDashboard(config, dashboardId = null, name = 'My Dashboard', isDefault = false) {
    const userId = this.getCurrentUserId();
    if (!userId) {
      throw new Error('User not authenticated');
    }

    const db = this.getDatabase();
    const dashboardsRef = db.ref(`user_dashboards/${userId}`);
    
    try {
      let id = dashboardId;
      
      if (!id) {
        // Create new dashboard
        const newRef = dashboardsRef.push();
        id = newRef.key;
      }

      const dashboardData = {
        id: id,
        name: name,
        config: config,
        isDefault: isDefault,
        createdAt: dashboardId ? undefined : Date.now(),
        updatedAt: Date.now(),
        userId: userId
      };

      // Remove undefined fields
      Object.keys(dashboardData).forEach(key => {
        if (dashboardData[key] === undefined) {
          delete dashboardData[key];
        }
      });

      await dashboardsRef.child(id).set(dashboardData);

      // If this is default, unset other defaults
      if (isDefault) {
        await this.setDefaultDashboard(id);
      }

      this.currentDashboardId = id;
      return id;
    } catch (error) {
      console.error('Error saving dashboard:', error);
      throw error;
    }
  }

  /**
   * Load dashboard configuration
   * @param {string} dashboardId - Dashboard ID (optional, loads default if not provided)
   * @returns {Promise<Object>} Dashboard configuration
   */
  async loadDashboard(dashboardId = null) {
    const userId = this.getCurrentUserId();
    if (!userId) {
      throw new Error('User not authenticated');
    }

    const db = this.getDatabase();
    
    try {
      let dashboardData = null;

      if (dashboardId) {
        // Load specific dashboard
        const dashboardRef = db.ref(`user_dashboards/${userId}/${dashboardId}`);
        const snapshot = await dashboardRef.once('value');
        if (snapshot.exists()) {
          dashboardData = snapshot.val();
        }
      } else {
        // Load default dashboard
        dashboardData = await this.getDefaultDashboard();
      }

      if (!dashboardData) {
        // Return empty dashboard config
        return {
          id: null,
          name: 'New Dashboard',
          config: {
            widgets: [],
            layout: 'grid',
            gridColumns: 12
          },
          isDefault: false
        };
      }

      return dashboardData;
    } catch (error) {
      console.error('Error loading dashboard:', error);
      throw error;
    }
  }

  /**
   * Get default dashboard
   * @returns {Promise<Object|null>} Default dashboard data
   */
  async getDefaultDashboard() {
    const userId = this.getCurrentUserId();
    if (!userId) {
      return null;
    }

    const db = this.getDatabase();
    const dashboardsRef = db.ref(`user_dashboards/${userId}`);
    
    try {
      const snapshot = await dashboardsRef.orderByChild('isDefault').equalTo(true).once('value');
      
      if (snapshot.exists()) {
        const dashboards = snapshot.val();
        // Get first default dashboard
        const dashboardId = Object.keys(dashboards)[0];
        return dashboards[dashboardId];
      }

      // If no default, get the first dashboard
      const allSnapshot = await dashboardsRef.once('value');
      if (allSnapshot.exists()) {
        const dashboards = allSnapshot.val();
        const dashboardId = Object.keys(dashboards)[0];
        return dashboards[dashboardId];
      }

      return null;
    } catch (error) {
      console.error('Error getting default dashboard:', error);
      return null;
    }
  }

  /**
   * Set default dashboard
   * @param {string} dashboardId - Dashboard ID
   */
  async setDefaultDashboard(dashboardId) {
    const userId = this.getCurrentUserId();
    if (!userId) {
      throw new Error('User not authenticated');
    }

    const db = this.getDatabase();
    const dashboardsRef = db.ref(`user_dashboards/${userId}`);
    
    try {
      // Unset all other defaults
      const snapshot = await dashboardsRef.once('value');
      if (snapshot.exists()) {
        const updates = {};
        snapshot.forEach((childSnapshot) => {
          if (childSnapshot.key !== dashboardId) {
            updates[`${childSnapshot.key}/isDefault`] = false;
          }
        });
        if (Object.keys(updates).length > 0) {
          await dashboardsRef.update(updates);
        }
      }

      // Set this dashboard as default
      await dashboardsRef.child(`${dashboardId}/isDefault`).set(true);
    } catch (error) {
      console.error('Error setting default dashboard:', error);
      throw error;
    }
  }

  /**
   * Get all dashboards for current user
   * @returns {Promise<Array>} Array of dashboard metadata
   */
  async getAllDashboards() {
    const userId = this.getCurrentUserId();
    if (!userId) {
      return [];
    }

    const db = this.getDatabase();
    const dashboardsRef = db.ref(`user_dashboards/${userId}`);
    
    try {
      const snapshot = await dashboardsRef.once('value');
      
      if (!snapshot.exists()) {
        return [];
      }

      const dashboards = [];
      snapshot.forEach((childSnapshot) => {
        const data = childSnapshot.val();
        dashboards.push({
          id: childSnapshot.key,
          name: data.name || 'Unnamed Dashboard',
          isDefault: data.isDefault || false,
          updatedAt: data.updatedAt || data.createdAt || 0,
          createdAt: data.createdAt || 0
        });
      });

      // Sort by updatedAt (newest first)
      dashboards.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));

      return dashboards;
    } catch (error) {
      console.error('Error getting all dashboards:', error);
      return [];
    }
  }

  /**
   * Delete dashboard
   * @param {string} dashboardId - Dashboard ID
   * @returns {Promise<void>}
   */
  async deleteDashboard(dashboardId) {
    const userId = this.getCurrentUserId();
    if (!userId) {
      throw new Error('User not authenticated');
    }

    const db = this.getDatabase();
    const dashboardRef = db.ref(`user_dashboards/${userId}/${dashboardId}`);
    
    try {
      await dashboardRef.remove();
    } catch (error) {
      console.error('Error deleting dashboard:', error);
      throw error;
    }
  }

  /**
   * Duplicate dashboard
   * @param {string} dashboardId - Dashboard ID to duplicate
   * @param {string} newName - Name for duplicated dashboard
   * @returns {Promise<string>} New dashboard ID
   */
  async duplicateDashboard(dashboardId, newName = null) {
    const dashboard = await this.loadDashboard(dashboardId);
    
    if (!dashboard || !dashboard.config) {
      throw new Error('Dashboard not found');
    }

    const name = newName || `${dashboard.name} (Copy)`;
    const newId = await this.saveDashboard(dashboard.config, null, name, false);
    
    return newId;
  }

  /**
   * Get role-based dashboard template
   * @param {string} role - User role (admin, agent, manager, etc.)
   * @returns {Promise<Object>} Dashboard template configuration
   */
  async getRoleTemplate(role = 'agent') {
    // Define role-based templates
    const templates = {
      admin: {
        widgets: [
          {
            id: 'metric-1',
            config: {
              type: 'metric',
              title: 'Total Leads',
              options: { metricType: 'newLeads', format: 'number' }
            },
            position: { x: 0, y: 0, width: 300, height: 200 }
          },
          {
            id: 'metric-2',
            config: {
              type: 'metric',
              title: 'Conversion Rate',
              options: { metricType: 'conversionRate', format: 'percentage' }
            },
            position: { x: 320, y: 0, width: 300, height: 200 }
          },
          {
            id: 'chart-1',
            config: {
              type: 'chart',
              title: 'Disposition Breakdown',
              options: { chartType: 'pie', dataType: 'disposition' }
            },
            position: { x: 0, y: 220, width: 400, height: 300 }
          },
          {
            id: 'activity-1',
            config: {
              type: 'activity',
              title: 'Recent Activity',
              options: { limit: 10 }
            },
            position: { x: 420, y: 220, width: 400, height: 300 }
          }
        ],
        layout: 'grid',
        gridColumns: 12
      },
      agent: {
        widgets: [
          {
            id: 'metric-1',
            config: {
              type: 'metric',
              title: 'My Conversions',
              options: { metricType: 'conversions', format: 'number' }
            },
            position: { x: 0, y: 0, width: 300, height: 200 }
          },
          {
            id: 'list-1',
            config: {
              type: 'list',
              title: 'My Recent Leads',
              options: { listType: 'recent', limit: 10 }
            },
            position: { x: 0, y: 220, width: 600, height: 400 }
          }
        ],
        layout: 'grid',
        gridColumns: 12
      },
      manager: {
        widgets: [
          {
            id: 'metric-1',
            config: {
              type: 'metric',
              title: 'Team Conversion Rate',
              options: { metricType: 'conversionRate', format: 'percentage' }
            },
            position: { x: 0, y: 0, width: 300, height: 200 }
          },
          {
            id: 'chart-1',
            config: {
              type: 'chart',
              title: 'Team Performance',
              options: { chartType: 'bar', dataType: 'conversion' }
            },
            position: { x: 320, y: 0, width: 500, height: 300 }
          },
          {
            id: 'activity-1',
            config: {
              type: 'activity',
              title: 'Team Activity',
              options: { limit: 15 }
            },
            position: { x: 0, y: 320, width: 820, height: 400 }
          }
        ],
        layout: 'grid',
        gridColumns: 12
      }
    };

    return templates[role] || templates.agent;
  }

  /**
   * Create dashboard from role template
   * @param {string} role - User role
   * @param {string} name - Dashboard name
   * @returns {Promise<string>} Dashboard ID
   */
  async createFromTemplate(role = 'agent', name = null) {
    const template = await this.getRoleTemplate(role);
    const dashboardName = name || `${role.charAt(0).toUpperCase() + role.slice(1)} Dashboard`;
    
    const config = {
      widgets: template.widgets,
      layout: template.layout,
      gridColumns: template.gridColumns
    };

    return await this.saveDashboard(config, null, dashboardName, true);
  }

  /**
   * Save user preferences
   * @param {Object} preferences - User preferences
   * @returns {Promise<void>}
   */
  async saveUserPreferences(preferences) {
    const userId = this.getCurrentUserId();
    if (!userId) {
      throw new Error('User not authenticated');
    }

    const db = this.getDatabase();
    const prefsRef = db.ref(`user_preferences/${userId}`);
    
    try {
      await prefsRef.set({
        ...preferences,
        updatedAt: Date.now()
      });
    } catch (error) {
      console.error('Error saving user preferences:', error);
      throw error;
    }
  }

  /**
   * Get user preferences
   * @returns {Promise<Object>} User preferences
   */
  async getUserPreferences() {
    const userId = this.getCurrentUserId();
    if (!userId) {
      return {};
    }

    const db = this.getDatabase();
    const prefsRef = db.ref(`user_preferences/${userId}`);
    
    try {
      const snapshot = await prefsRef.once('value');
      if (snapshot.exists()) {
        return snapshot.val();
      }
      return {};
    } catch (error) {
      console.error('Error getting user preferences:', error);
      return {};
    }
  }

  /**
   * Export dashboard configuration
   * @param {string} dashboardId - Dashboard ID
   * @returns {Promise<string>} JSON string
   */
  async exportDashboard(dashboardId) {
    const dashboard = await this.loadDashboard(dashboardId);
    if (!dashboard) {
      throw new Error('Dashboard not found');
    }

    const exportData = {
      version: '1.0',
      exportedAt: Date.now(),
      dashboard: {
        name: dashboard.name,
        config: dashboard.config
      }
    };

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Import dashboard configuration
   * @param {string} jsonString - JSON string
   * @param {string} name - Dashboard name
   * @returns {Promise<string>} Dashboard ID
   */
  async importDashboard(jsonString, name = null) {
    try {
      const importData = JSON.parse(jsonString);
      
      if (!importData.dashboard || !importData.dashboard.config) {
        throw new Error('Invalid dashboard export format');
      }

      const dashboardName = name || importData.dashboard.name || 'Imported Dashboard';
      const config = importData.dashboard.config;

      return await this.saveDashboard(config, null, dashboardName, false);
    } catch (error) {
      console.error('Error importing dashboard:', error);
      throw error;
    }
  }
}

// Create singleton instance
const dashboardService = new DashboardService();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { DashboardService, dashboardService };
}

// Make available globally
if (typeof window !== 'undefined') {
  window.DashboardService = DashboardService;
  window.dashboardService = dashboardService;
}
