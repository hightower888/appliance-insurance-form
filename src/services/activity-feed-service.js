/**
 * Activity Feed Service
 * Manages activity feed data and real-time updates
 */

class ActivityFeedService {
  constructor() {
    this.database = null;
    this.realtimeService = null;
    this.activities = [];
    this.listeners = new Set();
    this.subscription = null;
  }

  /**
   * Initialize service
   * @param {Object} database - Firebase database reference
   * @param {Object} realtimeService - RealtimeService instance
   */
  initialize(database, realtimeService) {
    this.database = database || (typeof database !== 'undefined' ? database : null);
    this.realtimeService = realtimeService || (typeof realtimeService !== 'undefined' ? realtimeService : null);

    if (this.realtimeService) {
      this.subscribeToActivities();
    }
  }

  /**
   * Subscribe to activity updates
   */
  subscribeToActivities() {
    if (!this.realtimeService) return;

    // Subscribe to security_logs for activity feed
    this.subscription = this.realtimeService.subscribe('security_logs', (data) => {
      if (data) {
        // Convert object to array
        const activities = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));

        // Sort by timestamp (newest first)
        activities.sort((a, b) => {
          const aTime = new Date(a.timestamp || 0).getTime();
          const bTime = new Date(b.timestamp || 0).getTime();
          return bTime - aTime;
        });

        this.activities = activities;
        this.notifyListeners();
      }
    }, { eventType: 'value' });
  }

  /**
   * Get activities
   * @param {Object} options - Options { limit, type, userId }
   * @returns {Array} Activities
   */
  getActivities(options = {}) {
    let activities = [...this.activities];

    // Filter by type
    if (options.type) {
      activities = activities.filter(a => a.eventType === options.type);
    }

    // Filter by user
    if (options.userId) {
      activities = activities.filter(a => a.userId === options.userId || a.userEmail === options.userId);
    }

    // Limit
    if (options.limit) {
      activities = activities.slice(0, options.limit);
    }

    return activities;
  }

  /**
   * Get recent activities
   * @param {number} limit - Number of activities
   * @returns {Array} Recent activities
   */
  getRecentActivities(limit = 10) {
    return this.getActivities({ limit });
  }

  /**
   * Get activities by type
   * @param {string} type - Activity type
   * @param {number} limit - Number of activities
   * @returns {Array} Activities
   */
  getActivitiesByType(type, limit = 10) {
    return this.getActivities({ type, limit });
  }

  /**
   * Get user activities
   * @param {string} userId - User ID
   * @param {number} limit - Number of activities
   * @returns {Array} User activities
   */
  getUserActivities(userId, limit = 10) {
    return this.getActivities({ userId, limit });
  }

  /**
   * Create activity entry
   * @param {Object} activity - Activity data
   * @returns {Promise<string>} Activity ID
   */
  async createActivity(activity) {
    if (!this.database) {
      throw new Error('ActivityFeedService: Database not initialized');
    }

    const activityData = {
      eventType: activity.eventType || 'unknown',
      userId: activity.userId || null,
      userEmail: activity.userEmail || null,
      details: activity.details || {},
      timestamp: activity.timestamp || Date.now(),
      severity: activity.severity || 'info'
    };

    try {
      if (this.realtimeService) {
        const id = await this.realtimeService.pushData('security_logs', activityData);
        return id;
      } else {
        // Fallback to direct database access
        const ref = this.database.ref('security_logs');
        const newRef = ref.push();
        await newRef.set(activityData);
        return newRef.key;
      }
    } catch (error) {
      console.error('Error creating activity:', error);
      throw error;
    }
  }

  /**
   * Subscribe to activity changes
   * @param {Function} callback - Callback function
   * @returns {Function} Unsubscribe function
   */
  onActivitiesChange(callback) {
    this.listeners.add(callback);
    
    // Immediately call with current activities
    callback(this.activities);

    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Notify listeners of changes
   */
  notifyListeners() {
    this.listeners.forEach(callback => {
      try {
        callback(this.activities);
      } catch (error) {
        console.error('Error in activity listener:', error);
      }
    });
  }

  /**
   * Destroy service and clean up
   */
  destroy() {
    if (this.subscription && typeof this.subscription === 'function') {
      this.subscription();
    }
    this.listeners.clear();
    this.activities = [];
  }
}

// Create singleton instance
const activityFeedService = new ActivityFeedService();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ActivityFeedService, activityFeedService };
}

// Make available globally
if (typeof window !== 'undefined') {
  window.ActivityFeedService = ActivityFeedService;
  window.activityFeedService = activityFeedService;
}
