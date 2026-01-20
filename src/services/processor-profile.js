/**
 * Processor Profile Service
 * Handles CRUD operations for processor profiles in Firebase
 */

// Note: Firebase should be initialized in the HTML file before this script loads
// This service assumes `database` is available globally

const processorProfile = {
  /**
   * Get processor profile by user ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Processor profile data
   */
  async getProfile(userId) {
    try {
      const profileRef = database.ref(`processor_profiles/${userId}`);
      const snapshot = await profileRef.once('value');
      
      if (snapshot.exists()) {
        return {
          userId: userId,
          ...snapshot.val()
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error getting processor profile:', error);
      throw error;
    }
  },

  /**
   * Create or update processor profile
   * @param {string} userId - User ID
   * @param {Object} profileData - Profile data to save
   * @returns {Promise<void>}
   */
  async saveProfile(userId, profileData) {
    try {
      const profileRef = database.ref(`processor_profiles/${userId}`);
      
      const dataToSave = {
        userId: userId,
        ...profileData,
        updatedAt: new Date().toISOString()
      };

      // Set createdAt if creating new profile
      const existing = await this.getProfile(userId);
      if (!existing) {
        dataToSave.createdAt = new Date().toISOString();
      }

      await profileRef.set(dataToSave);
    } catch (error) {
      console.error('Error saving processor profile:', error);
      throw error;
    }
  },

  /**
   * Update field mappings in processor profile (single profile - for backward compatibility)
   * @param {string} userId - User ID
   * @param {Object} fieldMappings - Field mappings object (fieldName -> csvColumnName)
   * @returns {Promise<void>}
   */
  async updateFieldMappings(userId, fieldMappings) {
    try {
      // Use default profile name for backward compatibility
      return await this.updateMappingProfile(userId, 'default', fieldMappings);
    } catch (error) {
      console.error('Error updating field mappings:', error);
      throw error;
    }
  },

  /**
   * Get field mappings for a processor (single profile - for backward compatibility)
   * @param {string} userId - User ID
   * @param {string} profileName - Optional profile name (defaults to 'default')
   * @returns {Promise<Object>} Field mappings object
   */
  async getFieldMappings(userId, profileName = 'default') {
    try {
      return await this.getMappingProfile(userId, profileName);
    } catch (error) {
      console.error('Error getting field mappings:', error);
      return {};
    }
  },

  /**
   * Get all mapping profiles for a processor
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Object with profile names as keys and mappings as values
   */
  async getAllMappingProfiles(userId) {
    try {
      const profile = await this.getProfile(userId);
      return profile?.mappingProfiles || { default: {} };
    } catch (error) {
      console.error('Error getting all mapping profiles:', error);
      return { default: {} };
    }
  },

  /**
   * Get a specific mapping profile
   * @param {string} userId - User ID
   * @param {string} profileName - Profile name
   * @returns {Promise<Object>} Field mappings object
   */
  async getMappingProfile(userId, profileName) {
    try {
      const profiles = await this.getAllMappingProfiles(userId);
      return profiles[profileName] || {};
    } catch (error) {
      console.error('Error getting mapping profile:', error);
      return {};
    }
  },

  /**
   * Update or create a mapping profile
   * @param {string} userId - User ID
   * @param {string} profileName - Profile name
   * @param {Object} fieldMappings - Field mappings object
   * @returns {Promise<void>}
   */
  async updateMappingProfile(userId, profileName, fieldMappings) {
    try {
      const profileRef = database.ref(`processor_profiles/${userId}`);
      
      // Get existing profile or create new
      const existing = await this.getProfile(userId);
      const profileData = existing || { userId: userId };
      
      // Initialize mappingProfiles if it doesn't exist
      if (!profileData.mappingProfiles) {
        profileData.mappingProfiles = {};
      }
      
      // Update or create the profile
      profileData.mappingProfiles[profileName] = {
        mappings: fieldMappings,
        updatedAt: new Date().toISOString(),
        ...(profileData.mappingProfiles[profileName]?.createdAt ? {} : { createdAt: new Date().toISOString() })
      };
      
      profileData.updatedAt = new Date().toISOString();
      
      if (!existing) {
        profileData.createdAt = new Date().toISOString();
      }

      await profileRef.set(profileData);
    } catch (error) {
      console.error('Error updating mapping profile:', error);
      throw error;
    }
  },

  /**
   * Delete a mapping profile
   * @param {string} userId - User ID
   * @param {string} profileName - Profile name
   * @returns {Promise<void>}
   */
  async deleteMappingProfile(userId, profileName) {
    try {
      if (profileName === 'default') {
        throw new Error('Cannot delete the default profile');
      }
      
      const profileRef = database.ref(`processor_profiles/${userId}/mappingProfiles/${profileName}`);
      await profileRef.remove();
      
      // Update profile timestamp
      const profileDataRef = database.ref(`processor_profiles/${userId}`);
      await profileDataRef.update({ updatedAt: new Date().toISOString() });
    } catch (error) {
      console.error('Error deleting mapping profile:', error);
      throw error;
    }
  },

  /**
   * Set default mapping profile
   * @param {string} userId - User ID
   * @param {string} profileName - Profile name to set as default
   * @returns {Promise<void>}
   */
  async setDefaultMappingProfile(userId, profileName) {
    try {
      const profileRef = database.ref(`processor_profiles/${userId}`);
      await profileRef.update({
        defaultMappingProfile: profileName,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error setting default mapping profile:', error);
      throw error;
    }
  },

  /**
   * Get default mapping profile name
   * @param {string} userId - User ID
   * @returns {Promise<string>} Default profile name
   */
  async getDefaultMappingProfile(userId) {
    try {
      const profile = await this.getProfile(userId);
      return profile?.defaultMappingProfile || 'default';
    } catch (error) {
      console.error('Error getting default mapping profile:', error);
      return 'default';
    }
  },

  /**
   * Log processor activity
   * @param {string} userId - User ID
   * @param {string} action - Action name (e.g., 'csv_export', 'mapping_updated')
   * @param {Object} data - Additional data about the action
   * @returns {Promise<void>}
   */
  async logActivity(userId, action, data = {}) {
    try {
      const activityRef = database.ref(`processor_profiles/${userId}/activity`);
      await activityRef.push({
        action: action,
        data: data,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error logging processor activity:', error);
      // Don't throw - activity logging is not critical
    }
  },

  /**
   * Get all processor profiles (admin only)
   * @returns {Promise<Array>} Array of processor profiles
   */
  async getAllProfiles() {
    try {
      const profilesRef = database.ref('processor_profiles');
      const snapshot = await profilesRef.once('value');
      
      const profiles = [];
      if (snapshot.exists()) {
        snapshot.forEach((childSnapshot) => {
          profiles.push({
            userId: childSnapshot.key,
            ...childSnapshot.val()
          });
        });
      }
      
      return profiles;
    } catch (error) {
      console.error('Error getting all processor profiles:', error);
      throw error;
    }
  },

  /**
   * Update export preferences
   * @param {string} userId - User ID
   * @param {Object} preferences - Export preferences (e.g., { includeHeaders: true, dateFormat: 'DD/MM/YYYY' })
   * @returns {Promise<void>}
   */
  async updateExportPreferences(userId, preferences) {
    try {
      const profileRef = database.ref(`processor_profiles/${userId}/exportPreferences`);
      await profileRef.set(preferences);
    } catch (error) {
      console.error('Error updating export preferences:', error);
      throw error;
    }
  },

  /**
   * Get export preferences
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Export preferences
   */
  async getExportPreferences(userId) {
    try {
      const profile = await this.getProfile(userId);
      return profile?.exportPreferences || {
        includeHeaders: true,
        dateFormat: 'DD/MM/YYYY',
        delimiter: ','
      };
    } catch (error) {
      console.error('Error getting export preferences:', error);
      return {
        includeHeaders: true,
        dateFormat: 'DD/MM/YYYY',
        delimiter: ','
      };
    }
  }
};

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = processorProfile;
}
