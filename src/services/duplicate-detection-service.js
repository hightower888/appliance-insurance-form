/**
 * Duplicate Detection Service
 * Real-time duplicate customer detection with confidence scoring
 */

class DuplicateDetectionService {
  constructor() {
    this.database = null;
    this.cache = new Map(); // Cache for recent queries
    this.cacheTTL = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Initialize service with database reference
   * @param {Object} database - Firebase database reference
   */
  initialize(database) {
    this.database = database;
    console.log('Duplicate Detection Service initialized');
  }

  /**
   * Normalize phone number for comparison
   * @param {string} phone - Phone number
   * @returns {string} Normalized phone number
   */
  normalizePhone(phone) {
    if (!phone) return '';
    // Remove all non-digit characters
    return phone.replace(/\D/g, '');
  }

  /**
   * Normalize email for comparison
   * @param {string} email - Email address
   * @returns {string} Normalized email
   */
  normalizeEmail(email) {
    if (!email) return '';
    // Lowercase and trim
    return email.toLowerCase().trim();
  }

  /**
   * Normalize name for comparison
   * @param {string} name - Name
   * @returns {string} Normalized name
   */
  normalizeName(name) {
    if (!name) return '';
    // Lowercase, trim, remove extra spaces
    return name.toLowerCase().trim().replace(/\s+/g, ' ');
  }

  /**
   * Calculate name similarity (Levenshtein distance based)
   * @param {string} name1 - First name
   * @param {string} name2 - Second name
   * @returns {number} Similarity score (0-1)
   */
  calculateNameSimilarity(name1, name2) {
    const n1 = this.normalizeName(name1);
    const n2 = this.normalizeName(name2);
    
    if (n1 === n2) return 1.0;
    if (!n1 || !n2) return 0.0;

    // Simple word-based similarity
    const words1 = n1.split(' ');
    const words2 = n2.split(' ');
    
    let matches = 0;
    let totalWords = Math.max(words1.length, words2.length);
    
    for (const word1 of words1) {
      for (const word2 of words2) {
        if (word1 === word2 || 
            (word1.length > 2 && word2.length > 2 && 
             (word1.includes(word2) || word2.includes(word1)))) {
          matches++;
          break;
        }
      }
    }
    
    return matches / totalWords;
  }

  /**
   * Query existing customers by phone number
   * @param {string} phone - Phone number
   * @returns {Promise<Array>} Array of matching customers
   */
  async queryByPhone(phone) {
    if (!this.database || !phone) return [];
    
    const normalizedPhone = this.normalizePhone(phone);
    if (normalizedPhone.length < 10) return []; // Too short to be valid
    
    try {
      const salesRef = this.database.ref('sales');
      const snapshot = await salesRef.once('value');
      const sales = snapshot.val() || {};
      
      const matches = [];
      for (const [saleId, sale] of Object.entries(sales)) {
        const salePhone = this.normalizePhone(sale.contact?.phone || '');
        if (salePhone === normalizedPhone) {
          matches.push({
            saleId,
            ...sale,
            matchType: 'phone',
            matchConfidence: 'HIGH'
          });
        }
      }
      
      return matches;
    } catch (error) {
      console.error('Error querying by phone:', error);
      return [];
    }
  }

  /**
   * Query existing customers by email
   * @param {string} email - Email address
   * @returns {Promise<Array>} Array of matching customers
   */
  async queryByEmail(email) {
    if (!this.database || !email) return [];
    
    const normalizedEmail = this.normalizeEmail(email);
    if (!normalizedEmail.includes('@')) return []; // Invalid email
    
    try {
      const salesRef = this.database.ref('sales');
      const snapshot = await salesRef.once('value');
      const sales = snapshot.val() || {};
      
      const matches = [];
      for (const [saleId, sale] of Object.entries(sales)) {
        const saleEmail = this.normalizeEmail(sale.contact?.email || '');
        if (saleEmail === normalizedEmail) {
          matches.push({
            saleId,
            ...sale,
            matchType: 'email',
            matchConfidence: 'HIGH'
          });
        }
      }
      
      return matches;
    } catch (error) {
      console.error('Error querying by email:', error);
      return [];
    }
  }

  /**
   * Query existing customers by name
   * @param {string} name - Name
   * @returns {Promise<Array>} Array of matching customers
   */
  async queryByName(name) {
    if (!this.database || !name) return [];
    
    const normalizedName = this.normalizeName(name);
    if (normalizedName.length < 3) return []; // Too short
    
    try {
      const salesRef = this.database.ref('sales');
      const snapshot = await salesRef.once('value');
      const sales = snapshot.val() || {};
      
      const matches = [];
      for (const [saleId, sale] of Object.entries(sales)) {
        const saleName = this.normalizeName(sale.contact?.name || '');
        if (saleName) {
          const similarity = this.calculateNameSimilarity(normalizedName, saleName);
          if (similarity >= 0.6) { // 60% similarity threshold
            matches.push({
              saleId,
              ...sale,
              matchType: 'name',
              matchConfidence: similarity >= 0.9 ? 'HIGH' : similarity >= 0.75 ? 'MEDIUM' : 'LOW',
              similarity
            });
          }
        }
      }
      
      // Sort by similarity (highest first)
      matches.sort((a, b) => (b.similarity || 0) - (a.similarity || 0));
      
      return matches;
    } catch (error) {
      console.error('Error querying by name:', error);
      return [];
    }
  }

  /**
   * Check for duplicate customers
   * @param {Object} customerData - Customer data to check
   * @param {string} customerData.phone - Phone number
   * @param {string} customerData.email - Email address
   * @param {string} customerData.name - Name
   * @returns {Promise<Object>} Duplicate detection result
   */
  async checkDuplicate(customerData) {
    if (!customerData) {
      return { hasDuplicate: false, matches: [], confidence: null };
    }

    const { phone, email, name } = customerData;
    const matches = [];
    let confidence = null;

    // Primary: Phone number matching
    if (phone) {
      const phoneMatches = await this.queryByPhone(phone);
      if (phoneMatches.length > 0) {
        matches.push(...phoneMatches);
        confidence = 'HIGH';
      }
    }

    // Secondary: Email matching (if no phone match or to increase confidence)
    if (email && (confidence !== 'HIGH' || matches.length === 0)) {
      const emailMatches = await this.queryByEmail(email);
      if (emailMatches.length > 0) {
        // Merge with existing matches, avoid duplicates
        for (const match of emailMatches) {
          if (!matches.find(m => m.saleId === match.saleId)) {
            matches.push(match);
          }
        }
        if (confidence !== 'HIGH') {
          confidence = 'HIGH';
        }
      }
    }

    // Tertiary: Name matching (if no high confidence match)
    if (name && confidence !== 'HIGH') {
      const nameMatches = await this.queryByName(name);
      if (nameMatches.length > 0) {
        // Merge with existing matches
        for (const match of nameMatches) {
          if (!matches.find(m => m.saleId === match.saleId)) {
            matches.push(match);
          }
        }
        // Update confidence based on name match quality
        const bestNameMatch = nameMatches[0];
        if (bestNameMatch.matchConfidence === 'HIGH') {
          confidence = 'MEDIUM'; // Name match high = medium overall
        } else if (bestNameMatch.matchConfidence === 'MEDIUM') {
          confidence = 'LOW'; // Name match medium = low overall
        } else {
          confidence = 'LOW';
        }
      }
    }

    // Determine final confidence
    if (matches.length === 0) {
      confidence = null;
    } else if (!confidence) {
      // Fallback: use highest confidence from matches
      const confidences = matches.map(m => m.matchConfidence).filter(c => c);
      if (confidences.includes('HIGH')) {
        confidence = 'HIGH';
      } else if (confidences.includes('MEDIUM')) {
        confidence = 'MEDIUM';
      } else {
        confidence = 'LOW';
      }
    }

    return {
      hasDuplicate: matches.length > 0,
      matches: matches.slice(0, 5), // Limit to top 5 matches
      confidence,
      matchCount: matches.length
    };
  }

  /**
   * Store duplicate match in database for tracking
   * @param {string} recordId - New record ID
   * @param {Object} duplicateResult - Duplicate detection result
   * @returns {Promise<void>}
   */
  async storeDuplicateMatch(recordId, duplicateResult) {
    if (!this.database || !recordId || !duplicateResult.hasDuplicate) {
      return;
    }

    try {
      const duplicateRef = this.database.ref(`duplicate_matches/${recordId}`);
      await duplicateRef.set({
        recordId,
        detectedAt: new Date().toISOString(),
        confidence: duplicateResult.confidence,
        matchCount: duplicateResult.matchCount,
        matches: duplicateResult.matches.map(m => ({
          saleId: m.saleId,
          matchType: m.matchType,
          matchConfidence: m.matchConfidence
        }))
      });
    } catch (error) {
      console.error('Error storing duplicate match:', error);
    }
  }
}

// Create singleton instance
const duplicateDetectionService = new DuplicateDetectionService();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { DuplicateDetectionService, duplicateDetectionService };
}

// Make available globally
if (typeof window !== 'undefined') {
  window.duplicateDetectionService = duplicateDetectionService;
  window.DuplicateDetectionService = DuplicateDetectionService;
}
