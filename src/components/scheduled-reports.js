/**
 * Scheduled Reports Component (Phase 3 Remaining)
 * Schedule and manage automated report generation
 */

class ScheduledReports {
  constructor(options = {}) {
    this.options = {
      storageKey: options.storageKey || 'crm_scheduled_reports',
      onSchedule: options.onSchedule || null,
      ...options
    };
    
    this.scheduledReports = this.loadScheduledReports();
  }

  /**
   * Schedule a report
   * @param {Object} reportConfig - Report configuration
   */
  scheduleReport(reportConfig) {
    if (!reportConfig.name || !reportConfig.frequency) {
      console.warn('ScheduledReports: Name and frequency required');
      return false;
    }

    const schedule = {
      id: `schedule_${Date.now()}`,
      name: reportConfig.name,
      frequency: reportConfig.frequency, // 'daily', 'weekly', 'monthly'
      time: reportConfig.time || '09:00', // HH:MM format
      dayOfWeek: reportConfig.dayOfWeek || null, // 0-6 for weekly
      dayOfMonth: reportConfig.dayOfMonth || null, // 1-31 for monthly
      reportType: reportConfig.reportType || 'kpi', // 'kpi', 'custom', 'export'
      reportConfig: reportConfig.reportConfig || {},
      recipients: reportConfig.recipients || [],
      enabled: reportConfig.enabled !== false,
      createdAt: new Date().toISOString(),
      lastRun: null,
      nextRun: this.calculateNextRun(reportConfig),
      ...reportConfig
    };

    this.scheduledReports.push(schedule);
    this.saveScheduledReports();
    this.startScheduler();

    if (this.options.onSchedule) {
      this.options.onSchedule(schedule);
    }

    console.log('ScheduledReports: Report scheduled:', schedule.name);
    return true;
  }

  /**
   * Calculate next run time
   * @param {Object} config - Schedule configuration
   * @returns {Date} Next run date
   */
  calculateNextRun(config) {
    const now = new Date();
    const [hours, minutes] = (config.time || '09:00').split(':').map(Number);
    
    let nextRun = new Date();
    nextRun.setHours(hours, minutes, 0, 0);

    switch (config.frequency) {
      case 'daily':
        // If time has passed today, schedule for tomorrow
        if (nextRun <= now) {
          nextRun.setDate(nextRun.getDate() + 1);
        }
        break;
      
      case 'weekly':
        // Schedule for next occurrence of dayOfWeek
        const targetDay = config.dayOfWeek !== null ? config.dayOfWeek : now.getDay();
        const daysUntilTarget = (targetDay - now.getDay() + 7) % 7;
        if (daysUntilTarget === 0 && nextRun <= now) {
          nextRun.setDate(nextRun.getDate() + 7);
        } else {
          nextRun.setDate(nextRun.getDate() + daysUntilTarget);
        }
        break;
      
      case 'monthly':
        // Schedule for next occurrence of dayOfMonth
        const targetDayOfMonth = config.dayOfMonth !== null ? config.dayOfMonth : 1;
        if (now.getDate() >= targetDayOfMonth || nextRun <= now) {
          nextRun.setMonth(nextRun.getMonth() + 1);
        }
        nextRun.setDate(targetDayOfMonth);
        break;
      
      default:
        // Default to daily
        if (nextRun <= now) {
          nextRun.setDate(nextRun.getDate() + 1);
        }
    }

    return nextRun.toISOString();
  }

  /**
   * Start scheduler (check for due reports)
   */
  startScheduler() {
    // Clear existing interval
    if (this.schedulerInterval) {
      clearInterval(this.schedulerInterval);
    }

    // Check every minute for due reports
    this.schedulerInterval = setInterval(() => {
      this.checkScheduledReports();
    }, 60000); // Check every minute

    // Also check immediately
    this.checkScheduledReports();
  }

  /**
   * Check for due reports and execute
   */
  async checkScheduledReports() {
    const now = new Date();
    const dueReports = this.scheduledReports.filter(schedule => {
      if (!schedule.enabled) return false;
      const nextRun = new Date(schedule.nextRun);
      return nextRun <= now;
    });

    for (const schedule of dueReports) {
      await this.executeScheduledReport(schedule);
    }
  }

  /**
   * Execute a scheduled report
   * @param {Object} schedule - Schedule configuration
   */
  async executeScheduledReport(schedule) {
    try {
      console.log('ScheduledReports: Executing report:', schedule.name);

      // Generate report based on type
      let reportData = null;
      
      if (schedule.reportType === 'kpi' && typeof renderKPIDashboard === 'function') {
        // Generate KPI report
        reportData = await this.generateKPIReport(schedule.reportConfig);
      } else if (schedule.reportType === 'custom' && typeof reportBuilder !== 'undefined' && reportBuilder) {
        // Generate custom report
        reportData = await this.generateCustomReport(schedule.reportConfig);
      } else if (schedule.reportType === 'export' && typeof exportReports === 'function') {
        // Generate export
        reportData = await this.generateExportReport(schedule.reportConfig);
      }

      // Send to recipients (if configured)
      if (schedule.recipients && schedule.recipients.length > 0) {
        await this.sendReportToRecipients(schedule, reportData);
      }

      // Update schedule
      schedule.lastRun = new Date().toISOString();
      schedule.nextRun = this.calculateNextRun(schedule);
      this.saveScheduledReports();

      console.log('ScheduledReports: Report executed:', schedule.name);
    } catch (error) {
      console.error('ScheduledReports: Error executing report:', error);
    }
  }

  /**
   * Generate KPI report
   * @param {Object} config - Report configuration
   * @returns {Promise<Object>} Report data
   */
  async generateKPIReport(config) {
    // This would call the actual KPI dashboard generation
    // For now, return a placeholder
    return {
      type: 'kpi',
      generatedAt: new Date().toISOString(),
      data: {}
    };
  }

  /**
   * Generate custom report
   * @param {Object} config - Report configuration
   * @returns {Promise<Object>} Report data
   */
  async generateCustomReport(config) {
    // This would call the report builder
    return {
      type: 'custom',
      generatedAt: new Date().toISOString(),
      data: {}
    };
  }

  /**
   * Generate export report
   * @param {Object} config - Report configuration
   * @returns {Promise<Object>} Report data
   */
  async generateExportReport(config) {
    // This would call the export function
    return {
      type: 'export',
      generatedAt: new Date().toISOString(),
      data: {}
    };
  }

  /**
   * Send report to recipients
   * @param {Object} schedule - Schedule configuration
   * @param {Object} reportData - Report data
   */
  async sendReportToRecipients(schedule, reportData) {
    // In a real implementation, this would send emails or notifications
    console.log('ScheduledReports: Would send report to:', schedule.recipients);
    // Placeholder for email/notification service integration
  }

  /**
   * Delete a scheduled report
   * @param {string} scheduleId - Schedule ID
   */
  deleteSchedule(scheduleId) {
    const index = this.scheduledReports.findIndex(s => s.id === scheduleId);
    if (index < 0) {
      console.warn('ScheduledReports: Schedule not found:', scheduleId);
      return false;
    }

    this.scheduledReports.splice(index, 1);
    this.saveScheduledReports();
    console.log('ScheduledReports: Schedule deleted:', scheduleId);
    return true;
  }

  /**
   * Toggle schedule enabled state
   * @param {string} scheduleId - Schedule ID
   */
  toggleSchedule(scheduleId) {
    const schedule = this.scheduledReports.find(s => s.id === scheduleId);
    if (!schedule) {
      console.warn('ScheduledReports: Schedule not found:', scheduleId);
      return false;
    }

    schedule.enabled = !schedule.enabled;
    this.saveScheduledReports();
    
    if (schedule.enabled) {
      this.startScheduler();
    }
    
    return true;
  }

  /**
   * Render scheduled reports UI
   * @param {HTMLElement} container - Container element
   */
  render(container) {
    if (!container) return;

    container.innerHTML = `
      <div class="scheduled-reports-container">
        <div class="scheduled-reports-header">
          <h3>Scheduled Reports</h3>
          <button class="btn btn-sm btn-primary" id="scheduleNewReportBtn">Schedule New Report</button>
        </div>
        
        <div class="scheduled-reports-list">
          ${this.renderScheduledReportsList()}
        </div>
        
        <div id="scheduleReportModal" class="modal" style="display: none;">
          <div class="modal-content">
            <div class="modal-header">
              <h4>Schedule Report</h4>
              <button class="modal-close" onclick="this.closest('.modal').style.display='none'">×</button>
            </div>
            <div class="modal-body">
              ${this.renderScheduleForm()}
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" onclick="document.getElementById('scheduleReportModal').style.display='none'">Cancel</button>
              <button class="btn btn-primary" id="confirmScheduleBtn">Schedule</button>
            </div>
          </div>
        </div>
      </div>
    `;

    this.setupEventListeners(container);
  }

  /**
   * Render scheduled reports list
   * @returns {string} HTML string
   */
  renderScheduledReportsList() {
    if (this.scheduledReports.length === 0) {
      return '<p style="color: var(--text-secondary); padding: 20px; text-align: center;">No scheduled reports. Schedule reports to receive automated updates.</p>';
    }

    return this.scheduledReports.map(schedule => {
      const nextRun = new Date(schedule.nextRun);
      const lastRun = schedule.lastRun ? new Date(schedule.lastRun) : null;
      
      return `
        <div class="scheduled-report-item ${schedule.enabled ? 'enabled' : 'disabled'}" data-schedule-id="${schedule.id}">
          <div class="scheduled-report-info">
            <div class="scheduled-report-header">
              <span class="scheduled-report-name">${this.escapeHtml(schedule.name)}</span>
              <span class="scheduled-report-status ${schedule.enabled ? 'enabled' : 'disabled'}">
                ${schedule.enabled ? '● Active' : '○ Inactive'}
              </span>
            </div>
            <div class="scheduled-report-meta">
              <span>Frequency: ${this.escapeHtml(schedule.frequency)}</span>
              <span>Time: ${this.escapeHtml(schedule.time)}</span>
              <span>Next Run: ${nextRun.toLocaleString()}</span>
              ${lastRun ? `<span>Last Run: ${lastRun.toLocaleString()}</span>` : ''}
            </div>
          </div>
          <div class="scheduled-report-actions">
            <button class="btn btn-xs btn-secondary" onclick="this.closest('.scheduled-reports-container').__scheduledReports?.toggleSchedule('${schedule.id}')">
              ${schedule.enabled ? 'Disable' : 'Enable'}
            </button>
            <button class="btn btn-xs btn-danger" onclick="this.closest('.scheduled-reports-container').__scheduledReports?.deleteSchedule('${schedule.id}')">Delete</button>
          </div>
        </div>
      `;
    }).join('');
  }

  /**
   * Render schedule form
   * @returns {string} HTML string
   */
  renderScheduleForm() {
    return `
      <div class="form-group">
        <label>Report Name</label>
        <input type="text" id="scheduleNameInput" class="form-control" placeholder="Daily KPI Report">
      </div>
      <div class="form-group">
        <label>Frequency</label>
        <select id="scheduleFrequencySelect" class="form-control">
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
        </select>
      </div>
      <div class="form-group">
        <label>Time</label>
        <input type="time" id="scheduleTimeInput" class="form-control" value="09:00">
      </div>
      <div class="form-group" id="weeklyOptions" style="display: none;">
        <label>Day of Week</label>
        <select id="scheduleDayOfWeekSelect" class="form-control">
          <option value="0">Sunday</option>
          <option value="1">Monday</option>
          <option value="2">Tuesday</option>
          <option value="3">Wednesday</option>
          <option value="4">Thursday</option>
          <option value="5">Friday</option>
          <option value="6">Saturday</option>
        </select>
      </div>
      <div class="form-group" id="monthlyOptions" style="display: none;">
        <label>Day of Month</label>
        <input type="number" id="scheduleDayOfMonthInput" class="form-control" min="1" max="31" value="1">
      </div>
      <div class="form-group">
        <label>Report Type</label>
        <select id="scheduleReportTypeSelect" class="form-control">
          <option value="kpi">KPI Dashboard</option>
          <option value="custom">Custom Report</option>
          <option value="export">Data Export</option>
        </select>
      </div>
    `;
  }

  /**
   * Setup event listeners
   * @param {HTMLElement} container - Container element
   */
  setupEventListeners(container) {
    // Store reference
    const reportsContainer = container.querySelector('.scheduled-reports-container');
    if (reportsContainer) {
      reportsContainer.__scheduledReports = this;
    }

    // Schedule new report button
    const scheduleBtn = document.getElementById('scheduleNewReportBtn');
    if (scheduleBtn) {
      scheduleBtn.addEventListener('click', () => {
        const modal = document.getElementById('scheduleReportModal');
        if (modal) {
          modal.style.display = 'block';
        }
      });
    }

    // Frequency change handler
    const frequencySelect = document.getElementById('scheduleFrequencySelect');
    if (frequencySelect) {
      frequencySelect.addEventListener('change', (e) => {
        const weeklyOptions = document.getElementById('weeklyOptions');
        const monthlyOptions = document.getElementById('monthlyOptions');
        if (weeklyOptions) weeklyOptions.style.display = e.target.value === 'weekly' ? 'block' : 'none';
        if (monthlyOptions) monthlyOptions.style.display = e.target.value === 'monthly' ? 'block' : 'none';
      });
    }

    // Confirm schedule button
    const confirmBtn = document.getElementById('confirmScheduleBtn');
    if (confirmBtn) {
      confirmBtn.addEventListener('click', () => {
        const name = document.getElementById('scheduleNameInput')?.value;
        const frequency = document.getElementById('scheduleFrequencySelect')?.value;
        const time = document.getElementById('scheduleTimeInput')?.value;
        const dayOfWeek = document.getElementById('scheduleDayOfWeekSelect')?.value;
        const dayOfMonth = document.getElementById('scheduleDayOfMonthInput')?.value;
        const reportType = document.getElementById('scheduleReportTypeSelect')?.value;

        if (!name || !frequency) {
          alert('Please fill in all required fields');
          return;
        }

        this.scheduleReport({
          name,
          frequency,
          time,
          dayOfWeek: frequency === 'weekly' ? parseInt(dayOfWeek) : null,
          dayOfMonth: frequency === 'monthly' ? parseInt(dayOfMonth) : null,
          reportType
        });

        const modal = document.getElementById('scheduleReportModal');
        if (modal) modal.style.display = 'none';
        
        // Re-render list
        const listContainer = container.querySelector('.scheduled-reports-list');
        if (listContainer) {
          listContainer.innerHTML = this.renderScheduledReportsList();
          this.setupEventListeners(container);
        }
      });
    }
  }

  /**
   * Load scheduled reports from storage
   * @returns {Array} Scheduled reports
   */
  loadScheduledReports() {
    try {
      const saved = localStorage.getItem(this.options.storageKey);
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('ScheduledReports: Error loading schedules:', error);
      return [];
    }
  }

  /**
   * Save scheduled reports to storage
   */
  saveScheduledReports() {
    try {
      localStorage.setItem(this.options.storageKey, JSON.stringify(this.scheduledReports));
    } catch (error) {
      console.error('ScheduledReports: Error saving schedules:', error);
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
  module.exports = { ScheduledReports };
}

// Make available globally
if (typeof window !== 'undefined') {
  window.ScheduledReports = ScheduledReports;
}
