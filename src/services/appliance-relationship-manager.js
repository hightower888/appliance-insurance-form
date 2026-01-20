/**
 * Appliance Relationship Manager
 * 
 * Handles one-to-many relationship between sales and appliances
 * Implements normalized structure: separate appliances collection with saleId foreign key
 */

class ApplianceRelationshipManager {
  constructor(database) {
    this.db = database;
  }

  /**
   * Generate unique ID for appliances
   */
  generateId() {
    return 'appliance_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Add appliances to a sale (one-to-many relationship)
   * @param {string} saleId - The sale ID
   * @param {Array} appliances - Array of appliance objects
   * @returns {Promise<Array>} Array of appliance IDs created
   */
  async addAppliancesToSale(saleId, appliances) {
    if (!saleId || !appliances || appliances.length === 0) {
      return [];
    }

    const applianceIds = [];
    const applianceRef = this.db.ref('appliances');
    const saleRef = this.db.ref(`sales/${saleId}`);

    try {
      // Create each appliance as separate record
      const appliancePromises = appliances.map(async (appliance) => {
        const applianceId = this.generateId();
        applianceIds.push(applianceId);

        const applianceRecord = {
          applianceId,
          saleId,
          type: appliance.type || '',
          make: appliance.make || '',
          model: appliance.model || '',
          age: appliance.age || '',
          monthlyCost: appliance.monthlyCost || 5.99,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        // Create appliance record in separate collection
        await applianceRef.child(applianceId).set(applianceRecord);
        return applianceId;
      });

      await Promise.all(appliancePromises);

      // Update sale record with appliance IDs array (for quick reference)
      const saleSnapshot = await saleRef.once('value');
      const saleData = saleSnapshot.val() || {};
      
      // Initialize applianceIds array if it doesn't exist
      if (!saleData.applianceIds) {
        saleData.applianceIds = [];
      }

      // Add new appliance IDs to the array
      saleData.applianceIds = [...(saleData.applianceIds || []), ...applianceIds];
      saleData.updatedAt = new Date().toISOString();

      // Update sale with appliance IDs
      await saleRef.update({
        applianceIds: saleData.applianceIds,
        updatedAt: saleData.updatedAt
      });

      return applianceIds;

    } catch (error) {
      console.error('Error adding appliances to sale:', error);
      // Attempt cleanup on failure
      try {
        const cleanupPromises = applianceIds.map(id => 
          applianceRef.child(id).remove()
        );
        await Promise.all(cleanupPromises);
      } catch (cleanupError) {
        console.error('Cleanup failed:', cleanupError);
      }
      throw error;
    }
  }

  /**
   * Get all appliances for a sale
   * @param {string} saleId - The sale ID
   * @returns {Promise<Array>} Array of appliance objects
   */
  async getAppliancesForSale(saleId) {
    if (!saleId) {
      return [];
    }

    try {
      // Query appliances by saleId
      const appliancesRef = this.db.ref('appliances');
      const snapshot = await appliancesRef.orderByChild('saleId').equalTo(saleId).once('value');

      if (!snapshot.exists()) {
        return [];
      }

      const appliances = [];
      snapshot.forEach((childSnapshot) => {
        appliances.push(childSnapshot.val());
      });

      // Sort by creation date
      appliances.sort((a, b) => {
        const dateA = new Date(a.createdAt || 0);
        const dateB = new Date(b.createdAt || 0);
        return dateA - dateB;
      });

      return appliances;

    } catch (error) {
      console.error('Error getting appliances for sale:', error);
      return [];
    }
  }

  /**
   * Remove an appliance from a sale
   * @param {string} applianceId - The appliance ID to remove
   * @returns {Promise<void>}
   */
  async removeAppliance(applianceId) {
    try {
      // Get appliance to find saleId
      const applianceRef = this.db.ref(`appliances/${applianceId}`);
      const snapshot = await applianceRef.once('value');

      if (!snapshot.exists()) {
        throw new Error('Appliance not found');
      }

      const appliance = snapshot.val();
      const saleId = appliance.saleId;

      // Remove appliance record
      await applianceRef.remove();

      // Update sale's applianceIds array
      if (saleId) {
        const saleRef = this.db.ref(`sales/${saleId}`);
        const saleSnapshot = await saleRef.once('value');
        if (saleSnapshot.exists()) {
          const saleData = saleSnapshot.val();
          if (saleData.applianceIds && Array.isArray(saleData.applianceIds)) {
            saleData.applianceIds = saleData.applianceIds.filter(id => id !== applianceId);
            await saleRef.update({
              applianceIds: saleData.applianceIds,
              updatedAt: new Date().toISOString()
            });
          }
        }
      }

    } catch (error) {
      console.error('Error removing appliance:', error);
      throw error;
    }
  }

  /**
   * Update an appliance
   * @param {string} applianceId - The appliance ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<void>}
   */
  async updateAppliance(applianceId, updates) {
    try {
      const applianceRef = this.db.ref(`appliances/${applianceId}`);
      
      // Add updatedAt timestamp
      updates.updatedAt = new Date().toISOString();

      await applianceRef.update(updates);

    } catch (error) {
      console.error('Error updating appliance:', error);
      throw error;
    }
  }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ApplianceRelationshipManager;
}
