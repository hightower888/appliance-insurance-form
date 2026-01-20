/**
 * Workflow Designer Component (Phase 4B)
 * Visual workflow builder UI
 */

class WorkflowDesigner {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      workflowEngine: options.workflowEngine || (typeof workflowAutomationEngine !== 'undefined' ? workflowAutomationEngine : null),
      onSave: options.onSave || null,
      ...options
    };

    this.currentWorkflow = null;
    this.isEditing = false;
  }

  /**
   * Render workflow designer
   */
  render() {
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="workflow-designer-container">
        <div class="workflow-designer-header">
          <h3>Workflow Designer</h3>
          <div class="workflow-designer-actions">
            <button class="btn btn-primary" id="newWorkflowBtn">New Workflow</button>
            <button class="btn btn-secondary" id="saveWorkflowBtn" style="display: none;">Save Workflow</button>
            <button class="btn btn-secondary" id="cancelWorkflowBtn" style="display: none;">Cancel</button>
          </div>
        </div>

        <div class="workflow-designer-content">
          <div class="workflow-designer-sidebar">
            <h4>Existing Workflows</h4>
            <div id="workflowsList" class="workflows-list">
              ${this.renderWorkflowsList()}
            </div>
          </div>

          <div class="workflow-designer-main">
            <div id="workflowEditor" class="workflow-editor" style="display: none;">
              ${this.renderWorkflowEditor()}
            </div>
            <div id="workflowEmpty" class="workflow-empty">
              <p>Select a workflow to edit or create a new one</p>
            </div>
          </div>
        </div>
      </div>
    `;

    this.setupEventListeners();
  }

  /**
   * Render workflows list
   * @returns {string} HTML
   */
  renderWorkflowsList() {
    if (!this.options.workflowEngine) {
      return '<p>Workflow engine not available</p>';
    }

    const workflows = this.options.workflowEngine.getWorkflows();
    
    if (workflows.length === 0) {
      return '<p>No workflows yet. Create one to get started.</p>';
    }

    return workflows.map(workflow => `
      <div class="workflow-item ${workflow.enabled ? 'enabled' : 'disabled'}" data-workflow-id="${workflow.id}">
        <div class="workflow-item-header">
          <span class="workflow-item-name">${this.escapeHtml(workflow.name)}</span>
          <span class="workflow-item-status">${workflow.enabled ? '✓' : '○'}</span>
        </div>
        <div class="workflow-item-actions">
          <button class="btn btn-xs btn-secondary edit-workflow" data-id="${workflow.id}">Edit</button>
          <button class="btn btn-xs btn-secondary toggle-workflow" data-id="${workflow.id}">
            ${workflow.enabled ? 'Disable' : 'Enable'}
          </button>
          <button class="btn btn-xs btn-danger delete-workflow" data-id="${workflow.id}">Delete</button>
        </div>
      </div>
    `).join('');
  }

  /**
   * Render workflow editor
   * @returns {string} HTML
   */
  renderWorkflowEditor() {
    const workflow = this.currentWorkflow || {
      name: '',
      enabled: true,
      trigger: { type: 'field_change', field: '', condition: 'equals', value: '' },
      actions: []
    };

    return `
      <div class="workflow-editor-form">
        <div class="form-group">
          <label>Workflow Name</label>
          <input type="text" id="workflowName" class="form-control" value="${this.escapeHtml(workflow.name)}" placeholder="Enter workflow name">
        </div>

        <div class="form-group">
          <label>
            <input type="checkbox" id="workflowEnabled" ${workflow.enabled ? 'checked' : ''}>
            Enabled
          </label>
        </div>

        <div class="workflow-section">
          <h4>Trigger</h4>
          <div class="form-group">
            <label>Trigger Type</label>
            <select id="triggerType" class="form-control">
              <option value="field_change" ${workflow.trigger.type === 'field_change' ? 'selected' : ''}>Field Change</option>
              <option value="time_based" ${workflow.trigger.type === 'time_based' ? 'selected' : ''}>Time Based</option>
              <option value="score_threshold" ${workflow.trigger.type === 'score_threshold' ? 'selected' : ''}>Score Threshold</option>
            </select>
          </div>

          <div id="triggerConfig" class="trigger-config">
            ${this.renderTriggerConfig(workflow.trigger)}
          </div>
        </div>

        <div class="workflow-section">
          <h4>Actions</h4>
          <div id="actionsList" class="actions-list">
            ${this.renderActionsList(workflow.actions)}
          </div>
          <button class="btn btn-sm btn-secondary" id="addActionBtn">Add Action</button>
        </div>
      </div>
    `;
  }

  /**
   * Render trigger configuration
   * @param {Object} trigger - Trigger definition
   * @returns {string} HTML
   */
  renderTriggerConfig(trigger) {
    const type = trigger.type || 'field_change';

    if (type === 'field_change') {
      return `
        <div class="form-group">
          <label>Field</label>
          <input type="text" id="triggerField" class="form-control" value="${this.escapeHtml(trigger.field || '')}" placeholder="e.g., disposition">
        </div>
        <div class="form-group">
          <label>Condition</label>
          <select id="triggerCondition" class="form-control">
            <option value="equals" ${trigger.condition === 'equals' ? 'selected' : ''}>Equals</option>
            <option value="not_equals" ${trigger.condition === 'not_equals' ? 'selected' : ''}>Not Equals</option>
            <option value="contains" ${trigger.condition === 'contains' ? 'selected' : ''}>Contains</option>
            <option value="greater_than" ${trigger.condition === 'greater_than' ? 'selected' : ''}>Greater Than</option>
            <option value="less_than" ${trigger.condition === 'less_than' ? 'selected' : ''}>Less Than</option>
          </select>
        </div>
        <div class="form-group">
          <label>Value</label>
          <input type="text" id="triggerValue" class="form-control" value="${this.escapeHtml(trigger.value || '')}" placeholder="Value to match">
        </div>
      `;
    } else if (type === 'time_based') {
      return `
        <div class="form-group">
          <label>Condition</label>
          <select id="triggerCondition" class="form-control">
            <option value="days_since_creation" ${trigger.condition === 'days_since_creation' ? 'selected' : ''}>Days Since Creation</option>
          </select>
        </div>
        <div class="form-group">
          <label>Days</label>
          <input type="number" id="triggerValue" class="form-control" value="${trigger.value || ''}" placeholder="7">
        </div>
      `;
    } else if (type === 'score_threshold') {
      return `
        <div class="form-group">
          <label>Condition</label>
          <select id="triggerCondition" class="form-control">
            <option value="greater_than" ${trigger.condition === 'greater_than' ? 'selected' : ''}>Greater Than</option>
            <option value="less_than" ${trigger.condition === 'less_than' ? 'selected' : ''}>Less Than</option>
            <option value="equals" ${trigger.condition === 'equals' ? 'selected' : ''}>Equals</option>
          </select>
        </div>
        <div class="form-group">
          <label>Score</label>
          <input type="number" id="triggerValue" class="form-control" value="${trigger.value || ''}" placeholder="50" min="0" max="100">
        </div>
      `;
    }

    return '';
  }

  /**
   * Render actions list
   * @param {Array} actions - Actions array
   * @returns {string} HTML
   */
  renderActionsList(actions) {
    if (!actions || actions.length === 0) {
      return '<p>No actions. Add one to get started.</p>';
    }

    return actions.map((action, index) => `
      <div class="action-item" data-action-index="${index}">
        <div class="action-item-header">
          <span>Action ${index + 1}: ${action.type}</span>
          <button class="btn btn-xs btn-danger remove-action" data-index="${index}">Remove</button>
        </div>
        <div class="action-item-config">
          ${this.renderActionConfig(action, index)}
        </div>
      </div>
    `).join('');
  }

  /**
   * Render action configuration
   * @param {Object} action - Action definition
   * @param {number} index - Action index
   * @returns {string} HTML
   */
  renderActionConfig(action, index) {
    const type = action.type || 'update_field';

    if (type === 'update_field') {
      return `
        <div class="form-group">
          <label>Field</label>
          <input type="text" class="form-control action-field" data-index="${index}" value="${this.escapeHtml(action.field || '')}">
        </div>
        <div class="form-group">
          <label>Value</label>
          <input type="text" class="form-control action-value" data-index="${index}" value="${this.escapeHtml(action.value || '')}">
        </div>
      `;
    } else if (type === 'add_note') {
      return `
        <div class="form-group">
          <label>Message</label>
          <textarea class="form-control action-message" data-index="${index}" rows="2">${this.escapeHtml(action.message || '')}</textarea>
        </div>
      `;
    } else if (type === 'notification') {
      return `
        <div class="form-group">
          <label>Message</label>
          <textarea class="form-control action-message" data-index="${index}" rows="2">${this.escapeHtml(action.message || '')}</textarea>
        </div>
      `;
    }

    return '';
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // New workflow
    const newBtn = document.getElementById('newWorkflowBtn');
    if (newBtn) {
      newBtn.addEventListener('click', () => this.startNewWorkflow());
    }

    // Save workflow
    const saveBtn = document.getElementById('saveWorkflowBtn');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => this.saveWorkflow());
    }

    // Cancel
    const cancelBtn = document.getElementById('cancelWorkflowBtn');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => this.cancelEdit());
    }

    // Edit workflow
    this.container.querySelectorAll('.edit-workflow').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.dataset.id;
        this.editWorkflow(id);
      });
    });

    // Toggle workflow
    this.container.querySelectorAll('.toggle-workflow').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.dataset.id;
        this.toggleWorkflow(id);
      });
    });

    // Delete workflow
    this.container.querySelectorAll('.delete-workflow').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.dataset.id;
        this.deleteWorkflow(id);
      });
    });

    // Trigger type change
    const triggerType = document.getElementById('triggerType');
    if (triggerType) {
      triggerType.addEventListener('change', () => this.updateTriggerConfig());
    }

    // Add action
    const addActionBtn = document.getElementById('addActionBtn');
    if (addActionBtn) {
      addActionBtn.addEventListener('click', () => this.addAction());
    }
  }

  /**
   * Start new workflow
   */
  startNewWorkflow() {
    this.currentWorkflow = {
      name: '',
      enabled: true,
      trigger: { type: 'field_change', field: '', condition: 'equals', value: '' },
      actions: []
    };
    this.isEditing = false;
    this.showEditor();
  }

  /**
   * Edit workflow
   * @param {string} workflowId - Workflow ID
   */
  editWorkflow(workflowId) {
    if (!this.options.workflowEngine) return;

    const workflow = this.options.workflowEngine.getWorkflow(workflowId);
    if (!workflow) return;

    this.currentWorkflow = { ...workflow };
    this.isEditing = true;
    this.showEditor();
  }

  /**
   * Show editor
   */
  showEditor() {
    const editor = document.getElementById('workflowEditor');
    const empty = document.getElementById('workflowEmpty');
    const saveBtn = document.getElementById('saveWorkflowBtn');
    const cancelBtn = document.getElementById('cancelWorkflowBtn');

    if (editor) editor.style.display = 'block';
    if (empty) empty.style.display = 'none';
    if (saveBtn) saveBtn.style.display = 'block';
    if (cancelBtn) cancelBtn.style.display = 'block';

    // Re-render editor
    if (editor) {
      editor.innerHTML = this.renderWorkflowEditor();
      this.setupEventListeners();
    }
  }

  /**
   * Save workflow
   */
  saveWorkflow() {
    if (!this.options.workflowEngine) return;

    const name = document.getElementById('workflowName')?.value;
    const enabled = document.getElementById('workflowEnabled')?.checked;
    const triggerType = document.getElementById('triggerType')?.value;
    const triggerField = document.getElementById('triggerField')?.value;
    const triggerCondition = document.getElementById('triggerCondition')?.value;
    const triggerValue = document.getElementById('triggerValue')?.value;

    if (!name) {
      if (typeof showCRMMessage === 'function') {
        showCRMMessage('Workflow name is required', 'error');
      }
      return;
    }

    const workflow = {
      name,
      enabled: enabled !== false,
      trigger: {
        type: triggerType,
        field: triggerField || undefined,
        condition: triggerCondition,
        value: triggerValue
      },
      actions: this.collectActions()
    };

    if (this.isEditing && this.currentWorkflow.id) {
      this.options.workflowEngine.updateWorkflow(this.currentWorkflow.id, workflow);
    } else {
      this.options.workflowEngine.createWorkflow(workflow);
    }

    if (this.options.onSave) {
      this.options.onSave(workflow);
    }

    this.cancelEdit();
    this.render();
  }

  /**
   * Collect actions from form
   * @returns {Array} Actions array
   */
  collectActions() {
    const actions = [];
    const actionItems = this.container.querySelectorAll('.action-item');
    
    actionItems.forEach(item => {
      const index = item.dataset.actionIndex;
      const type = item.querySelector('.action-item-header span')?.textContent.match(/Action \d+: (\w+)/)?.[1];
      
      if (type === 'update_field') {
        const field = item.querySelector('.action-field')?.value;
        const value = item.querySelector('.action-value')?.value;
        if (field) {
          actions.push({ type, field, value });
        }
      } else if (type === 'add_note' || type === 'notification') {
        const message = item.querySelector('.action-message')?.value;
        if (message) {
          actions.push({ type, message });
        }
      }
    });

    return actions;
  }

  /**
   * Add action
   */
  addAction() {
    if (!this.currentWorkflow) return;

    const actionType = prompt('Action type (update_field, add_note, notification):');
    if (!actionType) return;

    if (!this.currentWorkflow.actions) {
      this.currentWorkflow.actions = [];
    }

    this.currentWorkflow.actions.push({
      type: actionType,
      field: '',
      value: '',
      message: ''
    });

    // Re-render editor
    const editor = document.getElementById('workflowEditor');
    if (editor) {
      editor.innerHTML = this.renderWorkflowEditor();
      this.setupEventListeners();
    }
  }

  /**
   * Cancel edit
   */
  cancelEdit() {
    this.currentWorkflow = null;
    this.isEditing = false;

    const editor = document.getElementById('workflowEditor');
    const empty = document.getElementById('workflowEmpty');
    const saveBtn = document.getElementById('saveWorkflowBtn');
    const cancelBtn = document.getElementById('cancelWorkflowBtn');

    if (editor) editor.style.display = 'none';
    if (empty) empty.style.display = 'block';
    if (saveBtn) saveBtn.style.display = 'none';
    if (cancelBtn) cancelBtn.style.display = 'none';
  }

  /**
   * Toggle workflow
   * @param {string} workflowId - Workflow ID
   */
  toggleWorkflow(workflowId) {
    if (!this.options.workflowEngine) return;

    const workflow = this.options.workflowEngine.getWorkflow(workflowId);
    if (workflow) {
      this.options.workflowEngine.toggleWorkflow(workflowId, !workflow.enabled);
      this.render();
    }
  }

  /**
   * Delete workflow
   * @param {string} workflowId - Workflow ID
   */
  deleteWorkflow(workflowId) {
    if (!confirm('Are you sure you want to delete this workflow?')) return;

    if (this.options.workflowEngine) {
      this.options.workflowEngine.deleteWorkflow(workflowId);
      this.render();
    }
  }

  /**
   * Update trigger config
   */
  updateTriggerConfig() {
    const triggerType = document.getElementById('triggerType')?.value;
    const configDiv = document.getElementById('triggerConfig');
    
    if (configDiv && this.currentWorkflow) {
      this.currentWorkflow.trigger = {
        type: triggerType,
        field: '',
        condition: 'equals',
        value: ''
      };
      configDiv.innerHTML = this.renderTriggerConfig(this.currentWorkflow.trigger);
    }
  }

  /**
   * Escape HTML
   * @param {string} str - String to escape
   * @returns {string} Escaped string
   */
  escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { WorkflowDesigner };
}

// Make available globally
if (typeof window !== 'undefined') {
  window.WorkflowDesigner = WorkflowDesigner;
}
