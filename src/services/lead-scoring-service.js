/**
 * Lead Scoring Service (Phase 4B)
 * Predictive lead scoring based on multiple factors
 */

class LeadScoringService {
  constructor(options = {}) {
    this.options = {
      // Default scoring weights (must sum to 100)
      weights: {
        contactCompleteness: options.weights?.contactCompleteness || 20,
        applianceValue: options.weights?.applianceValue || 25,
        disposition: options.weights?.disposition || 30,
        engagement: options.weights?.engagement || 15,
        recency: options.weights?.recency || 10
      },
      // Scoring rules
      rules: options.rules || this.getDefaultRules(),
      ...options
    };

    // Validate weights sum to 100
    const totalWeight = Object.values(this.options.weights).reduce((sum, w) => sum + w, 0);
    if (Math.abs(totalWeight - 100) > 0.01) {
      console.warn('LeadScoringService: Weights do not sum to 100, normalizing');
      this.normalizeWeights();
    }
  }

  /**
   * Get default scoring rules
   * @returns {Object} Default rules
   */
  getDefaultRules() {
    return {
      contactCompleteness: {
        name: 10,
        email: 15,
        phone: 20,
        postcode: 10,
        address: 5
      },
      disposition: {
        interested: 100,
        call_back: 60,
        not_interested: 0,
        no_answer: 20,
        other: 30
      },
      applianceValue: {
        basePerAppliance: 10,
        valueMultiplier: 0.5, // 0.5 points per £1 monthly cost
        maxApplianceScore: 40
      },
      engagement: {
        hasNotes: 10,
        hasMultipleInteractions: 15,
        hasPlanSelected: 20
      },
      recency: {
        daysOld: {
          0: 100,    // Today
          1: 90,     // Yesterday
          7: 70,     // This week
          30: 50,    // This month
          90: 30,    // This quarter
          default: 10
        }
      }
    };
  }

  /**
   * Normalize weights to sum to 100
   */
  normalizeWeights() {
    const total = Object.values(this.options.weights).reduce((sum, w) => sum + w, 0);
    for (const key in this.options.weights) {
      this.options.weights[key] = (this.options.weights[key] / total) * 100;
    }
  }

  /**
   * Score a lead
   * @param {Object} lead - Lead object
   * @returns {Object} Scoring result
   */
  scoreLead(lead) {
    if (!lead) {
      return { totalScore: 0, breakdown: {}, grade: 'F' };
    }

    const breakdown = {
      contactCompleteness: this.scoreContactCompleteness(lead),
      applianceValue: this.scoreApplianceValue(lead),
      disposition: this.scoreDisposition(lead),
      engagement: this.scoreEngagement(lead),
      recency: this.scoreRecency(lead)
    };

    // Calculate weighted total
    const totalScore = Math.round(
      breakdown.contactCompleteness * (this.options.weights.contactCompleteness / 100) +
      breakdown.applianceValue * (this.options.weights.applianceValue / 100) +
      breakdown.disposition * (this.options.weights.disposition / 100) +
      breakdown.engagement * (this.options.weights.engagement / 100) +
      breakdown.recency * (this.options.weights.recency / 100)
    );

    return {
      totalScore: Math.min(100, Math.max(0, totalScore)),
      breakdown,
      grade: this.getGrade(totalScore),
      recommendations: this.getRecommendations(breakdown, totalScore)
    };
  }

  /**
   * Score contact completeness
   * @param {Object} lead - Lead object
   * @returns {number} Score 0-100
   */
  scoreContactCompleteness(lead) {
    const contact = lead.contact || {};
    const rules = this.options.rules.contactCompleteness;
    let score = 0;

    if (contact.name) score += rules.name || 0;
    if (contact.email) score += rules.email || 0;
    if (contact.phone) score += rules.phone || 0;
    if (contact.postcode) score += rules.postcode || 0;
    if (contact.address) score += rules.address || 0;

    return Math.min(100, score);
  }

  /**
   * Score appliance value
   * @param {Object} lead - Lead object
   * @returns {number} Score 0-100
   */
  scoreApplianceValue(lead) {
    const appliances = lead.appliances || [];
    const rules = this.options.rules.applianceValue;
    
    if (appliances.length === 0) return 0;

    // Base score per appliance
    let score = appliances.length * rules.basePerAppliance;

    // Value multiplier
    const totalMonthlyValue = appliances.reduce((sum, app) => {
      return sum + (parseFloat(app.monthlyCost) || 0);
    }, 0);
    score += totalMonthlyValue * rules.valueMultiplier;

    return Math.min(rules.maxApplianceScore || 100, score);
  }

  /**
   * Score disposition
   * @param {Object} lead - Lead object
   * @returns {number} Score 0-100
   */
  scoreDisposition(lead) {
    const disposition = lead.disposition || 'other';
    const rules = this.options.rules.disposition;
    return rules[disposition] || rules.other || 0;
  }

  /**
   * Score engagement
   * @param {Object} lead - Lead object
   * @returns {number} Score 0-100
   */
  scoreEngagement(lead) {
    const rules = this.options.rules.engagement;
    let score = 0;

    if (lead.notes && lead.notes.trim().length > 0) {
      score += rules.hasNotes || 0;
    }

    // Check for plan selection
    if (lead.plan && (lead.plan.number || lead.plan.type)) {
      score += rules.hasPlanSelected || 0;
    }

    // Multiple interactions (simplified - could check history)
    if (lead.notes && lead.notes.length > 50) {
      score += rules.hasMultipleInteractions || 0;
    }

    return Math.min(100, score);
  }

  /**
   * Score recency
   * @param {Object} lead - Lead object
   * @returns {number} Score 0-100
   */
  scoreRecency(lead) {
    const timestamp = lead.timestamp || lead.createdAt || Date.now();
    const now = Date.now();
    const daysOld = Math.floor((now - timestamp) / (1000 * 60 * 60 * 24));
    const rules = this.options.rules.recency.daysOld;

    if (daysOld === 0) return rules[0] || 100;
    if (daysOld === 1) return rules[1] || 90;
    if (daysOld <= 7) return rules[7] || 70;
    if (daysOld <= 30) return rules[30] || 50;
    if (daysOld <= 90) return rules[90] || 30;
    return rules.default || 10;
  }

  /**
   * Get grade from score
   * @param {number} score - Total score
   * @returns {string} Grade (A-F)
   */
  getGrade(score) {
    if (score >= 80) return 'A';
    if (score >= 65) return 'B';
    if (score >= 50) return 'C';
    if (score >= 35) return 'D';
    if (score >= 20) return 'E';
    return 'F';
  }

  /**
   * Get recommendations based on score
   * @param {Object} breakdown - Score breakdown
   * @param {number} totalScore - Total score
   * @returns {Array} Recommendations
   */
  getRecommendations(breakdown, totalScore) {
    const recommendations = [];

    if (breakdown.contactCompleteness < 50) {
      recommendations.push('Complete contact information to improve score');
    }

    if (breakdown.applianceValue < 20 && totalScore < 50) {
      recommendations.push('Add more appliances or increase coverage value');
    }

    if (breakdown.disposition < 50) {
      recommendations.push('Follow up to improve disposition');
    }

    if (breakdown.engagement < 30) {
      recommendations.push('Add notes or select a plan to increase engagement');
    }

    if (breakdown.recency < 30) {
      recommendations.push('Lead is getting stale - re-engage soon');
    }

    return recommendations;
  }

  /**
   * Score multiple leads
   * @param {Array} leads - Array of leads
   * @returns {Array} Scored leads with scores
   */
  scoreLeads(leads) {
    return leads.map(lead => ({
      ...lead,
      score: this.scoreLead(lead)
    })).sort((a, b) => b.score.totalScore - a.score.totalScore);
  }

  /**
   * Get top leads by score
   * @param {Array} leads - Array of leads
   * @param {number} limit - Number of top leads
   * @returns {Array} Top scored leads
   */
  getTopLeads(leads, limit = 10) {
    const scored = this.scoreLeads(leads);
    return scored.slice(0, limit);
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { LeadScoringService };
}

// Make available globally
if (typeof window !== 'undefined') {
  window.LeadScoringService = LeadScoringService;
}
