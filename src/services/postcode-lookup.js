/**
 * Postcode Lookup Service
 * Provides UK postcode lookup functionality using Postcodes.io API
 * Returns full address details including street, city, county, and postcode
 */

const postcodeLookup = {
  /**
   * API base URL for Postcodes.io (free, no authentication required)
   */
  API_BASE_URL: 'https://api.postcodes.io',

  /**
   * Lookup address details by UK postcode
   * @param {string} postcode - UK postcode (e.g., "SW1A 1AA")
   * @returns {Promise<Object>} Address object with street, city, county, postcode
   * @throws {Error} If postcode is invalid or API call fails
   */
  async lookupPostcode(postcode) {
    if (!postcode || typeof postcode !== 'string') {
      throw new Error('Postcode is required and must be a string');
    }

    // Clean and format postcode (remove spaces, convert to uppercase)
    const cleanPostcode = postcode.trim().replace(/\s+/g, '').toUpperCase();

    if (!cleanPostcode) {
      throw new Error('Postcode cannot be empty');
    }

    try {
      // Call Postcodes.io API
      const response = await fetch(`${this.API_BASE_URL}/postcodes/${encodeURIComponent(cleanPostcode)}`);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Postcode not found. Please check the postcode and try again.');
        }
        throw new Error(`Postcode lookup failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.result) {
        throw new Error('Invalid response from postcode lookup service');
      }

      const result = data.result;

      // Extract and structure address data
      const address = {
        street: this.formatStreetAddress(result),
        city: result.post_town || result.ward || '',
        county: result.admin_county || result.admin_district || result.county || '',
        postcode: result.postcode || cleanPostcode,
        // Additional fields for reference
        line1: result.line_1 || '',
        line2: result.line_2 || '',
        line3: result.line_3 || ''
      };

      return address;
    } catch (error) {
      // Re-throw with user-friendly message
      if (error.message.includes('Postcode not found') || error.message.includes('lookup failed')) {
        throw error;
      }
      throw new Error(`Failed to lookup postcode: ${error.message}`);
    }
  },

  /**
   * Format street address from API response
   * Combines line_1, line_2, line_3 into a single street address
   * @param {Object} result - API response result object
   * @returns {string} Formatted street address
   */
  formatStreetAddress(result) {
    const parts = [];
    
    if (result.line_1) parts.push(result.line_1);
    if (result.line_2) parts.push(result.line_2);
    if (result.line_3) parts.push(result.line_3);

    return parts.join(', ') || result.thoroughfare || '';
  },

  /**
   * Validate UK postcode format (basic validation)
   * @param {string} postcode - Postcode to validate
   * @returns {boolean} True if format appears valid
   */
  isValidFormat(postcode) {
    if (!postcode || typeof postcode !== 'string') {
      return false;
    }

    // Basic UK postcode format validation
    // Format: AA9A 9AA or A9A 9AA or A9 9AA or A99 9AA or AA9 9AA or AA99 9AA
    const postcodeRegex = /^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/i;
    return postcodeRegex.test(postcode.trim());
  }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = postcodeLookup;
}
