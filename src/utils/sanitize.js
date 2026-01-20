/**
 * HTML Sanitization Utility
 * Prevents XSS attacks by escaping HTML special characters
 */

/**
 * Sanitize HTML string to prevent XSS attacks
 * Escapes HTML special characters so they display as text, not HTML
 * @param {string} str - String to sanitize
 * @returns {string} - Sanitized string safe for innerHTML
 */
function sanitizeHTML(str) {
  if (str == null || str === undefined) {
    return '';
  }
  
  // Convert to string if not already
  const text = String(str);
  
  // Create a temporary div element
  const div = document.createElement('div');
  // Set textContent (automatically escapes HTML)
  div.textContent = text;
  // Return innerHTML (now safely escaped)
  return div.innerHTML;
}

/**
 * Sanitize object properties recursively
 * Useful for sanitizing user data objects before displaying
 * @param {Object} obj - Object to sanitize
 * @returns {Object} - Sanitized object
 */
function sanitizeObject(obj) {
  if (obj == null || typeof obj !== 'object') {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }
  
  const sanitized = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const value = obj[key];
      if (typeof value === 'string') {
        sanitized[key] = sanitizeHTML(value);
      } else if (typeof value === 'object') {
        sanitized[key] = sanitizeObject(value);
      } else {
        sanitized[key] = value;
      }
    }
  }
  return sanitized;
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { sanitizeHTML, sanitizeObject };
}
