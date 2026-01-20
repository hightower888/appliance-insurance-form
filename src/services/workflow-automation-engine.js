/**
 * Workflow Automation Engine (Phase 4B)
 * Rule-based automation with triggers and actions
 */

class WorkflowAutomationEngine {
  constructor(options = {}) {
    this.options = {
      workflows: options.workflows || [],
      enabled: options.enabled !== false,
      ...options
    };

    this.workflows = [];
    this.loadWorkflows();
  }

  /**
   * Load workflows from storage
   */
  loadWorkflows() {
    try {
      const saved = localStorage.getItem('crm_workflows');
      if (saved) {
        this.workflows = JSON.parse(saved);
      } else {
        this.workflows = this.getDefaultWorkflows();
      }
    } catch (error) {
      console.error('WorkflowAutomationEngine: Error loading workflows:', error);
      this.workflows = this.getDefaultWorkflows();
    }
  }

  /**
   * Save workflows to storage
   */
  saveWorkflows() {
    try {
      localStorage.setItem('crm_workflows', JSON.stringify(this.workflows));
    } catch (error) {
      console.error('WorkflowAutomationEngine: Error saving workflows:', error);
    }
  }

  /**
   * Get default workflows
   * @returns {Array} Default workflows
   */
  getDefaultWorkflows() {
    return [
      {
        id: 'auto-assign-disposition',
        name: 'Auto-assign Disposition',
        enabled: true,
        trigger: {
          type: 'field_change',
          field: 'disposition',
          condition: 'equals',
          value: 'interested'
        },
        actions: [
          {
            type: 'update_field',
            field: 'leadStatus',
            value: 'contacted'
          },
          {
            type: 'add_note',
            message: 'Automatically updated status after disposition change'
          }
        ]
      },
      {
        id: 'stale-lead-alert',
        name: 'Stale Lead Alert',
        enabled: true,
        trigger: {
          type: 'time_based',
          condition: 'days_since_creation',
          value: 7
        },
        actions: [
          {
            type: 'notification',
            message: 'Lead is 7 days old - follow up recommended'
          }
        ]
      }
    ];
  }

  /**
   * Create a new workflow
   * @param {Object} workflow - Workflow definition
   * @returns {string} Workflow ID
   */
  createWorkflow(workflow) {
    const id = workflow.id || `workflow-${Date.now()}`;
    const newWorkflow = {
      id,
      name: workflow.name || 'Untitled Workflow',
      enabled: workflow.enabled !== false,
      trigger: workflow.trigger,
      actions: workflow.actions || [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    this.workflows.push(newWorkflow);
    this.saveWorkflows();
    return id;
  }

  /**
   * Update a workflow
   * @param {string} workflowId - Workflow ID
   * @param {Object} updates - Updates
   */
  updateWorkflow(workflowId, updates) {
    const workflow = this.workflows.find(w => w.id === workflowId);
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`);
    }

    Object.assign(workflow, updates);
    workflow.updatedAt = Date.now();
    this.saveWorkflows();
  }

  /**
   * Delete a workflow
   * @param {string} workflowId - Workflow ID
   */
  deleteWorkflow(workflowId) {
    this.workflows = this.workflows.filter(w => w.id !== workflowId);
    this.saveWorkflows();
  }

  /**
   * Enable/disable a workflow
   * @param {string} workflowId - Workflow ID
   * @param {boolean} enabled - Enabled state
   */
  toggleWorkflow(workflowId, enabled) {
    const workflow = this.workflows.find(w => w.id === workflowId);
    if (workflow) {
      workflow.enabled = enabled;
      this.saveWorkflows();
    }
  }

  /**
   * Process trigger for a lead
   * @param {Object} lead - Lead object
   * @param {string} triggerType - Trigger type
   * @param {Object} triggerData - Trigger data
   */
  async processTrigger(lead, triggerType, triggerData = {}) {
    if (!this.options.enabled) return;

    const matchingWorkflows = this.workflows.filter(w => 
      w.enabled && 
      w.trigger.type === triggerType &&
      this.evaluateTrigger(w.trigger, lead, triggerData)
    );

    for (const workflow of matchingWorkflows) {
      await this.executeActions(workflow.actions, lead, triggerData);
    }
  }

  /**
   * Evaluate trigger condition
   * @param {Object} trigger - Trigger definition
   * @param {Object} lead - Lead object
   * @param {Object} triggerData - Trigger data
   * @returns {boolean} True if trigger matches
   */
  evaluateTrigger(trigger, lead, triggerData) {
    switch (trigger.type) {
      case 'field_change':
        return this.evaluateFieldChange(trigger, lead, triggerData);
      
      case 'time_based':
        return this.evaluateTimeBased(trigger, lead);
      
      case 'score_threshold':
        return this.evaluateScoreThreshold(trigger, lead, triggerData);
      
      case 'custom':
        return trigger.evaluate ? trigger.evaluate(lead, triggerData) : false;
      
      default:
        return false;
    }
  }

  /**
   * Evaluate field change trigger
   * @param {Object} trigger - Trigger definition
   * @param {Object} lead - Lead object
   * @param {Object} triggerData - Trigger data
   * @returns {boolean} True if matches
   */
  evaluateFieldChange(trigger, lead, triggerData) {
    const field = trigger.field;
    const condition = trigger.condition || 'equals';
    const value = trigger.value;

    // Get field value (supports nested paths)
    const fieldValue = this.getNestedValue(lead, field);
    const newValue = triggerData.newValue !== undefined ? triggerData.newValue : fieldValue;

    switch (condition) {
      case 'equals':
        return newValue === value;
      case 'not_equals':
        return newValue !== value;
      case 'contains':
        return String(newValue).includes(String(value));
      case 'greater_than':
        return Number(newValue) > Number(value);
      case 'less_than':
        return Number(newValue) < Number(value);
      default:
        return false;
    }
  }

  /**
   * Evaluate time-based trigger
   * @param {Object} trigger - Trigger definition
   * @param {Object} lead - Lead object
   * @returns {boolean} True if matches
   */
  evaluateTimeBased(trigger, lead) {
    const timestamp = lead.timestamp || lead.createdAt || Date.now();
    const now = Date.now();
    const daysSince = (now - timestamp) / (1000 * 60 * 60 * 24);

    if (trigger.condition === 'days_since_creation') {
      return daysSince >= (trigger.value || 0);
    }

    return false;
  }

  /**
   * Evaluate score threshold trigger
   * @param {Object} trigger - Trigger definition
   * @param {Object} lead - Lead object
   * @param {Object} triggerData - Trigger data (may contain pre-calculated score)
   * @returns {boolean} True if matches
   */
  evaluateScoreThreshold(trigger, lead, triggerData = {}) {
    if (typeof LeadScoringService === 'undefined') return false;

    // Use pre-calculated score if provided, otherwise calculate
    let scoreValue;
    if (triggerData.score !== undefined) {
      scoreValue = triggerData.score;
    } else {
      const scoringService = new LeadScoringService();
      const score = scoringService.scoreLead(lead);
      scoreValue = score.totalScore;
    }

    const threshold = trigger.value || 0;
    const condition = trigger.condition || 'greater_than';

    switch (condition) {
      case 'greater_than':
        return scoreValue > threshold;
      case 'less_than':
        return scoreValue < threshold;
      case 'equals':
        return scoreValue === threshold;
      default:
        return false;
    }
  }

  /**
   * Execute workflow actions
   * @param {Array} actions - Actions to execute
   * @param {Object} lead - Lead object
   * @param {Object} triggerData - Trigger data
   */
  async executeActions(actions, lead, triggerData) {
    for (const action of actions) {
      await this.executeAction(action, lead, triggerData);
    }
  }

  /**
   * Execute a single action
   * @param {Object} action - Action definition
   * @param {Object} lead - Lead object
   * @param {Object} triggerData - Trigger data
   */
  async executeAction(action, lead, triggerData) {
    switch (action.type) {
      case 'update_field':
        await this.actionUpdateField(action, lead);
        break;
      
      case 'add_note':
        await this.actionAddNote(action, lead);
        break;
      
      case 'notification':
        this.actionNotification(action, lead);
        break;
      
      case 'send_email':
        await this.actionSendEmail(action, lead);
        break;
      
      case 'assign_to':
        await this.actionAssignTo(action, lead);
        break;
      
      default:
        console.warn(`WorkflowAutomationEngine: Unknown action type: ${action.type}`);
    }
  }

  /**
   * Action: Update field
   * @param {Object} action - Action definition
   * @param {Object} lead - Lead object
   */
  async actionUpdateField(action, lead) {
    const field = action.field;
    const value = action.value;

    // Update lead object
    this.setNestedValue(lead, field, value);

    // Save to Firebase if database available
    if (typeof getDatabase === 'function' && lead.id) {
      try {
        const db = getDatabase();
        const leadRef = db.ref(`sales/${lead.id}`);
        await leadRef.update({ [field]: value });
      } catch (error) {
        console.error('WorkflowAutomationEngine: Error updating field:', error);
      }
    }
  }

  /**
   * Action: Add note
   * @param {Object} action - Action definition
   * @param {Object} lead - Lead object
   */
  async actionAddNote(action, lead) {
    const message = action.message || 'Automated note';
    const timestamp = new Date().toISOString();
    const note = `[${timestamp}] ${message}`;

    if (!lead.notes) {
      lead.notes = '';
    }
    lead.notes += (lead.notes ? '\n' : '') + note;

    // Save to Firebase
    if (typeof getDatabase === 'function' && lead.id) {
      try {
        const db = getDatabase();
        const leadRef = db.ref(`sales/${lead.id}`);
        await leadRef.update({ notes: lead.notes });
      } catch (error) {
        console.error('WorkflowAutomationEngine: Error adding note:', error);
      }
    }
  }

  /**
   * Action: Notification
   * @param {Object} action - Action definition
   * @param {Object} lead - Lead object
   */
  actionNotification(action, lead) {
    const message = action.message || 'Workflow notification';
    
    if (typeof showCRMMessage === 'function') {
      showCRMMessage(message, 'info');
    } else {
      console.log(`Workflow Notification: ${message}`, lead);
    }
  }

  /**
   * Action: Send email (placeholder)
   * @param {Object} action - Action definition
   * @param {Object} lead - Lead object
   */
  async actionSendEmail(action, lead) {
    // Placeholder - would integrate with email service
    console.log('WorkflowAutomationEngine: Send email action', action, lead);
  }

  /**
   * Action: Assign to
   * @param {Object} action - Action definition
   * @param {Object} lead - Lead object
   */
  async actionAssignTo(action, lead) {
    const assignTo = action.value; // User ID or email
    
    if (typeof getDatabase === 'function' && lead.id) {
      try {
        const db = getDatabase();
        const leadRef = db.ref(`sales/${lead.id}`);
        await leadRef.update({ assignedTo: assignTo });
      } catch (error) {
        console.error('WorkflowAutomationEngine: Error assigning:', error);
      }
    }
  }

  /**
   * Get nested value from object
   * @param {Object} obj - Object
   * @param {string} path - Dot-separated path
   * @returns {*} Value
   */
  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  /**
   * Set nested value in object
   * @param {Object} obj - Object
   * @param {string} path - Dot-separated path
   * @param {*} value - Value to set
   */
  setNestedValue(obj, path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    const target = keys.reduce((current, key) => {
      if (!current[key]) current[key] = {};
      return current[key];
    }, obj);
    target[lastKey] = value;
  }

  /**
   * Get all workflows
   * @returns {Array} Workflows
   */
  getWorkflows() {
    return this.workflows;
  }

  /**
   * Get workflow by ID
   * @param {string} workflowId - Workflow ID
   * @returns {Object|null} Workflow
   */
  getWorkflow(workflowId) {
    return this.workflows.find(w => w.id === workflowId) || null;
  }
}

// Create singleton instance
const workflowAutomationEngine = new WorkflowAutomationEngine();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { WorkflowAutomationEngine, workflowAutomationEngine };
}

// Make available globally
if (typeof window !== 'undefined') {
  window.WorkflowAutomationEngine = WorkflowAutomationEngine;
  window.workflowAutomationEngine = workflowAutomationEngine;
}
