/**
 * Automated Insights Service (Phase 4B)
 * Generate actionable insights from CRM data
 */

class AutomatedInsightsService {
  constructor(options = {}) {
    this.options = {
      checkInterval: options.checkInterval || 60 * 60 * 1000, // 1 hour
      insightsHistory: [],
      ...options
    };
  }

  /**
   * Generate insights from leads data
   * @param {Array} leads - Array of leads
   * @returns {Array} Array of insights
   */
  generateInsights(leads) {
    if (!leads || leads.length === 0) {
      return [{
        type: 'info',
        title: 'No Data',
        message: 'No leads available for analysis',
        priority: 'low'
      }];
    }

    const insights = [];

    // Conversion rate insights
    insights.push(...this.analyzeConversionRates(leads));

    // Disposition insights
    insights.push(...this.analyzeDispositions(leads));

    // Engagement insights
    insights.push(...this.analyzeEngagement(leads));

    // Time-based insights
    insights.push(...this.analyzeTimePatterns(leads));

    // Value insights
    insights.push(...this.analyzeValue(leads));

    // Risk insights
    insights.push(...this.analyzeRisk(leads));

    return insights.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * Analyze conversion rates
   * @param {Array} leads - Leads array
   * @returns {Array} Insights
   */
  analyzeConversionRates(leads) {
    const insights = [];
    const total = leads.length;
    const converted = leads.filter(l => l.leadStatus === 'converted' || l.submittedAt).length;
    const conversionRate = total > 0 ? (converted / total) * 100 : 0;

    if (conversionRate < 10 && total > 20) {
      insights.push({
        type: 'warning',
        title: 'Low Conversion Rate',
        message: `Conversion rate is ${conversionRate.toFixed(1)}%. Consider reviewing follow-up processes.`,
        priority: 'high',
        action: 'Review conversion funnel',
        metric: conversionRate
      });
    } else if (conversionRate > 30) {
      insights.push({
        type: 'success',
        title: 'High Conversion Rate',
        message: `Excellent conversion rate of ${conversionRate.toFixed(1)}%!`,
        priority: 'medium',
        metric: conversionRate
      });
    }

    return insights;
  }

  /**
   * Analyze dispositions
   * @param {Array} leads - Leads array
   * @returns {Array} Insights
   */
  analyzeDispositions(leads) {
    const insights = [];
    const dispositionCounts = {};
    
    leads.forEach(lead => {
      const disp = lead.disposition || 'none';
      dispositionCounts[disp] = (dispositionCounts[disp] || 0) + 1;
    });

    const total = leads.length;
    const interested = dispositionCounts.interested || 0;
    const notInterested = dispositionCounts.not_interested || 0;
    const callBack = dispositionCounts.call_back || 0;

    if (notInterested > total * 0.3 && total > 10) {
      insights.push({
        type: 'warning',
        title: 'High "Not Interested" Rate',
        message: `${((notInterested / total) * 100).toFixed(1)}% of leads are not interested. Review lead quality.`,
        priority: 'high',
        action: 'Review lead sources',
        metric: (notInterested / total) * 100
      });
    }

    if (callBack > total * 0.2 && total > 10) {
      insights.push({
        type: 'info',
        title: 'Follow-up Opportunities',
        message: `${callBack} leads need callbacks. Schedule follow-ups.`,
        priority: 'medium',
        action: 'Schedule callbacks',
        metric: callBack
      });
    }

    return insights;
  }

  /**
   * Analyze engagement
   * @param {Array} leads - Leads array
   * @returns {Array} Insights
   */
  analyzeEngagement(leads) {
    const insights = [];
    const leadsWithNotes = leads.filter(l => l.notes && l.notes.trim().length > 0).length;
    const leadsWithPlans = leads.filter(l => l.plan && l.plan.type).length;
    const total = leads.length;

    if (leadsWithNotes < total * 0.3 && total > 10) {
      insights.push({
        type: 'warning',
        title: 'Low Engagement',
        message: `Only ${((leadsWithNotes / total) * 100).toFixed(1)}% of leads have notes. Add more engagement.`,
        priority: 'medium',
        action: 'Encourage note-taking',
        metric: (leadsWithNotes / total) * 100
      });
    }

    if (leadsWithPlans < total * 0.2 && total > 10) {
      insights.push({
        type: 'info',
        title: 'Plan Selection Opportunity',
        message: `${total - leadsWithPlans} leads don't have plans selected.`,
        priority: 'medium',
        action: 'Follow up on plan selection',
        metric: leadsWithPlans
      });
    }

    return insights;
  }

  /**
   * Analyze time patterns
   * @param {Array} leads - Leads array
   * @returns {Array} Insights
   */
  analyzeTimePatterns(leads) {
    const insights = [];
    const now = Date.now();
    const oneDayAgo = now - (24 * 60 * 60 * 1000);
    const oneWeekAgo = now - (7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = now - (30 * 24 * 60 * 60 * 1000);

    const recentLeads = leads.filter(l => (l.timestamp || 0) > oneDayAgo).length;
    const weekLeads = leads.filter(l => (l.timestamp || 0) > oneWeekAgo).length;
    const monthLeads = leads.filter(l => (l.timestamp || 0) > oneMonthAgo).length;
    const staleLeads = leads.filter(l => {
      const timestamp = l.timestamp || 0;
      const daysOld = (now - timestamp) / (1000 * 60 * 60 * 24);
      return daysOld > 90 && !l.submittedAt;
    }).length;

    if (recentLeads === 0 && leads.length > 0) {
      insights.push({
        type: 'warning',
        title: 'No Recent Leads',
        message: 'No new leads in the last 24 hours. Check lead sources.',
        priority: 'high',
        action: 'Review lead generation',
        metric: recentLeads
      });
    }

    if (staleLeads > leads.length * 0.2) {
      insights.push({
        type: 'info',
        title: 'Stale Leads',
        message: `${staleLeads} leads are over 90 days old. Consider cleanup or re-engagement.`,
        priority: 'medium',
        action: 'Review stale leads',
        metric: staleLeads
      });
    }

    return insights;
  }

  /**
   * Analyze value
   * @param {Array} leads - Leads array
   * @returns {Array} Insights
   */
  analyzeValue(leads) {
    const insights = [];
    const leadsWithAppliances = leads.filter(l => l.appliances && l.appliances.length > 0);
    const avgApplianceCount = leadsWithAppliances.length > 0
      ? leadsWithAppliances.reduce((sum, l) => sum + l.appliances.length, 0) / leadsWithAppliances.length
      : 0;

    const totalMonthlyValue = leadsWithAppliances.reduce((sum, lead) => {
      return sum + (lead.appliances || []).reduce((appSum, app) => {
        return appSum + (parseFloat(app.monthlyCost) || 0);
      }, 0);
    }, 0);

    const avgMonthlyValue = leadsWithAppliances.length > 0
      ? totalMonthlyValue / leadsWithAppliances.length
      : 0;

    if (avgApplianceCount < 1.5 && leads.length > 10) {
      insights.push({
        type: 'info',
        title: 'Low Appliance Count',
        message: `Average appliance count is ${avgApplianceCount.toFixed(1)}. Consider upselling.`,
        priority: 'low',
        action: 'Upsell additional appliances',
        metric: avgApplianceCount
      });
    }

    if (avgMonthlyValue > 30) {
      insights.push({
        type: 'success',
        title: 'High Value Leads',
        message: `Average monthly value is £${avgMonthlyValue.toFixed(2)}. Focus on conversion.`,
        priority: 'medium',
        metric: avgMonthlyValue
      });
    }

    return insights;
  }

  /**
   * Analyze risk
   * @param {Array} leads - Leads array
   * @returns {Array} Insights
   */
  analyzeRisk(leads) {
    const insights = [];

    if (typeof ChurnPredictionService !== 'undefined') {
      const churnService = new ChurnPredictionService();
      const highRiskLeads = churnService.getHighRiskLeads(leads, 5);

      if (highRiskLeads.length > 0) {
        insights.push({
          type: 'warning',
          title: 'High Churn Risk Leads',
          message: `${highRiskLeads.length} leads have high churn risk. Immediate action recommended.`,
          priority: 'high',
          action: 'Review high-risk leads',
          metric: highRiskLeads.length,
          data: highRiskLeads.map(l => l.id)
        });
      }
    }

    return insights;
  }

  /**
   * Get insights summary
   * @param {Array} insights - Insights array
   * @returns {Object} Summary
   */
  getInsightsSummary(insights) {
    const summary = {
      total: insights.length,
      byType: {},
      byPriority: { high: 0, medium: 0, low: 0 },
      actionable: insights.filter(i => i.action).length
    };

    insights.forEach(insight => {
      summary.byType[insight.type] = (summary.byType[insight.type] || 0) + 1;
      summary.byPriority[insight.priority] = (summary.byPriority[insight.priority] || 0) + 1;
    });

    return summary;
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { AutomatedInsightsService };
}

// Make available globally
if (typeof window !== 'undefined') {
  window.AutomatedInsightsService = AutomatedInsightsService;
}
