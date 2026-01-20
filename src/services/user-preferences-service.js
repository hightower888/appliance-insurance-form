/**
 * User Preferences Service (Phase 4C)
 * Manages user preferences for theme, layout, and UI customization
 */

class UserPreferencesService {
  constructor() {
    this.preferences = this.loadPreferences();
    this.listeners = [];
    this.init();
  }

  /**
   * Initialize preferences service
   */
  init() {
    // Wait for DOM to be ready before applying preferences
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        this.applyPreferences();
      });
    } else {
      this.applyPreferences();
    }
  }

  /**
   * Get preference value
   * @param {string} key - Preference key
   * @param {*} defaultValue - Default value
   * @returns {*} Preference value
   */
  get(key, defaultValue = null) {
    return this.preferences[key] !== undefined ? this.preferences[key] : defaultValue;
  }

  /**
   * Set preference value
   * @param {string} key - Preference key
   * @param {*} value - Preference value
   */
  set(key, value) {
    this.preferences[key] = value;
    this.savePreferences();
    this.applyPreference(key, value);
    this.notifyListeners('preference_changed', { key, value });
  }

  /**
   * Get all preferences
   * @returns {Object} All preferences
   */
  getAll() {
    return { ...this.preferences };
  }

  /**
   * Set multiple preferences
   * @param {Object} prefs - Preferences object
   */
  setMultiple(prefs) {
    Object.assign(this.preferences, prefs);
    this.savePreferences();
    this.applyPreferences();
    this.notifyListeners('preferences_changed', { preferences: prefs });
  }

  /**
   * Reset preferences to defaults
   */
  reset() {
    this.preferences = this.getDefaultPreferences();
    this.savePreferences();
    this.applyPreferences();
    this.notifyListeners('preferences_reset', {});
  }

  /**
   * Get default preferences
   * @returns {Object} Default preferences
   */
  getDefaultPreferences() {
    return {
      theme: 'light',
      layout: 'default',
      viewMode: 'table',
      itemsPerPage: 25,
      showSidebar: true,
      compactMode: false,
      fontSize: 'medium',
      colorScheme: 'default',
      animations: true,
      soundEnabled: false,
      notifications: true,
      autoRefresh: false,
      autoRefreshInterval: 30000,
      dateFormat: 'DD/MM/YYYY',
      timeFormat: '24h',
      language: 'en',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };
  }

  /**
   * Load preferences from storage
   * @returns {Object} Preferences
   */
  loadPreferences() {
    try {
      const userId = this.getUserId();
      const stored = localStorage.getItem(`userPreferences_${userId}`);
      if (stored) {
        const loaded = JSON.parse(stored);
        return { ...this.getDefaultPreferences(), ...loaded };
      }
    } catch (error) {
      console.error('Failed to load preferences:', error);
    }
    return this.getDefaultPreferences();
  }

  /**
   * Save preferences to storage
   */
  savePreferences() {
    try {
      const userId = this.getUserId();
      localStorage.setItem(`userPreferences_${userId}`, JSON.stringify(this.preferences));
    } catch (error) {
      console.error('Failed to save preferences:', error);
    }
  }

  /**
   * Apply all preferences
   */
  applyPreferences() {
    Object.entries(this.preferences).forEach(([key, value]) => {
      this.applyPreference(key, value);
    });
  }

  /**
   * Apply single preference
   * @param {string} key - Preference key
   * @param {*} value - Preference value
   */
  applyPreference(key, value) {
    switch (key) {
      case 'theme':
        this.applyTheme(value);
        break;
      case 'layout':
        this.applyLayout(value);
        break;
      case 'fontSize':
        this.applyFontSize(value);
        break;
      case 'compactMode':
        this.applyCompactMode(value);
        break;
      case 'showSidebar':
        this.applySidebarVisibility(value);
        break;
      case 'animations':
        this.applyAnimations(value);
        break;
      case 'colorScheme':
        this.applyColorScheme(value);
        break;
    }
  }

  /**
   * Apply theme
   * @param {string} theme - Theme name (light/dark)
   */
  applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    if (!document.body) {
      // Wait for DOM to be ready
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.applyTheme(theme));
      }
      return;
    }
    
    // Additional safety check before accessing classList
    if (!document.body.classList) {
      console.warn('document.body.classList not available');
      return;
    }
    
    if (theme === 'dark') {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
  }

  /**
   * Apply layout
   * @param {string} layout - Layout name
   */
  applyLayout(layout) {
    document.body.setAttribute('data-layout', layout);
  }

  /**
   * Apply font size
   * @param {string} fontSize - Font size (small/medium/large)
   */
  applyFontSize(fontSize) {
    document.documentElement.setAttribute('data-font-size', fontSize);
  }

  /**
   * Apply compact mode
   * @param {boolean} compact - Compact mode enabled
   */
  applyCompactMode(compact) {
    if (compact) {
      document.body.classList.add('compact-mode');
    } else {
      document.body.classList.remove('compact-mode');
    }
  }

  /**
   * Apply sidebar visibility
   * @param {boolean} show - Show sidebar
   */
  applySidebarVisibility(show) {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
      sidebar.style.display = show ? '' : 'none';
    }
  }

  /**
   * Apply animations
   * @param {boolean} enabled - Animations enabled
   */
  applyAnimations(enabled) {
    if (enabled) {
      document.documentElement.style.setProperty('--transition-fast', '150ms ease');
      document.documentElement.style.setProperty('--transition-base', '200ms ease');
      document.documentElement.style.setProperty('--transition-slow', '300ms ease');
    } else {
      document.documentElement.style.setProperty('--transition-fast', '0ms');
      document.documentElement.style.setProperty('--transition-base', '0ms');
      document.documentElement.style.setProperty('--transition-slow', '0ms');
    }
  }

  /**
   * Apply color scheme
   * @param {string} scheme - Color scheme name
   */
  applyColorScheme(scheme) {
    document.documentElement.setAttribute('data-color-scheme', scheme);
  }

  /**
   * Get user ID
   * @returns {string} User ID
   */
  getUserId() {
    try {
      const user = firebase.auth().currentUser;
      return user ? user.uid : 'anonymous';
    } catch (error) {
      return 'anonymous';
    }
  }

  /**
   * Add event listener
   * @param {Function} callback - Callback function
   */
  addListener(callback) {
    this.listeners.push(callback);
  }

  /**
   * Remove event listener
   * @param {Function} callback - Callback function
   */
  removeListener(callback) {
    const index = this.listeners.indexOf(callback);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  /**
   * Notify listeners
   * @param {string} event - Event name
   * @param {Object} data - Event data
   */
  notifyListeners(event, data) {
    this.listeners.forEach(callback => {
      try {
        callback(event, data);
      } catch (error) {
        console.error('Error in preference listener:', error);
      }
    });
  }

  /**
   * Export preferences
   * @returns {string} JSON string
   */
  exportPreferences() {
    return JSON.stringify(this.preferences, null, 2);
  }

  /**
   * Import preferences
   * @param {string} json - JSON string
   */
  importPreferences(json) {
    try {
      const imported = JSON.parse(json);
      this.setMultiple(imported);
      return true;
    } catch (error) {
      console.error('Failed to import preferences:', error);
      return false;
    }
  }
}

// Create singleton instance
const userPreferencesService = new UserPreferencesService();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { UserPreferencesService, userPreferencesService };
}

// Make available globally
if (typeof window !== 'undefined') {
  window.UserPreferencesService = UserPreferencesService;
  window.userPreferencesService = userPreferencesService;
}
