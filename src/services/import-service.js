/**
 * Import Service
 * Comprehensive sales import with CSV/JSON/Firebase format support
 */

class ImportService {
  constructor() {
    this.database = null;
    this.errors = [];
    this.warnings = [];
  }

  /**
   * Initialize service with database reference
   * @param {Object} database - Firebase database reference
   */
  initialize(database) {
    this.database = database;
    console.log('Import Service initialized');
  }

  /**
   * Parse CSV file with proper escaping handling
   * @param {string} text - CSV text content
   * @returns {Array} Array of parsed objects
   */
  parseCSV(text) {
    const lines = [];
    let currentLine = '';
    let inQuotes = false;
    
    // Properly handle CSV with quoted fields
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];
      
      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          // Escaped quote
          currentLine += '"';
          i++; // Skip next quote
        } else {
          // Toggle quote state
          inQuotes = !inQuotes;
        }
      } else if (char === '\n' && !inQuotes) {
        // End of line
        lines.push(currentLine);
        currentLine = '';
      } else {
        currentLine += char;
      }
    }
    
    // Add last line
    if (currentLine) {
      lines.push(currentLine);
    }
    
    if (lines.length < 2) {
      throw new Error('CSV file must have at least a header row and one data row');
    }
    
    // Parse headers
    const headers = this.parseCSVLine(lines[0]);
    const data = [];
    
    // Parse data rows
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const values = this.parseCSVLine(line);
      const obj = {};
      
      headers.forEach((header, index) => {
        obj[header] = values[index] || '';
      });
      
      data.push(obj);
    }
    
    return data;
  }

  /**
   * Parse a single CSV line with proper quote handling
   * @param {string} line - CSV line
   * @returns {Array} Array of field values
   */
  parseCSVLine(line) {
    const fields = [];
    let currentField = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];
      
      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          // Escaped quote
          currentField += '"';
          i++; // Skip next quote
        } else {
          // Toggle quote state
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        // Field separator
        fields.push(currentField.trim());
        currentField = '';
      } else {
        currentField += char;
      }
    }
    
    // Add last field
    fields.push(currentField.trim());
    
    return fields;
  }

  /**
   * Parse JSON file
   * @param {string} text - JSON text content
   * @returns {Array} Array of parsed objects
   */
  parseJSON(text) {
    try {
      const data = JSON.parse(text);
      
      // Handle both array and single object
      if (Array.isArray(data)) {
        return data;
      } else if (typeof data === 'object') {
        return [data];
      } else {
        throw new Error('JSON must be an object or array of objects');
      }
    } catch (error) {
      throw new Error(`Invalid JSON format: ${error.message}`);
    }
  }

  /**
   * Parse Firebase export format
   * @param {string} text - Firebase export JSON text
   * @returns {Array} Array of parsed objects
   */
  parseFirebaseExport(text) {
    try {
      const data = JSON.parse(text);
      const records = [];
      
      // Firebase export format: { "sales": { "saleId1": {...}, "saleId2": {...} } }
      if (data.sales && typeof data.sales === 'object') {
        Object.keys(data.sales).forEach(saleId => {
          const saleData = data.sales[saleId];
          records.push({
            id: saleId,
            ...saleData
          });
        });
      } else if (Array.isArray(data)) {
        // Array format
        return data;
      } else if (typeof data === 'object') {
        // Single object or flat structure
        return [data];
      }
      
      return records;
    } catch (error) {
      throw new Error(`Invalid Firebase export format: ${error.message}`);
    }
  }

  /**
   * Parse appliances from various formats
   * @param {Object} data - Data object
   * @returns {Array} Array of appliance objects
   */
  parseAppliances(data) {
    const appliances = [];
    
    // Format 1: appliances array
    if (Array.isArray(data.appliances)) {
      return data.appliances;
    }
    
    // Format 2: appliances object
    if (data.appliances && typeof data.appliances === 'object') {
      return [data.appliances];
    }
    
    // Format 3: appliance1, appliance2, ... appliance10 columns
    for (let i = 1; i <= 10; i++) {
      const type = data[`appliance${i}`] || data[`appliance${i}Type`] || data[`appliance${i}_type`];
      const make = data[`appliance${i}Make`] || data[`appliance${i}_make`] || data[`appliance${i}Brand`];
      const model = data[`appliance${i}Model`] || data[`appliance${i}_model`];
      const cost = data[`appliance${i}Cost`] || data[`appliance${i}_cost`] || data[`appliance${i}Price`];
      const coverLimit = data[`appliance${i}CoverLimit`] || data[`appliance${i}_cover_limit`] || data[`appliance${i}Limit`];
      
      if (type) {
        appliances.push({
          type: type,
          make: make || '',
          model: model || '',
          cost: parseFloat(cost) || 0,
          coverLimit: parseFloat(coverLimit) || 0,
          age: data[`appliance${i}Age`] || data[`appliance${i}_age`] || ''
        });
      }
    }
    
    // Format 4: Single appliance fields
    if (data.applianceType || data.appliance || data.type) {
      appliances.push({
        type: data.applianceType || data.appliance || data.type || '',
        make: data.applianceMake || data.make || data.brand || '',
        model: data.applianceModel || data.model || '',
        cost: parseFloat(data.applianceCost || data.cost || data.price || 0),
        coverLimit: parseFloat(data.applianceCoverLimit || data.coverLimit || data.limit || 0),
        age: data.applianceAge || data.age || ''
      });
    }
    
    return appliances;
  }

  /**
   * Validate data record
   * @param {Object} data - Data record to validate
   * @param {number} index - Record index (for error reporting)
   * @returns {Object} Validation result { valid: boolean, errors: Array }
   */
  validateData(data, index) {
    const errors = [];
    
    // Required fields check
    const name = data.name || data.contactName || data['Name'] || data.contact?.name || '';
    const phone = data.phone || data.contactPhone || data['Phone Numbers'] || data.contact?.phone || '';
    
    if (!name || name.trim().length < 2) {
      errors.push(`Row ${index + 1}: Name is required and must be at least 2 characters`);
    }
    
    if (!phone || phone.trim().length < 10) {
      errors.push(`Row ${index + 1}: Phone number is required and must be at least 10 characters`);
    }
    
    // Optional but validate format if present
    const email = data.email || data.contactEmail || data['Email'] || data.contact?.email || '';
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push(`Row ${index + 1}: Invalid email format`);
    }
    
    // Validate sort code if present
    const sortCode = data.sortCode || data['Sort Code'] || data.payment?.sortCode || '';
    if (sortCode && !/^\d{6}$/.test(sortCode.replace(/\D/g, ''))) {
      errors.push(`Row ${index + 1}: Sort code must be 6 digits`);
    }
    
    // Validate account number if present
    const accountNumber = data.accountNumber || data['Account number'] || data.payment?.accountNumber || '';
    if (accountNumber && !/^\d{8}$/.test(accountNumber.replace(/\D/g, ''))) {
      errors.push(`Row ${index + 1}: Account number must be 8 digits`);
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Transform data to sales schema
   * @param {Object} data - Raw data object
   * @param {Object} user - Current user
   * @returns {Object} Transformed sales data
   */
  transformToSalesSchema(data, user) {
    const timestamp = Date.now();
    const now = new Date().toISOString();
    
    // Parse appliances
    const appliances = this.parseAppliances(data);
    
    // Detect coverage type
    let planType = 'Appliance';
    if (data.planType || data.plan || data['Plan']) {
      planType = data.planType || data.plan || data['Plan'];
    } else if (data.boilerCover || data.boilerCost || data.hasBoiler) {
      planType = 'Appliance + Boiler';
    }
    
    // Calculate total cost if not provided
    let totalCost = parseFloat(data.totalCost || data['Total Cost'] || 0);
    if (!totalCost && appliances.length > 0) {
      totalCost = appliances.reduce((sum, app) => sum + (parseFloat(app.cost) || 0), 0);
      if (data.boilerCost) {
        totalCost += parseFloat(data.boilerCost);
      }
    }
    
    return {
      contact: {
        name: data.name || data.contactName || data['Name'] || data.contact?.name || '',
        phone: data.phone || data.contactPhone || data['Phone Numbers'] || data.contact?.phone || '',
        email: data.email || data.contactEmail || data['Email'] || data.contact?.email || '',
        address: data.address || data.contactAddress || data['Adress'] || data['Address'] || data.contact?.address || '',
        city: data.city || data.contactCity || data.contact?.city || '',
        county: data.county || data.contactCounty || data.contact?.county || '',
        postcode: data.postcode || data.contactPostcode || data['Postcode'] || data.contact?.postcode || ''
      },
      appliances: appliances,
      plan: {
        number: data.planNumber || data['Plan number'] || data.plan?.number || '',
        type: planType,
        totalCost: totalCost
      },
      payment: {
        sortCode: (data.sortCode || data['Sort Code'] || data.payment?.sortCode || '').replace(/\D/g, ''),
        accountNumber: (data.accountNumber || data['Account number'] || data.payment?.accountNumber || '').replace(/\D/g, ''),
        accountName: data.accountName || data.payment?.accountName || '',
        ddDate: data.ddDate || data['DD Date'] || data.payment?.ddDate || ''
      },
      notes: data.notes || data['Notes - e.g. whats covered'] || data['Notes'] || '',
      agentId: data.agentId || user?.uid || '',
      agentEmail: data.agentEmail || user?.email || user?.username || '',
      timestamp: data.timestamp || timestamp,
      submittedAt: data.submittedAt || data.createdAt || now,
      createdAt: data.createdAt || now,
      updatedAt: now,
      leadStatus: data.leadStatus || 'new',
      leadSource: data.leadSource || 'import',
      disposition: data.disposition || null,
      dispositionDate: data.dispositionDate || null,
      dispositionBy: data.dispositionBy || null
    };
  }

  /**
   * Process import data
   * @param {Array} data - Array of data records
   * @param {Object} options - Import options
   * @returns {Object} Processing result
   */
  processImport(data, options = {}) {
    this.errors = [];
    this.warnings = [];
    
    const processed = [];
    const failed = [];
    
    data.forEach((item, index) => {
      // Validate
      const validation = this.validateData(item, index);
      
      if (!validation.valid) {
        this.errors.push(...validation.errors);
        failed.push({ index, data: item, errors: validation.errors });
        return;
      }
      
      // Transform
      try {
        const transformed = this.transformToSalesSchema(item, options.user || {});
        processed.push(transformed);
      } catch (error) {
        this.errors.push(`Row ${index + 1}: Transformation error - ${error.message}`);
        failed.push({ index, data: item, error: error.message });
      }
    });
    
    return {
      processed,
      failed,
      total: data.length,
      successCount: processed.length,
      errorCount: failed.length
    };
  }

  /**
   * Import records to database
   * @param {Array} records - Array of processed records
   * @param {Function} onProgress - Progress callback (current, total, record)
   * @returns {Promise<Object>} Import result
   */
  async importToDatabase(records, onProgress = null) {
    if (!this.database) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    
    const results = {
      success: [],
      failed: [],
      total: records.length
    };
    
    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      
      try {
        // Create sale record
        const salesRef = this.database.ref('sales');
        const newRef = salesRef.push();
        const saleId = newRef.key;
        
        const appliances = record.appliances || [];
        delete record.appliances; // Remove from sale data
        
        await newRef.set(record);
        
        // Add appliances using relationship manager if available
        if (appliances.length > 0 && typeof ApplianceRelationshipManager !== 'undefined') {
          try {
            const relationshipManager = new ApplianceRelationshipManager(this.database);
            await relationshipManager.addAppliancesToSale(saleId, appliances);
          } catch (applianceError) {
            console.warn('Error adding appliances, adding to saleData directly:', applianceError);
            // Fallback: add appliances array directly
            await newRef.update({ appliances: appliances });
          }
        } else if (appliances.length > 0) {
          // Fallback: add appliances array directly
          await newRef.update({ appliances: appliances });
        }
        
        results.success.push({ saleId, record });
      } catch (error) {
        console.error(`Error importing record ${i + 1}:`, error);
        results.failed.push({ index: i, record, error: error.message });
      }
      
      // Report progress
      if (onProgress) {
        onProgress(i + 1, records.length, record);
      }
    }
    
    return results;
  }

  /**
   * Generate error report
   * @param {Array} errors - Array of error objects
   * @returns {string} Error report text
   */
  generateErrorReport(errors) {
    if (errors.length === 0) {
      return 'No errors';
    }
    
    let report = `Import Errors (${errors.length}):\n\n`;
    errors.forEach((error, index) => {
      if (typeof error === 'string') {
        report += `${index + 1}. ${error}\n`;
      } else if (error.errors && Array.isArray(error.errors)) {
        report += `${index + 1}. Row ${error.index + 1}:\n`;
        error.errors.forEach(err => {
          report += `   - ${err}\n`;
        });
      } else {
        report += `${index + 1}. ${error.error || error.message || 'Unknown error'}\n`;
      }
    });
    
    return report;
  }

  /**
   * Import from file
   * @param {File} file - File to import
   * @param {Object} options - Import options
   * @returns {Promise<Object>} Import result
   */
  async importFromFile(file, options = {}) {
    const fileType = file.name.split('.').pop().toLowerCase();
    let data;
    
    try {
      const text = await file.text();
      
      // Parse based on file type
      if (fileType === 'csv') {
        data = this.parseCSV(text);
      } else if (fileType === 'json') {
        data = this.parseJSON(text);
        
        // Check if it's Firebase export format
        if (data.length === 1 && data[0].sales) {
          data = this.parseFirebaseExport(text);
        }
      } else {
        throw new Error(`Unsupported file type: ${fileType}. Supported types: CSV, JSON`);
      }
      
      // Process import
      const processed = this.processImport(data, options);
      
      // Import to database if requested
      if (options.importToDatabase !== false && this.database) {
        const importResult = await this.importToDatabase(
          processed.processed,
          options.onProgress
        );
        
        return {
          ...processed,
          importResult
        };
      }
      
      return processed;
    } catch (error) {
      throw new Error(`Import failed: ${error.message}`);
    }
  }
}

// Create singleton instance
const importService = new ImportService();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ImportService, importService };
}

// Make available globally
if (typeof window !== 'undefined') {
  window.importService = importService;
  window.ImportService = ImportService;
}
