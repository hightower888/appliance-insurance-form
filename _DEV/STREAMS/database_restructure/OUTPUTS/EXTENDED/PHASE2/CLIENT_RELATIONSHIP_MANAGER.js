/**
 * Database Relationship Manager
 *
 * Handles complex one-to-many relationships between sales, appliances, boilers, and dynamic fields
 * Provides client-side relationship resolution, caching, and transaction management
 * Works around Firebase Realtime Database limitations (no joins, no transactions)
 */

class DatabaseRelationshipManager {
  constructor() {
    this.db = firebase.database();
    this.cache = new Map();
    this.listeners = new Map();
    this.pendingTransactions = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  // ============================================================================
  // APPLIANCE RELATIONSHIP MANAGEMENT
  // ============================================================================

  /**
   * Add appliance to sale with relationship management
   * @param {string} saleId - Sale ID
   * @param {Object} applianceData - Appliance specification
   * @returns {Promise<string>} Appliance ID
   */
  async addApplianceToSale(saleId, applianceData) {
    const applianceId = this.generateId();

    try {
      // Validate sale exists and user has access
      await this.validateSaleAccess(saleId);

      // Create appliance record
      const applianceRecord = {
        applianceId,
        saleId,
        type: applianceData.type,
        make: applianceData.make,
        model: applianceData.model,
        age: applianceData.age || 'Unknown',
        monthlyCost: applianceData.monthlyCost || 0,
        serialNumber: applianceData.serialNumber || null,
        warrantyExpiry: applianceData.warrantyExpiry || null,
        purchaseDate: applianceData.purchaseDate || null,
        installationDate: applianceData.installationDate || null,
        capacity: applianceData.capacity || null,
        energyRating: applianceData.energyRating || null,
        powerConsumption: applianceData.powerConsumption || null,
        status: 'active',
        version: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Create appliance record
      await this.db.ref(`appliances/${applianceId}`).set(applianceRecord);

      // Update sale's relationship array
      await this.addToRelationshipArray(`sales/${saleId}/applianceIds`, applianceId);

      // Update cache
      this.invalidateCache(saleId);

      // Log the operation
      await this.logOperation('appliance_added', {
        saleId,
        applianceId,
        type: applianceData.type,
        make: applianceData.make
      });

      return applianceId;

    } catch (error) {
      // Attempt cleanup on failure
      try {
        await this.db.ref(`appliances/${applianceId}`).remove();
      } catch (cleanupError) {
        console.error('Cleanup failed:', cleanupError);
      }
      throw error;
    }
  }

  /**
   * Remove appliance from sale
   * @param {string} applianceId - Appliance ID to remove
   * @returns {Promise<void>}
   */
  async removeAppliance(applianceId) {
    try {
      // Get appliance data to find saleId
      const applianceSnapshot = await this.db.ref(`appliances/${applianceId}`).once('value');
      if (!applianceSnapshot.exists()) {
        throw new Error('Appliance not found');
      }

      const appliance = applianceSnapshot.val();
      const saleId = appliance.saleId;

      // Validate access
      await this.validateSaleAccess(saleId);

      // Remove from sale's relationship array
      await this.removeFromRelationshipArray(`sales/${saleId}/applianceIds`, applianceId);

      // Remove appliance record
      await this.db.ref(`appliances/${applianceId}`).remove();

      // Update cache
      this.invalidateCache(saleId);

      // Log the operation
      await this.logOperation('appliance_removed', {
        saleId,
        applianceId,
        type: appliance.type,
        make: appliance.make
      });

    } catch (error) {
      console.error('Failed to remove appliance:', error);
      throw error;
    }
  }

  /**
   * Update appliance data
   * @param {string} applianceId - Appliance ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<void>}
   */
  async updateAppliance(applianceId, updates) {
    try {
      // Get current appliance data
      const applianceSnapshot = await this.db.ref(`appliances/${applianceId}`).once('value');
      if (!applianceSnapshot.exists()) {
        throw new Error('Appliance not found');
      }

      const appliance = applianceSnapshot.val();
      const saleId = appliance.saleId;

      // Validate access
      await this.validateSaleAccess(saleId);

      // Prepare update data
      const updateData = {
        ...updates,
        updatedAt: new Date().toISOString(),
        version: (appliance.version || 1) + 1
      };

      // Update appliance record
      await this.db.ref(`appliances/${applianceId}`).update(updateData);

      // Update cache
      this.invalidateCache(saleId);

      // Log the operation
      await this.logOperation('appliance_updated', {
        saleId,
        applianceId,
        updates: Object.keys(updates)
      });

    } catch (error) {
      console.error('Failed to update appliance:', error);
      throw error;
    }
  }

  // ============================================================================
  // BOILER RELATIONSHIP MANAGEMENT
  // ============================================================================

  /**
   * Add boiler to sale
   * @param {string} saleId - Sale ID
   * @param {Object} boilerData - Boiler specification
   * @returns {Promise<string>} Boiler ID
   */
  async addBoilerToSale(saleId, boilerData) {
    const boilerId = this.generateId();

    try {
      // Validate sale access
      await this.validateSaleAccess(saleId);

      // Create boiler record
      const boilerRecord = {
        boilerId,
        saleId,
        type: boilerData.type,
        make: boilerData.make,
        model: boilerData.model,
        age: boilerData.age || 'Unknown',
        monthlyCost: boilerData.monthlyCost || 0,
        fuelType: boilerData.fuelType,
        efficiencyRating: boilerData.efficiencyRating || null,
        outputKw: boilerData.outputKw || null,
        serialNumber: boilerData.serialNumber || null,
        installationDate: boilerData.installationDate || null,
        lastServiceDate: boilerData.lastServiceDate || null,
        warrantyExpiry: boilerData.warrantyExpiry || null,
        flowRate: boilerData.flowRate || null,
        pressureRange: boilerData.pressureRange || null,
        flueType: boilerData.flueType || null,
        status: 'active',
        version: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Create boiler record
      await this.db.ref(`boilers/${boilerId}`).set(boilerRecord);

      // Update sale's relationship array
      await this.addToRelationshipArray(`sales/${saleId}/boilerIds`, boilerId);

      // Update cache
      this.invalidateCache(saleId);

      // Log the operation
      await this.logOperation('boiler_added', {
        saleId,
        boilerId,
        type: boilerData.type,
        make: boilerData.make
      });

      return boilerId;

    } catch (error) {
      // Attempt cleanup
      try {
        await this.db.ref(`boilers/${boilerId}`).remove();
      } catch (cleanupError) {
        console.error('Cleanup failed:', cleanupError);
      }
      throw error;
    }
  }

  /**
   * Remove boiler from sale
   * @param {string} boilerId - Boiler ID to remove
   * @returns {Promise<void>}
   */
  async removeBoiler(boilerId) {
    try {
      // Get boiler data to find saleId
      const boilerSnapshot = await this.db.ref(`boilers/${boilerId}`).once('value');
      if (!boilerSnapshot.exists()) {
        throw new Error('Boiler not found');
      }

      const boiler = boilerSnapshot.val();
      const saleId = boiler.saleId;

      // Validate access
      await this.validateSaleAccess(saleId);

      // Remove from sale's relationship array
      await this.removeFromRelationshipArray(`sales/${saleId}/boilerIds`, boilerId);

      // Remove boiler record
      await this.db.ref(`boilers/${boilerId}`).remove();

      // Update cache
      this.invalidateCache(saleId);

      // Log the operation
      await this.logOperation('boiler_removed', {
        saleId,
        boilerId,
        type: boiler.type,
        make: boiler.make
      });

    } catch (error) {
      console.error('Failed to remove boiler:', error);
      throw error;
    }
  }

  // ============================================================================
  // DYNAMIC FIELD VALUE MANAGEMENT
  // ============================================================================

  /**
   * Add dynamic field value to sale
   * @param {string} saleId - Sale ID
   * @param {string} fieldId - Form field ID
   * @param {any} value - Field value
   * @param {Object} metadata - Additional metadata
   * @returns {Promise<string>} Field value ID
   */
  async addDynamicFieldValue(saleId, fieldId, value, metadata = {}) {
    const fieldValueId = this.generateId();

    try {
      // Validate sale access
      await this.validateSaleAccess(saleId);

      // Get field definition for validation
      const fieldDefinition = await this.getFieldDefinition(fieldId);
      if (!fieldDefinition) {
        throw new Error('Field definition not found');
      }

      // Validate value against field definition
      await this.validateFieldValue(value, fieldDefinition);

      // Create field value record
      const fieldValueRecord = {
        fieldValueId,
        saleId,
        fieldId,
        fieldType: fieldDefinition.fieldType,
        fieldName: fieldDefinition.fieldName,
        required: fieldDefinition.required,
        value: value,
        selectedOption: metadata.selectedOption || null,
        isValid: true,
        validationErrors: [],
        version: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Create field value record
      await this.db.ref(`dynamicFieldValues/${fieldValueId}`).set(fieldValueRecord);

      // Update sale's relationship array
      await this.addToRelationshipArray(`sales/${saleId}/dynamicFieldValueIds`, fieldValueId);

      // Update cache
      this.invalidateCache(saleId);

      // Log the operation
      await this.logOperation('field_value_added', {
        saleId,
        fieldValueId,
        fieldId,
        fieldName: fieldDefinition.fieldName
      });

      return fieldValueId;

    } catch (error) {
      // Attempt cleanup
      try {
        await this.db.ref(`dynamicFieldValues/${fieldValueId}`).remove();
      } catch (cleanupError) {
        console.error('Cleanup failed:', cleanupError);
      }
      throw error;
    }
  }

  // ============================================================================
  // RELATIONSHIP QUERYING & CACHING
  // ============================================================================

  /**
   * Get complete sale with all relationships
   * @param {string} saleId - Sale ID
   * @param {boolean} useCache - Whether to use cache
   * @returns {Promise<Object>} Complete sale object with relationships
   */
  async getSaleWithRelationships(saleId, useCache = true) {
    // Check cache first
    if (useCache && this.cache.has(saleId)) {
      const cached = this.cache.get(saleId);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
    }

    try {
      // Get sale data
      const saleSnapshot = await this.db.ref(`sales/${saleId}`).once('value');
      if (!saleSnapshot.exists()) {
        throw new Error('Sale not found');
      }

      const sale = saleSnapshot.val();

      // Validate access
      await this.validateSaleAccess(saleId, true); // read-only check

      // Get related appliances
      const appliances = await this.getRelatedAppliances(saleId);

      // Get related boilers
      const boilers = await this.getRelatedBoilers(saleId);

      // Get related dynamic field values
      const dynamicFieldValues = await this.getRelatedDynamicFieldValues(saleId);

      // Combine all data
      const completeSale = {
        ...sale,
        appliances,
        boilers,
        dynamicFieldValues,
        _metadata: {
          fetchedAt: new Date().toISOString(),
          relationshipCount: {
            appliances: appliances.length,
            boilers: boilers.length,
            dynamicFields: dynamicFieldValues.length
          }
        }
      };

      // Cache the result
      this.cache.set(saleId, {
        data: completeSale,
        timestamp: Date.now()
      });

      return completeSale;

    } catch (error) {
      console.error('Failed to get sale with relationships:', error);
      throw error;
    }
  }

  /**
   * Get appliances for a sale
   * @param {string} saleId - Sale ID
   * @returns {Promise<Array>} Array of appliance objects
   */
  async getRelatedAppliances(saleId) {
    const saleSnapshot = await this.db.ref(`sales/${saleId}`).once('value');
    if (!saleSnapshot.exists()) return [];

    const sale = saleSnapshot.val();
    const applianceIds = sale.applianceIds || [];

    if (applianceIds.length === 0) return [];

    // Get all appliances for this sale
    const appliances = [];
    for (const applianceId of applianceIds) {
      const applianceSnapshot = await this.db.ref(`appliances/${applianceId}`).once('value');
      if (applianceSnapshot.exists()) {
        appliances.push({
          id: applianceId,
          ...applianceSnapshot.val()
        });
      }
    }

    return appliances;
  }

  /**
   * Get boilers for a sale
   * @param {string} saleId - Sale ID
   * @returns {Promise<Array>} Array of boiler objects
   */
  async getRelatedBoilers(saleId) {
    const saleSnapshot = await this.db.ref(`sales/${saleId}`).once('value');
    if (!saleSnapshot.exists()) return [];

    const sale = saleSnapshot.val();
    const boilerIds = sale.boilerIds || [];

    if (boilerIds.length === 0) return [];

    // Get all boilers for this sale
    const boilers = [];
    for (const boilerId of boilerIds) {
      const boilerSnapshot = await this.db.ref(`boilers/${boilerId}`).once('value');
      if (boilerSnapshot.exists()) {
        boilers.push({
          id: boilerId,
          ...boilerSnapshot.val()
        });
      }
    }

    return boilers;
  }

  /**
   * Get dynamic field values for a sale
   * @param {string} saleId - Sale ID
   * @returns {Promise<Array>} Array of field value objects
   */
  async getRelatedDynamicFieldValues(saleId) {
    const saleSnapshot = await this.db.ref(`sales/${saleId}`).once('value');
    if (!saleSnapshot.exists()) return [];

    const sale = saleSnapshot.val();
    const fieldValueIds = sale.dynamicFieldValueIds || [];

    if (fieldValueIds.length === 0) return [];

    // Get all field values for this sale
    const fieldValues = [];
    for (const fieldValueId of fieldValueIds) {
      const fieldValueSnapshot = await this.db.ref(`dynamicFieldValues/${fieldValueId}`).once('value');
      if (fieldValueSnapshot.exists()) {
        fieldValues.push({
          id: fieldValueId,
          ...fieldValueSnapshot.val()
        });
      }
    }

    return fieldValues;
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Generate unique ID
   * @returns {string} UUID
   */
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * Validate user has access to sale
   * @param {string} saleId - Sale ID
   * @param {boolean} readOnly - Whether this is a read operation
   * @returns {Promise<void>}
   */
  async validateSaleAccess(saleId, readOnly = false) {
    const currentUser = firebase.auth().currentUser;
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    // Get user role
    const userRole = await this.getUserRole(currentUser.uid);

    if (userRole === 'admin') {
      return; // Admins have full access
    }

    // Get sale data
    const saleSnapshot = await this.db.ref(`sales/${saleId}`).once('value');
    if (!saleSnapshot.exists()) {
      throw new Error('Sale not found');
    }

    const sale = saleSnapshot.val();

    // Check ownership
    if (sale.agentId !== currentUser.uid) {
      throw new Error('Access denied: not the sale owner');
    }

    // For write operations, only allow agents to modify their own sales
    if (!readOnly && userRole !== 'agent') {
      throw new Error('Access denied: insufficient permissions');
    }
  }

  /**
   * Get user role
   * @param {string} userId - User ID
   * @returns {Promise<string>} User role
   */
  async getUserRole(userId) {
    const roleSnapshot = await this.db.ref(`users/${userId}/role`).once('value');
    return roleSnapshot.val() || 'user';
  }

  /**
   * Add item to relationship array
   * @param {string} arrayPath - Firebase path to array
   * @param {string} itemId - Item to add
   * @returns {Promise<void>}
   */
  async addToRelationshipArray(arrayPath, itemId) {
    const arraySnapshot = await this.db.ref(arrayPath).once('value');
    const currentArray = arraySnapshot.val() || [];
    const newArray = [...currentArray, itemId];
    await this.db.ref(arrayPath).set(newArray);
  }

  /**
   * Remove item from relationship array
   * @param {string} arrayPath - Firebase path to array
   * @param {string} itemId - Item to remove
   * @returns {Promise<void>}
   */
  async removeFromRelationshipArray(arrayPath, itemId) {
    const arraySnapshot = await this.db.ref(arrayPath).once('value');
    const currentArray = arraySnapshot.val() || [];
    const newArray = currentArray.filter(id => id !== itemId);
    await this.db.ref(arrayPath).set(newArray);
  }

  /**
   * Get field definition
   * @param {string} fieldId - Field ID
   * @returns {Promise<Object|null>} Field definition or null
   */
  async getFieldDefinition(fieldId) {
    const fieldSnapshot = await this.db.ref(`form_fields/${fieldId}`).once('value');
    return fieldSnapshot.exists() ? fieldSnapshot.val() : null;
  }

  /**
   * Validate field value against definition
   * @param {any} value - Value to validate
   * @param {Object} fieldDefinition - Field definition
   * @returns {Promise<void>}
   */
  async validateFieldValue(value, fieldDefinition) {
    // Basic validation based on field type
    switch (fieldDefinition.fieldType) {
      case 'text':
        if (typeof value !== 'string') {
          throw new Error('Text field must be a string');
        }
        if (fieldDefinition.required && !value.trim()) {
          throw new Error('Required text field cannot be empty');
        }
        break;

      case 'number':
        if (typeof value !== 'number' && isNaN(Number(value))) {
          throw new Error('Number field must be a valid number');
        }
        const numValue = Number(value);
        if (fieldDefinition.validationRules?.min !== undefined && numValue < fieldDefinition.validationRules.min) {
          throw new Error(`Value must be at least ${fieldDefinition.validationRules.min}`);
        }
        if (fieldDefinition.validationRules?.max !== undefined && numValue > fieldDefinition.validationRules.max) {
          throw new Error(`Value must be at most ${fieldDefinition.validationRules.max}`);
        }
        break;

      case 'select':
        if (!fieldDefinition.options?.includes(value)) {
          throw new Error('Selected value must be in the allowed options');
        }
        break;

      // Add more validation types as needed
    }
  }

  /**
   * Invalidate cache for sale
   * @param {string} saleId - Sale ID
   */
  invalidateCache(saleId) {
    this.cache.delete(saleId);
  }

  /**
   * Log operation for audit trail
   * @param {string} operation - Operation type
   * @param {Object} details - Operation details
   * @returns {Promise<void>}
   */
  async logOperation(operation, details) {
    try {
      const logEntry = {
        operation,
        details,
        userId: firebase.auth().currentUser?.uid,
        timestamp: new Date().toISOString()
      };

      // This would log to a security_logs table if implemented
      console.log('Operation logged:', logEntry);
    } catch (error) {
      console.warn('Failed to log operation:', error);
    }
  }

  // ============================================================================
  // ANALYTICS & AGGREGATION METHODS
  // ============================================================================

  /**
   * Get appliance statistics across all sales
   * @param {Object} filters - Optional filters
   * @returns {Promise<Object>} Statistics object
   */
  async getApplianceStatistics(filters = {}) {
    const cacheKey = `appliance_stats_${JSON.stringify(filters)}`;

    // Check cache
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
    }

    try {
      // Get all appliances (with optional filtering)
      let appliancesQuery = this.db.ref('appliances');

      // Apply filters
      if (filters.type) {
        appliancesQuery = appliancesQuery.orderByChild('type').equalTo(filters.type);
      }

      const appliancesSnapshot = await appliancesQuery.once('value');
      const appliances = [];

      appliancesSnapshot.forEach(child => {
        const appliance = child.val();
        if (this.matchesFilters(appliance, filters)) {
          appliances.push(appliance);
        }
      });

      // Calculate statistics
      const stats = {
        totalCount: appliances.length,
        totalValue: appliances.reduce((sum, a) => sum + (a.monthlyCost || 0), 0),
        byType: {},
        byMake: {},
        byAge: {},
        averageCost: 0
      };

      // Group by categories
      appliances.forEach(appliance => {
        stats.byType[appliance.type] = (stats.byType[appliance.type] || 0) + 1;
        stats.byMake[appliance.make] = (stats.byMake[appliance.make] || 0) + 1;
        stats.byAge[appliance.age] = (stats.byAge[appliance.age] || 0) + 1;
      });

      stats.averageCost = stats.totalCount > 0 ? stats.totalValue / stats.totalCount : 0;

      // Cache result
      this.cache.set(cacheKey, {
        data: stats,
        timestamp: Date.now()
      });

      return stats;

    } catch (error) {
      console.error('Failed to get appliance statistics:', error);
      throw error;
    }
  }

  /**
   * Check if appliance matches filters
   * @param {Object} appliance - Appliance object
   * @param {Object} filters - Filter criteria
   * @returns {boolean} Whether appliance matches
   */
  matchesFilters(appliance, filters) {
    return Object.entries(filters).every(([key, value]) => {
      if (key === 'type') return true; // Already filtered by Firebase
      return appliance[key] === value;
    });
  }
}

// Export for use in the application
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DatabaseRelationshipManager;
}