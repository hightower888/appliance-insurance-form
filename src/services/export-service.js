/**
 * Export Service
 * Comprehensive CSV export with 160+ fields, CRM-ready format
 */

class ExportService {
  constructor() {
    this.fieldMappings = {}; // Custom field mappings
    this.defaultMappings = this.getDefaultFieldMappings();
  }

  /**
   * Get default field mappings (160+ fields)
   * @returns {Object} Default field mappings
   */
  getDefaultFieldMappings() {
    return {
      // Customer Information
      'customerTitle': 'Customer Title',
      'customerFirstName': 'Customer First Name',
      'customerLastName': 'Customer Last Name',
      'customerFullName': 'Customer Full Name',
      'customerPremium': 'Customer Premium',
      'customerPackage': 'Customer Package',
      
      // Contact Information
      'email': 'Email',
      'phone': 'Phone',
      'mobile': 'Mobile',
      
      // Address Information
      'address': 'Address',
      'street': 'Street',
      'city': 'City',
      'county': 'County',
      'province': 'Province',
      'postcode': 'Postcode',
      'postalCode': 'Postal Code',
      
      // Financial Information
      'sortCode': 'Sort Code',
      'accountNumber': 'Account Number',
      'accountName': 'Account Name',
      'directDebitDate': 'Direct Debit Date',
      'ddDate': 'DD Date',
      'totalPlanCost': 'Total Plan Cost',
      'totalCost': 'Total Cost',
      
      // Technical Fields
      'leadSource': 'Lead Source',
      'paymentMethod': 'Payment Method',
      'processor': 'Processor',
      'customerReference': 'Customer Reference',
      
      // Plan Information
      'planNumber': 'Plan Number',
      'planType': 'Plan Type',
      'plan': 'Plan',
      
      // Timestamps
      'createdAt': 'Created At',
      'submittedAt': 'Submitted At',
      'timestamp': 'Timestamp',
      
      // Agent Information
      'agentId': 'Agent ID',
      'agentEmail': 'Agent Email',
      
      // Notes
      'notes': 'Notes'
    };
  }

  /**
   * Set custom field mappings
   * @param {Object} mappings - Custom field mappings
   */
  setFieldMappings(mappings) {
    this.fieldMappings = { ...this.defaultMappings, ...mappings };
  }

  /**
   * Get field mappings (custom or default)
   * @returns {Object} Field mappings
   */
  getFieldMappings() {
    return Object.keys(this.fieldMappings).length > 0 
      ? this.fieldMappings 
      : this.defaultMappings;
  }

  /**
   * Map a sale object to all fields
   * @param {Object} sale - Sale object
   * @returns {Object} Mapped fields object
   */
  mapSaleToFields(sale) {
    const fields = {};
    
    // Customer Information
    const name = sale.contact?.name || '';
    const nameParts = name.split(' ');
    fields.customerTitle = sale.contact?.title || '';
    fields.customerFirstName = nameParts[0] || '';
    fields.customerLastName = nameParts.slice(1).join(' ') || '';
    fields.customerFullName = name;
    fields.customerPremium = sale.plan?.totalCost || 0;
    fields.customerPackage = sale.plan?.type || '';
    
    // Contact Information
    fields.email = sale.contact?.email || '';
    fields.phone = sale.contact?.phone || '';
    fields.mobile = sale.contact?.phone || ''; // Same as phone if no separate mobile
    
    // Address Information
    fields.address = sale.contact?.address || '';
    fields.street = sale.contact?.address || '';
    fields.city = sale.contact?.city || '';
    fields.county = sale.contact?.county || '';
    fields.province = sale.contact?.county || '';
    fields.postcode = sale.contact?.postcode || '';
    fields.postalCode = sale.contact?.postcode || '';
    
    // Financial Information
    fields.sortCode = sale.payment?.sortCode || '';
    fields.accountNumber = sale.payment?.accountNumber || '';
    fields.accountName = sale.payment?.accountName || '';
    fields.directDebitDate = sale.payment?.ddDate || '';
    fields.ddDate = sale.payment?.ddDate || '';
    fields.totalPlanCost = sale.plan?.totalCost || 0;
    fields.totalCost = sale.plan?.totalCost || 0;
    
    // Technical Fields
    fields.leadSource = sale.leadSource || 'FE3';
    fields.paymentMethod = 'DD';
    fields.processor = sale.processor || '';
    fields.customerReference = sale.plan?.number || '';
    
    // Plan Information
    fields.planNumber = sale.plan?.number || '';
    fields.planType = sale.plan?.type || '';
    fields.plan = sale.plan?.type || '';
    
    // Timestamps
    fields.createdAt = sale.createdAt || sale.submittedAt || '';
    fields.submittedAt = sale.submittedAt || '';
    fields.timestamp = sale.timestamp || sale.submittedAt || '';
    
    // Agent Information
    fields.agentId = sale.agentId || '';
    fields.agentEmail = sale.agentEmail || '';
    
    // Notes
    fields.notes = sale.notes || '';
    
    // Dynamic Fields
    if (sale.dynamicFields) {
      Object.assign(fields, sale.dynamicFields);
    }
    
    return fields;
  }

  /**
   * Expand appliance details (up to 10 appliances)
   * @param {Object} sale - Sale object
   * @returns {Object} Expanded appliance fields
   */
  expandAppliances(sale) {
    const appliances = sale.appliances || [];
    const applianceFields = {};
    
    for (let i = 0; i < 10; i++) {
      const appliance = appliances[i];
      const prefix = `appliance${i + 1}`;
      
      if (appliance) {
        applianceFields[`${prefix}Type`] = appliance.type || appliance.applianceType || '';
        applianceFields[`${prefix}Make`] = appliance.make || '';
        applianceFields[`${prefix}Model`] = appliance.model || '';
        applianceFields[`${prefix}Age`] = appliance.age || appliance.yearsOld || '';
        applianceFields[`${prefix}Cost`] = appliance.cost || appliance.price || 0;
        applianceFields[`${prefix}CoverLimit`] = appliance.coverLimit || appliance.limit || 0;
        applianceFields[`${prefix}SerialNumber`] = appliance.serialNumber || '';
        applianceFields[`${prefix}PurchasePrice`] = appliance.purchasePrice || '';
        applianceFields[`${prefix}UnderWarranty`] = appliance.underWarranty ? 'Yes' : 'No';
        applianceFields[`${prefix}InsuranceRequired`] = appliance.insuranceRequired ? 'Yes' : 'No';
        applianceFields[`${prefix}InsuranceType`] = appliance.insuranceType || '';
        applianceFields[`${prefix}InsuranceProvider`] = appliance.insuranceProvider || '';
        applianceFields[`${prefix}PolicyNumber`] = appliance.policyNumber || '';
        applianceFields[`${prefix}PremiumAmount`] = appliance.premiumAmount || '';
        applianceFields[`${prefix}CoverageAmount`] = appliance.coverageAmount || '';
        applianceFields[`${prefix}ExpiryDate`] = appliance.expiryDate || '';
        applianceFields[`${prefix}Notes`] = appliance.notes || appliance.additionalNotes || '';
      } else {
        // Empty fields for missing appliances
        applianceFields[`${prefix}Type`] = '';
        applianceFields[`${prefix}Make`] = '';
        applianceFields[`${prefix}Model`] = '';
        applianceFields[`${prefix}Age`] = '';
        applianceFields[`${prefix}Cost`] = '';
        applianceFields[`${prefix}CoverLimit`] = '';
        applianceFields[`${prefix}SerialNumber`] = '';
        applianceFields[`${prefix}PurchasePrice`] = '';
        applianceFields[`${prefix}UnderWarranty`] = '';
        applianceFields[`${prefix}InsuranceRequired`] = '';
        applianceFields[`${prefix}InsuranceType`] = '';
        applianceFields[`${prefix}InsuranceProvider`] = '';
        applianceFields[`${prefix}PolicyNumber`] = '';
        applianceFields[`${prefix}PremiumAmount`] = '';
        applianceFields[`${prefix}CoverageAmount`] = '';
        applianceFields[`${prefix}ExpiryDate`] = '';
        applianceFields[`${prefix}Notes`] = '';
      }
    }
    
    return applianceFields;
  }

  /**
   * Expand boiler cover details
   * @param {Object} sale - Sale object
   * @returns {Object} Boiler cover fields
   */
  expandBoilerCover(sale) {
    const boilerFields = {};
    
    if (sale.plan?.type && sale.plan.type.includes('Boiler')) {
      boilerFields.boilerCover = 'Yes';
      boilerFields.boilerPlanType = sale.boilerPlanType || '';
      boilerFields.boilerCost = sale.boilerCost || 0;
      boilerFields.boilerCoverLimit = sale.boilerCoverLimit || 0;
    } else {
      boilerFields.boilerCover = 'No';
      boilerFields.boilerPlanType = '';
      boilerFields.boilerCost = '';
      boilerFields.boilerCoverLimit = '';
    }
    
    return boilerFields;
  }

  /**
   * Get all field names (160+ fields)
   * @returns {Array} Array of field names
   */
  getAllFieldNames() {
    const baseFields = Object.keys(this.getDefaultFieldMappings());
    const applianceFields = [];
    
    // Add appliance fields (10 appliances × 17 fields each = 170 fields)
    for (let i = 1; i <= 10; i++) {
      applianceFields.push(
        `appliance${i}Type`, `appliance${i}Make`, `appliance${i}Model`, `appliance${i}Age`,
        `appliance${i}Cost`, `appliance${i}CoverLimit`, `appliance${i}SerialNumber`,
        `appliance${i}PurchasePrice`, `appliance${i}UnderWarranty`, `appliance${i}InsuranceRequired`,
        `appliance${i}InsuranceType`, `appliance${i}InsuranceProvider`, `appliance${i}PolicyNumber`,
        `appliance${i}PremiumAmount`, `appliance${i}CoverageAmount`, `appliance${i}ExpiryDate`,
        `appliance${i}Notes`
      );
    }
    
    // Add boiler fields
    const boilerFields = ['boilerCover', 'boilerPlanType', 'boilerCost', 'boilerCoverLimit'];
    
    return [...baseFields, ...applianceFields, ...boilerFields];
  }

  /**
   * Apply field mappings to field names
   * @param {Array} fieldNames - Array of field names
   * @param {Object} mappings - Field mappings
   * @returns {Array} Mapped field names
   */
  applyFieldMappings(fieldNames, mappings) {
    const mappedMappings = this.getFieldMappings();
    return fieldNames.map(fieldName => {
      return mappedMappings[fieldName] || mappings[fieldName] || fieldName;
    });
  }

  /**
   * Escape CSV value
   * @param {*} value - Value to escape
   * @returns {string} Escaped value
   */
  escapeCSVValue(value) {
    if (value === null || value === undefined) {
      return '';
    }
    
    const str = String(value);
    
    // If contains comma, quote, or newline, wrap in quotes and escape quotes
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    
    return str;
  }

  /**
   * Deduplicate sales array using duplicate detection service
   * @param {Array} sales - Array of sale objects
   * @param {Object} duplicateService - Duplicate detection service instance
   * @returns {Object} Deduplication result { unique: Array, duplicates: Array, duplicateCount: number }
   */
  deduplicateSales(sales, duplicateService) {
    if (!duplicateService || !sales || sales.length === 0) {
      return { unique: sales, duplicates: [], duplicateCount: 0 };
    }

    const unique = [];
    const duplicates = [];
    const seenPhones = new Set();
    const seenEmails = new Set();

    for (const sale of sales) {
      const phone = duplicateService.normalizePhone(sale.contact?.phone || '');
      const email = duplicateService.normalizeEmail(sale.contact?.email || '');
      
      let isDuplicate = false;
      
      // Check phone number
      if (phone && phone.length >= 10) {
        if (seenPhones.has(phone)) {
          isDuplicate = true;
        } else {
          seenPhones.add(phone);
        }
      }
      
      // Check email
      if (!isDuplicate && email) {
        if (seenEmails.has(email)) {
          isDuplicate = true;
        } else {
          seenEmails.add(email);
        }
      }
      
      if (isDuplicate) {
        duplicates.push(sale);
      } else {
        unique.push(sale);
      }
    }

    return {
      unique,
      duplicates,
      duplicateCount: duplicates.length
    };
  }

  /**
   * Generate CSV content
   * @param {Array} sales - Array of sale objects
   * @param {Object} options - Export options
   * @param {Object} options.mappings - Custom field mappings
   * @param {Array} options.selectedIds - Selected record IDs (optional)
   * @param {Function} options.filterFn - Filter function (optional)
   * @param {boolean} options.deduplicate - Enable deduplication (optional, default: false)
   * @param {Object} options.duplicateService - Duplicate detection service instance (optional)
   * @returns {string} CSV content
   */
  generateCSV(sales, options = {}) {
    if (!sales || sales.length === 0) {
      return '';
    }

    // Apply filters
    let filteredSales = sales;
    if (options.filterFn) {
      filteredSales = sales.filter(options.filterFn);
    }
    if (options.selectedIds && options.selectedIds.length > 0) {
      filteredSales = filteredSales.filter(sale => 
        options.selectedIds.includes(sale.id || sale.saleId)
      );
    }

    // Apply deduplication if enabled
    let deduplicationResult = null;
    if (options.deduplicate && options.duplicateService) {
      deduplicationResult = this.deduplicateSales(filteredSales, options.duplicateService);
      filteredSales = deduplicationResult.unique;
    }

    if (filteredSales.length === 0) {
      return '';
    }

    // Store deduplication result for reporting
    if (deduplicationResult) {
      this.lastDeduplicationResult = deduplicationResult;
    }

    // Apply custom mappings if provided
    if (options.mappings) {
      this.setFieldMappings(options.mappings);
    }

    // Get all field names
    const allFieldNames = this.getAllFieldNames();
    
    // Apply field mappings to headers
    const mappings = this.getFieldMappings();
    const headers = this.applyFieldMappings(allFieldNames, mappings);

    // Generate rows
    const rows = [headers.map(h => this.escapeCSVValue(h)).join(',')];

    for (const sale of filteredSales) {
      // Map sale to fields
      const baseFields = this.mapSaleToFields(sale);
      const applianceFields = this.expandAppliances(sale);
      const boilerFields = this.expandBoilerCover(sale);
      
      // Combine all fields
      const allFields = { ...baseFields, ...applianceFields, ...boilerFields };
      
      // Create row
      const row = allFieldNames.map(fieldName => {
        const value = allFields[fieldName] || '';
        return this.escapeCSVValue(value);
      });
      
      rows.push(row.join(','));
    }

    return rows.join('\n');
  }

  /**
   * Export sales to CSV file
   * @param {Array} sales - Array of sale objects
   * @param {Object} options - Export options
   * @param {Function} options.onProgress - Progress callback (current, total)
   * @returns {Promise<Object>} Export result
   */
  /**
   * Enhance data with Phase 4B analytics (lead scoring, churn prediction)
   * @param {Array} sales - Array of sale/lead objects
   * @returns {Array} Enhanced data
   */
  enhanceDataWithAnalytics(sales) {
    if (!sales || sales.length === 0) return sales;
    
    return sales.map(sale => {
      const enhanced = { ...sale };
      
      // Add lead scoring if available
      if (window.leadScoringService) {
        try {
          const score = window.leadScoringService.calculateScore(sale);
          enhanced.leadScore = score.score;
          enhanced.leadScoreGrade = score.grade;
        } catch (e) {
          // Scoring service not available or error
        }
      }
      
      // Add churn prediction if available
      if (window.churnPredictionService) {
        try {
          const prediction = window.churnPredictionService.predictChurn(sale);
          enhanced.churnRiskScore = prediction.riskScore;
          enhanced.churnRiskLevel = prediction.riskLevel;
        } catch (e) {
          // Churn prediction service not available or error
        }
      }
      
      return enhanced;
    });
  }

  async exportToCSV(sales, options = {}) {
    // Phase 4B: Enhance data with analytics if enabled
    const dataToExport = options.includeAnalytics !== false 
      ? this.enhanceDataWithAnalytics(sales)
      : sales;
    
    // Show progress for large exports
    const totalRecords = options.selectedIds ? options.selectedIds.length : dataToExport.length;
    let currentRecord = 0;
    
    if (options.onProgress) {
      options.onProgress(0, totalRecords);
    }
    
    // Generate CSV (this is synchronous, but we can report progress)
    const csvContent = this.generateCSV(dataToExport, options);
    
    if (!csvContent) {
      throw new Error('No data to export');
    }

    // Report progress
    if (options.onProgress) {
      options.onProgress(totalRecords, totalRecords);
    }

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = options.filename || `sales_export_${dateStr}.csv`;
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    // Get deduplication info if available
    const deduplicationInfo = this.lastDeduplicationResult ? {
      duplicatesRemoved: this.lastDeduplicationResult.duplicateCount,
      originalCount: totalRecords + this.lastDeduplicationResult.duplicateCount,
      uniqueCount: totalRecords
    } : null;

    return {
      success: true,
      recordCount: totalRecords,
      filename,
      fileSize: blob.size,
      deduplication: deduplicationInfo
    };
  }

  /**
   * Export selected records only
   * @param {Array} sales - Array of sale objects
   * @param {Array} selectedIds - Array of selected record IDs
   * @param {Object} options - Export options
   * @returns {Promise<Object>} Export result
   */
  async exportSelected(sales, selectedIds, options = {}) {
    if (!selectedIds || selectedIds.length === 0) {
      throw new Error('No records selected for export');
    }
    
    return this.exportToCSV(sales, {
      ...options,
      selectedIds,
      filename: options.filename || `sales_export_selected_${selectedIds.length}_${new Date().toISOString().split('T')[0]}.csv`
    });
  }
}

// Create singleton instance
const exportService = new ExportService();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ExportService, exportService };
}

// Make available globally
if (typeof window !== 'undefined') {
  window.exportService = exportService;
  window.ExportService = ExportService;
}
