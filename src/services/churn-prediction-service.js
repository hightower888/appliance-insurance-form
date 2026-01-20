/**
 * Churn Prediction Service (Phase 4B)
 * Predict customer churn risk based on behavior patterns
 */

class ChurnPredictionService {
  constructor(options = {}) {
    this.options = {
      // Risk factors and weights
      weights: {
        engagement: options.weights?.engagement || 30,
        recency: options.weights?.recency || 25,
        disposition: options.weights?.disposition || 20,
        planValue: options.weights?.planValue || 15,
        contactQuality: options.weights?.contactQuality || 10
      },
      // Risk thresholds
      thresholds: {
        high: options.thresholds?.high || 70,
        medium: options.thresholds?.medium || 40,
        low: options.thresholds?.low || 20
      },
      ...options
    };
  }

  /**
   * Predict churn risk for a lead/customer
   * @param {Object} lead - Lead/customer object
   * @returns {Object} Churn prediction result
   */
  predictChurn(lead) {
    if (!lead) {
      return { riskScore: 0, riskLevel: 'unknown', factors: {} };
    }

    const factors = {
      engagement: this.calculateEngagementRisk(lead),
      recency: this.calculateRecencyRisk(lead),
      disposition: this.calculateDispositionRisk(lead),
      planValue: this.calculatePlanValueRisk(lead),
      contactQuality: this.calculateContactQualityRisk(lead)
    };

    // Calculate weighted risk score (0-100, higher = more risk)
    const riskScore = Math.round(
      factors.engagement * (this.options.weights.engagement / 100) +
      factors.recency * (this.options.weights.recency / 100) +
      factors.disposition * (this.options.weights.disposition / 100) +
      factors.planValue * (this.options.weights.planValue / 100) +
      factors.contactQuality * (this.options.weights.contactQuality / 100)
    );

    return {
      riskScore: Math.min(100, Math.max(0, riskScore)),
      riskLevel: this.getRiskLevel(riskScore),
      factors,
      recommendations: this.getRecommendations(factors, riskScore)
    };
  }

  /**
   * Calculate engagement risk (0-100, higher = more risk)
   * @param {Object} lead - Lead object
   * @returns {number} Risk score
   */
  calculateEngagementRisk(lead) {
    let risk = 50; // Base risk

    // Low engagement indicators
    if (!lead.notes || lead.notes.trim().length === 0) {
      risk += 20; // No notes = higher risk
    }

    if (!lead.plan || !lead.plan.type) {
      risk += 15; // No plan selected = higher risk
    }

    // High engagement indicators (reduce risk)
    if (lead.notes && lead.notes.length > 100) {
      risk -= 15; // Detailed notes = lower risk
    }

    if (lead.plan && lead.plan.type) {
      risk -= 10; // Plan selected = lower risk
    }

    return Math.min(100, Math.max(0, risk));
  }

  /**
   * Calculate recency risk
   * @param {Object} lead - Lead object
   * @returns {number} Risk score
   */
  calculateRecencyRisk(lead) {
    const timestamp = lead.timestamp || lead.createdAt || Date.now();
    const now = Date.now();
    const daysSinceCreation = Math.floor((now - timestamp) / (1000 * 60 * 60 * 24));
    const daysSinceUpdate = lead.updatedAt 
      ? Math.floor((now - new Date(lead.updatedAt).getTime()) / (1000 * 60 * 60 * 24))
      : daysSinceCreation;

    // Older leads with no updates = higher risk
    if (daysSinceUpdate > 90) return 90;
    if (daysSinceUpdate > 60) return 70;
    if (daysSinceUpdate > 30) return 50;
    if (daysSinceUpdate > 14) return 30;
    if (daysSinceUpdate > 7) return 20;
    return 10;
  }

  /**
   * Calculate disposition risk
   * @param {Object} lead - Lead object
   * @returns {number} Risk score
   */
  calculateDispositionRisk(lead) {
    const disposition = lead.disposition || 'none';

    const riskMap = {
      'not_interested': 90,
      'no_answer': 70,
      'other': 50,
      'call_back': 40,
      'interested': 10,
      'none': 60 // No disposition = medium risk
    };

    return riskMap[disposition] || 50;
  }

  /**
   * Calculate plan value risk
   * @param {Object} lead - Lead object
   * @returns {number} Risk score
   */
  calculatePlanValueRisk(lead) {
    const plan = lead.plan || {};
    const appliances = lead.appliances || [];

    // No plan or low value = higher risk
    if (!plan.type) return 60;
    if (appliances.length === 0) return 50;

    // Calculate total monthly value
    const totalMonthlyValue = appliances.reduce((sum, app) => {
      return sum + (parseFloat(app.monthlyCost) || 0);
    }, 0);

    // Lower value = higher risk
    if (totalMonthlyValue < 10) return 70;
    if (totalMonthlyValue < 20) return 50;
    if (totalMonthlyValue < 30) return 30;
    return 20; // Higher value = lower risk
  }

  /**
   * Calculate contact quality risk
   * @param {Object} lead - Lead object
   * @returns {number} Risk score
   */
  calculateContactQualityRisk(lead) {
    const contact = lead.contact || {};
    let missingFields = 0;

    if (!contact.name) missingFields++;
    if (!contact.email) missingFields++;
    if (!contact.phone) missingFields++;
    if (!contact.postcode) missingFields++;

    // More missing fields = higher risk
    if (missingFields >= 3) return 80;
    if (missingFields === 2) return 60;
    if (missingFields === 1) return 40;
    return 20; // Complete contact = lower risk
  }

  /**
   * Get risk level from score
   * @param {number} riskScore - Risk score
   * @returns {string} Risk level
   */
  getRiskLevel(riskScore) {
    if (riskScore >= this.options.thresholds.high) return 'high';
    if (riskScore >= this.options.thresholds.medium) return 'medium';
    if (riskScore >= this.options.thresholds.low) return 'low';
    return 'minimal';
  }

  /**
   * Get recommendations to reduce churn risk
   * @param {Object} factors - Risk factors
   * @param {number} riskScore - Total risk score
   * @returns {Array} Recommendations
   */
  getRecommendations(factors, riskScore) {
    const recommendations = [];

    if (factors.engagement > 60) {
      recommendations.push('Increase engagement: Add notes, follow up, select a plan');
    }

    if (factors.recency > 50) {
      recommendations.push('Re-engage soon: Lead is getting stale');
    }

    if (factors.disposition > 50) {
      recommendations.push('Improve disposition: Follow up to move to "interested"');
    }

    if (factors.planValue > 50) {
      recommendations.push('Increase plan value: Add more appliances or upgrade plan');
    }

    if (factors.contactQuality > 50) {
      recommendations.push('Complete contact information: Missing fields increase risk');
    }

    if (riskScore >= this.options.thresholds.high) {
      recommendations.push('URGENT: High churn risk - immediate action required');
    }

    return recommendations;
  }

  /**
   * Predict churn for multiple leads
   * @param {Array} leads - Array of leads
   * @returns {Array} Leads with churn predictions
   */
  predictChurnBatch(leads) {
    return leads.map(lead => ({
      ...lead,
      churnPrediction: this.predictChurn(lead)
    })).sort((a, b) => b.churnPrediction.riskScore - a.churnPrediction.riskScore);
  }

  /**
   * Get high-risk leads
   * @param {Array} leads - Array of leads
   * @param {number} limit - Number of leads to return
   * @returns {Array} High-risk leads
   */
  getHighRiskLeads(leads, limit = 10) {
    const predicted = this.predictChurnBatch(leads);
    return predicted
      .filter(lead => lead.churnPrediction.riskLevel === 'high')
      .slice(0, limit);
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ChurnPredictionService };
}

// Make available globally
if (typeof window !== 'undefined') {
  window.ChurnPredictionService = ChurnPredictionService;
}
