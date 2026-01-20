/**
 * Field Compatibility Layer
 * Handles backward compatibility between old submission format and new dynamic field format
 */

/**
 * Convert old submission format to new format with dynamicFields
 * @param {Object} oldSubmission - Old submission data
 * @returns {Object} - Submission with dynamicFields added
 */
function convertOldSubmissionToNew(oldSubmission) {
  if (!oldSubmission) return oldSubmission;
  
  // If already has dynamicFields, return as-is
  if (oldSubmission.dynamicFields) {
    return oldSubmission;
  }
  
  // Extract fields from old structure
  const dynamicFields = {};
  
  // Contact fields
  if (oldSubmission.contact) {
    dynamicFields.name = oldSubmission.contact.name || '';
    dynamicFields.phoneNumbers = oldSubmission.contact.phone || '';
    dynamicFields.email = oldSubmission.contact.email || '';
    dynamicFields.adress = oldSubmission.contact.address || '';
    dynamicFields.postcode = oldSubmission.contact.postcode || '';
  }
  
  // Payment fields
  if (oldSubmission.payment) {
    dynamicFields.sortCode = oldSubmission.payment.sortCode || '';
    dynamicFields.accountNumber = oldSubmission.payment.accountNumber || '';
    dynamicFields.ddDate = oldSubmission.payment.ddDate || '';
  }
  
  // Other fields
  if (oldSubmission.notes !== undefined) {
    dynamicFields.notes = oldSubmission.notes || '';
  }
  
  // Create new structure with dynamicFields
  const newSubmission = {
    ...oldSubmission,
    dynamicFields: dynamicFields,
    fieldConfigVersion: 'legacy' // Mark as legacy format
  };
  
  return newSubmission;
}

/**
 * Get field value from submission (handles both old and new formats)
 * @param {Object} submission - Submission data
 * @param {string} fieldName - Field name to get
 * @returns {any} - Field value or null
 */
function getFieldValue(submission, fieldName) {
  if (!submission) return null;
  
  // Try new format first
  if (submission.dynamicFields && submission.dynamicFields[fieldName] !== undefined) {
    return submission.dynamicFields[fieldName];
  }
  
  // Fall back to old format
  const fieldMap = {
    'name': submission.contact?.name,
    'phoneNumbers': submission.contact?.phone,
    'email': submission.contact?.email,
    'adress': submission.contact?.address,
    'postcode': submission.contact?.postcode,
    'sortCode': submission.payment?.sortCode,
    'accountNumber': submission.payment?.accountNumber,
    'ddDate': submission.payment?.ddDate,
    'notes': submission.notes
  };
  
  return fieldMap[fieldName] || null;
}

/**
 * Get all field values from submission (handles both formats)
 * @param {Object} submission - Submission data
 * @returns {Object} - All field values as flat object
 */
function getAllFieldValues(submission) {
  if (!submission) return {};
  
  // If has dynamicFields, use that
  if (submission.dynamicFields) {
    return { ...submission.dynamicFields };
  }
  
  // Otherwise, extract from old format
  return {
    name: submission.contact?.name || '',
    phoneNumbers: submission.contact?.phone || '',
    email: submission.contact?.email || '',
    adress: submission.contact?.address || '',
    postcode: submission.contact?.postcode || '',
    sortCode: submission.payment?.sortCode || '',
    accountNumber: submission.payment?.accountNumber || '',
    ddDate: submission.payment?.ddDate || '',
    notes: submission.notes || ''
  };
}

/**
 * Check if submission uses old format
 * @param {Object} submission - Submission data
 * @returns {boolean} - True if old format
 */
function isOldFormat(submission) {
  if (!submission) return false;
  return !submission.dynamicFields && !!submission.contact;
}

/**
 * Normalize submission to new format (if needed)
 * @param {Object} submission - Submission data
 * @returns {Object} - Normalized submission
 */
function normalizeSubmission(submission) {
  if (!submission) return submission;
  
  if (isOldFormat(submission)) {
    return convertOldSubmissionToNew(submission);
  }
  
  return submission;
}

// Export functions
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    convertOldSubmissionToNew,
    getFieldValue,
    getAllFieldValues,
    isOldFormat,
    normalizeSubmission
  };
}
