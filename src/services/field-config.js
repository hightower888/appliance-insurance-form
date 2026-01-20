/**
 * Field Configuration Service
 * Handles CRUD operations for form field configurations in Firebase Realtime Database
 */

// Firebase database reference (uses existing database from auth-db.js or auth.js)
// Don't redeclare - use the existing database reference from window or global scope
// Use a function to get database instead of declaring a variable

/**
 * Get database reference - ensures database is available
 * @returns {Object} Firebase database reference
 */
function getDatabaseForFields() {
  // Check if database is already available from window (set by auth.js)
  if (typeof window !== 'undefined' && window.database) {
    return window.database;
  }
  // Try to get from firebase if available
  if (typeof firebase !== 'undefined' && firebase.database) {
    try {
      const db = firebase.database();
      if (typeof window !== 'undefined') {
        window.database = db; // Share with other modules
      }
      return db;
    } catch (e) {
      throw new Error('Firebase database not initialized');
    }
  }
  throw new Error('Database not available');
}

/**
 * Get all form fields from database
 * @returns {Promise<Array>} Array of field configurations
 */
async function getAllFields() {
  try {
    const database = getDatabaseForFields();
    const fieldsRef = database.ref('form_fields');
    const snapshot = await fieldsRef.once('value');
    
    if (!snapshot.exists()) {
      return [];
    }
    
    const fields = [];
    snapshot.forEach((childSnapshot) => {
      const fieldData = childSnapshot.val();
      fields.push({
        fieldId: childSnapshot.key,
        ...fieldData
      });
    });
    
    // Sort by order
    fields.sort((a, b) => (a.order || 0) - (b.order || 0));
    
    return fields;
  } catch (error) {
    console.error('Error getting form fields:', error);
    throw error;
  }
}

/**
 * Get a single field by fieldId
 * @param {string} fieldId - Field ID
 * @returns {Promise<Object|null>} Field configuration or null
 */
async function getField(fieldId) {
  try {
    const database = getDatabaseForFields();
    const fieldRef = database.ref(`form_fields/${fieldId}`);
    const snapshot = await fieldRef.once('value');
    
    if (!snapshot.exists()) {
      return null;
    }
    
    return {
      fieldId: fieldId,
      ...snapshot.val()
    };
  } catch (error) {
    console.error('Error getting field:', error);
    throw error;
  }
}

/**
 * Create a new field
 * @param {Object} fieldData - Field configuration
 * @returns {Promise<string>} Field ID
 */
async function createField(fieldData) {
  try {
    const database = getDatabaseForFields();
    
    // Validate required fields
    if (!fieldData.fieldName || !fieldData.fieldType) {
      throw new Error('fieldName and fieldType are required');
    }
    
    // Get current user for audit trail
    const currentUser = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
    const userId = currentUser?.uid || 'system';
    
    const timestamp = new Date().toISOString();
    
    // Prepare field data
    const newField = {
      fieldId: fieldData.fieldId || fieldData.fieldName,
      fieldName: fieldData.fieldName,
      fieldLabel: fieldData.fieldLabel || fieldData.fieldName,
      fieldType: fieldData.fieldType,
      required: fieldData.required || false,
      order: fieldData.order || 999,
      section: fieldData.section || 'General',
      validation: fieldData.validation || {},
      defaultValue: fieldData.defaultValue || '',
      helpText: fieldData.helpText || '',
      conditional: fieldData.conditional || null,
      createdAt: timestamp,
      updatedAt: timestamp,
      createdBy: userId,
      updatedBy: userId
    };
    
    const fieldId = newField.fieldId;
    const fieldRef = database.ref(`form_fields/${fieldId}`);
    await fieldRef.set(newField);
    
    return fieldId;
  } catch (error) {
    console.error('Error creating field:', error);
    throw error;
  }
}

/**
 * Update an existing field
 * @param {string} fieldId - Field ID
 * @param {Object} updates - Field updates
 * @returns {Promise<void>}
 */
async function updateField(fieldId, updates) {
  try {
    const database = getDatabaseForFields();
    
    // Get current user for audit trail
    const currentUser = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
    const userId = currentUser?.uid || 'system';
    
    const updateData = {
      ...updates,
      updatedAt: new Date().toISOString(),
      updatedBy: userId
    };
    
    const fieldRef = database.ref(`form_fields/${fieldId}`);
    await fieldRef.update(updateData);
  } catch (error) {
    console.error('Error updating field:', error);
    throw error;
  }
}

/**
 * Delete a field
 * @param {string} fieldId - Field ID
 * @returns {Promise<void>}
 */
async function deleteField(fieldId) {
  try {
    const database = getDatabaseForFields();
    const fieldRef = database.ref(`form_fields/${fieldId}`);
    await fieldRef.remove();
  } catch (error) {
    console.error('Error deleting field:', error);
    throw error;
  }
}

/**
 * Reorder fields
 * @param {Array<{fieldId: string, order: number}>} fieldOrders - Array of field IDs and new orders
 * @returns {Promise<void>}
 */
async function reorderFields(fieldOrders) {
  try {
    const database = getDatabaseForFields();
    
    const updates = {};
    fieldOrders.forEach(({ fieldId, order }) => {
      updates[`form_fields/${fieldId}/order`] = order;
      updates[`form_fields/${fieldId}/updatedAt`] = new Date().toISOString();
    });
    
    await database.ref().update(updates);
  } catch (error) {
    console.error('Error reordering fields:', error);
    throw error;
  }
}

/**
 * Get fields by section
 * @param {string} section - Section name
 * @returns {Promise<Array>} Array of fields in section
 */
async function getFieldsBySection(section) {
  try {
    const allFields = await getAllFields();
    return allFields.filter(field => field.section === section);
  } catch (error) {
    console.error('Error getting fields by section:', error);
    throw error;
  }
}

/**
 * Get all sections
 * @returns {Promise<Array<string>>} Array of unique section names
 */
async function getAllSections() {
  try {
    const allFields = await getAllFields();
    const sections = [...new Set(allFields.map(field => field.section || 'General'))];
    return sections.sort();
  } catch (error) {
    console.error('Error getting sections:', error);
    throw error;
  }
}

// Export functions
if (typeof window !== 'undefined') {
  window.fieldConfig = {
    getAllFields,
    getField,
    createField,
    updateField,
    deleteField,
    reorderFields,
    getFieldsBySection,
    getAllSections
  };
}
