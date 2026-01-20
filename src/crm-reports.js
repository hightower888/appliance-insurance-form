/**
 * CRM Reports Module
 * Handles KPI calculations and reporting
 */

// Chart instances storage
const chartInstances = {};

/**
 * Get database reference
 */
function getDatabase() {
  const db = database || window.database;
  if (!db) {
    throw new Error('Database not initialized. Please refresh the page.');
  }
  return db;
}

/**
 * Create pie chart for disposition breakdown
 */
function createDispositionPieChart(data, containerId) {
  const canvas = document.getElementById(containerId);
  if (!canvas || typeof Chart === 'undefined') {
    console.warn('Chart.js not available or container not found');
    return null;
  }

  // Destroy existing chart if it exists
  if (chartInstances[containerId]) {
    try {
      chartInstances[containerId].destroy();
    } catch (e) {
      console.warn('Error destroying existing chart:', e);
    }
  }

  // Prepare data - filter out zero values for cleaner chart
  const labels = [];
  const values = [];
  const colors = [];
  const colorMap = {
    'interested': '#10b981',      // green
    'not_interested': '#ef4444',  // red
    'no_answer': '#f59e0b',       // amber
    'call_back': '#3b82f6',       // blue
    'other': '#8b5cf6',           // purple
    'none': '#6b7280'             // gray
  };

  Object.keys(data.counts).forEach(key => {
    if (data.counts[key] > 0) {
      labels.push(key.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()));
      values.push(data.counts[key]);
      colors.push(colorMap[key] || '#6b7280');
    }
  });

  if (values.length === 0) {
    console.warn('No data to display in pie chart');
    return null;
  }

  const ctx = canvas.getContext('2d');
  const chart = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: labels,
      datasets: [{
        data: values,
        backgroundColor: colors,
        borderWidth: 2,
        borderColor: '#ffffff'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            padding: 15,
            font: {
              size: 12
            },
            usePointStyle: true
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const label = context.label || '';
              const value = context.parsed || 0;
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
              return `${label}: ${value} (${percentage}%)`;
            }
          }
        }
      }
    }
  });

  chartInstances[containerId] = chart;
  return chart;
}

/**
 * Create bar chart for conversion trends
 */
function createConversionBarChart(data, containerId) {
  const canvas = document.getElementById(containerId);
  if (!canvas || typeof Chart === 'undefined') {
    console.warn('Chart.js not available or container not found');
    return null;
  }

  if (chartInstances[containerId]) {
    try {
      chartInstances[containerId].destroy();
    } catch (e) {
      console.warn('Error destroying existing chart:', e);
    }
  }

  if (!data.labels || data.labels.length === 0 || !data.values || data.values.length === 0) {
    console.warn('No data to display in bar chart');
    return null;
  }

  const ctx = canvas.getContext('2d');
  const chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: data.labels,
      datasets: [{
        label: 'Conversions',
        data: data.values,
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: '#2563eb',
        borderWidth: 2,
        borderRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          padding: 12,
          titleFont: {
            size: 14,
            weight: 'bold'
          },
          bodyFont: {
            size: 13
          },
          callbacks: {
            label: function(context) {
              return `Conversions: ${context.parsed.y}`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1,
            precision: 0
          },
          grid: {
            color: 'rgba(0, 0, 0, 0.05)'
          }
        },
        x: {
          grid: {
            display: false
          }
        }
      }
    }
  });

  chartInstances[containerId] = chart;
  return chart;
}

/**
 * Create line chart for lead acquisition
 */
function createAcquisitionLineChart(data, containerId) {
  const canvas = document.getElementById(containerId);
  if (!canvas || typeof Chart === 'undefined') {
    console.warn('Chart.js not available or container not found');
    return null;
  }

  if (chartInstances[containerId]) {
    try {
      chartInstances[containerId].destroy();
    } catch (e) {
      console.warn('Error destroying existing chart:', e);
    }
  }

  if (!data.labels || data.labels.length === 0 || !data.values || data.values.length === 0) {
    console.warn('No data to display in line chart');
    return null;
  }

  const ctx = canvas.getContext('2d');
  const chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: data.labels,
      datasets: [{
        label: 'New Leads',
        data: data.values,
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: '#10b981',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      interaction: {
        mode: 'index',
        intersect: false
      },
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: {
            padding: 15,
            font: {
              size: 12
            },
            usePointStyle: true
          }
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          padding: 12,
          titleFont: {
            size: 14,
            weight: 'bold'
          },
          bodyFont: {
            size: 13
          },
          mode: 'index',
          intersect: false,
          callbacks: {
            label: function(context) {
              return `New Leads: ${context.parsed.y}`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1,
            precision: 0
          },
          grid: {
            color: 'rgba(0, 0, 0, 0.05)'
          }
        },
        x: {
          grid: {
            display: false
          }
        }
      }
    }
  });

  chartInstances[containerId] = chart;
  return chart;
}

/**
 * Calculate lead conversion rate
 */
async function calculateConversionRate(filters = {}) {
  try {
    const db = getDatabase();
    const salesRef = db.ref('sales');
    const snapshot = await salesRef.once('value');
    
    let totalLeads = 0;
    let interestedLeads = 0;
    
    if (snapshot.exists()) {
      snapshot.forEach((childSnapshot) => {
        const saleData = childSnapshot.val();
        
        // Apply filters
        if (filters.dateFrom && saleData.timestamp < filters.dateFrom) return;
        if (filters.dateTo && saleData.timestamp > filters.dateTo) return;
        if (filters.agent && saleData.agentEmail !== filters.agent) return;
        
        // Count as lead if not converted
        const isLead = !saleData.submittedAt || 
                      saleData.leadStatus === 'new' || 
                      saleData.leadStatus === 'contacted' || 
                      saleData.leadStatus === 'dispositioned';
        
        if (isLead) {
          totalLeads++;
          if (saleData.disposition === 'interested') {
            interestedLeads++;
          }
        }
      });
    }
    
    const rate = totalLeads > 0 ? (interestedLeads / totalLeads) * 100 : 0;
    
    return {
      rate: rate.toFixed(2),
      interested: interestedLeads,
      total: totalLeads
    };
  } catch (error) {
    console.error('Error calculating conversion rate:', error);
    throw error;
  }
}

/**
 * Calculate disposition breakdown
 */
async function calculateDispositionBreakdown(filters = {}) {
  try {
    const db = getDatabase();
    const salesRef = db.ref('sales');
    const snapshot = await salesRef.once('value');
    
    const breakdown = {
      no_answer: 0,
      not_interested: 0,
      interested: 0,
      call_back: 0,
      other: 0,
      none: 0
    };
    
    let total = 0;
    
    if (snapshot.exists()) {
      snapshot.forEach((childSnapshot) => {
        const saleData = childSnapshot.val();
        
        // Apply filters
        if (filters.dateFrom && saleData.timestamp < filters.dateFrom) return;
        if (filters.dateTo && saleData.timestamp > filters.dateTo) return;
        
        if (saleData.disposition) {
          breakdown[saleData.disposition] = (breakdown[saleData.disposition] || 0) + 1;
          total++;
        } else {
          breakdown.none++;
          total++;
        }
      });
    }
    
    // Calculate percentages
    const percentages = {};
    Object.keys(breakdown).forEach(key => {
      percentages[key] = total > 0 ? ((breakdown[key] / total) * 100).toFixed(2) : '0.00';
    });
    
    return {
      counts: breakdown,
      percentages: percentages,
      total: total
    };
  } catch (error) {
    console.error('Error calculating disposition breakdown:', error);
    throw error;
  }
}

/**
 * Get conversion trend data for bar chart
 */
async function getConversionTrendData(filters = {}) {
  try {
    const db = getDatabase();
    const salesRef = db.ref('sales');
    const snapshot = await salesRef.once('value');
    
    // Group by week or month
    const trendData = {};
    
    if (snapshot.exists()) {
      snapshot.forEach((childSnapshot) => {
        const saleData = childSnapshot.val();
        
        // Apply filters
        if (filters.dateFrom && saleData.timestamp < filters.dateFrom) return;
        if (filters.dateTo && saleData.timestamp > filters.dateTo) return;
        if (filters.agent && saleData.agentEmail !== filters.agent) return;
        
        // Only count conversions
        if (saleData.submittedAt || saleData.leadStatus === 'converted') {
          const date = new Date(saleData.submittedAt || saleData.timestamp);
          const weekKey = `${date.getFullYear()}-W${getWeekNumber(date)}`;
          
          if (!trendData[weekKey]) {
            trendData[weekKey] = 0;
          }
          trendData[weekKey]++;
        }
      });
    }
    
    // Sort by date and format for chart
    const sortedKeys = Object.keys(trendData).sort();
    const labels = sortedKeys.map(key => {
      const [year, week] = key.split('-W');
      return `Week ${week}, ${year}`;
    });
    const values = sortedKeys.map(key => trendData[key]);
    
    return { labels, values };
  } catch (error) {
    console.error('Error getting conversion trend data:', error);
    return { labels: [], values: [] };
  }
}

/**
 * Get week number for date
 */
function getWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

/**
 * Get lead acquisition data for line chart
 */
async function getAcquisitionTrendData(filters = {}) {
  try {
    const db = getDatabase();
    const salesRef = db.ref('sales');
    const snapshot = await salesRef.once('value');
    
    const trendData = {};
    
    if (snapshot.exists()) {
      snapshot.forEach((childSnapshot) => {
        const saleData = childSnapshot.val();
        
        // Apply filters
        if (filters.dateFrom && saleData.timestamp < filters.dateFrom) return;
        if (filters.dateTo && saleData.timestamp > filters.dateTo) return;
        if (filters.agent && saleData.agentEmail !== filters.agent) return;
        
        // Count all leads (new or any lead status)
        const isLead = !saleData.submittedAt || 
                      saleData.leadStatus === 'new' || 
                      saleData.leadStatus === 'contacted' || 
                      saleData.leadStatus === 'dispositioned' ||
                      (!saleData.leadStatus && !saleData.submittedAt);
        
        if (isLead) {
          const date = new Date(saleData.timestamp || saleData.createdAt);
          const weekKey = `${date.getFullYear()}-W${getWeekNumber(date)}`;
          
          if (!trendData[weekKey]) {
            trendData[weekKey] = 0;
          }
          trendData[weekKey]++;
        }
      });
    }
    
    // Sort by date and format for chart
    const sortedKeys = Object.keys(trendData).sort();
    const labels = sortedKeys.map(key => {
      const [year, week] = key.split('-W');
      return `Week ${week}, ${year}`;
    });
    const values = sortedKeys.map(key => trendData[key]);
    
    return { labels, values };
  } catch (error) {
    console.error('Error getting acquisition trend data:', error);
    return { labels: [], values: [] };
  }
}

/**
 * Calculate acquisition metrics
 */
async function calculateAcquisitionMetrics(filters = {}) {
  try {
    const db = getDatabase();
    const salesRef = db.ref('sales');
    const snapshot = await salesRef.once('value');
    
    let newLeads = 0;
    let conversions = 0;
    let totalTimeToConvert = 0;
    let convertCount = 0;
    
    if (snapshot.exists()) {
      snapshot.forEach((childSnapshot) => {
        const saleData = childSnapshot.val();
        
        // Apply filters
        if (filters.dateFrom && saleData.timestamp < filters.dateFrom) return;
        if (filters.dateTo && saleData.timestamp > filters.dateTo) return;
        if (filters.agent && saleData.agentEmail !== filters.agent) return;
        
        // Count new leads
        if (saleData.leadStatus === 'new' || (!saleData.leadStatus && !saleData.submittedAt)) {
          newLeads++;
        }
        
        // Count conversions
        if (saleData.submittedAt || saleData.leadStatus === 'converted') {
          conversions++;
          
          // Calculate time to convert
          if (saleData.createdAt && saleData.submittedAt) {
            const created = new Date(saleData.createdAt);
            const converted = new Date(saleData.submittedAt);
            const days = (converted - created) / (1000 * 60 * 60 * 24);
            totalTimeToConvert += days;
            convertCount++;
          }
        }
      });
    }
    
    const avgTimeToConvert = convertCount > 0 ? (totalTimeToConvert / convertCount).toFixed(1) : 0;
    const conversionRate = newLeads > 0 ? ((conversions / newLeads) * 100).toFixed(2) : 0;
    
    return {
      newLeads: newLeads,
      conversions: conversions,
      conversionRate: conversionRate,
      avgTimeToConvert: avgTimeToConvert
    };
  } catch (error) {
    console.error('Error calculating acquisition metrics:', error);
    throw error;
  }
}

/**
 * Calculate form completion rate
 */
async function calculateFormCompletionRate(filters = {}) {
  try {
    const db = getDatabase();
    const salesRef = db.ref('sales');
    const snapshot = await salesRef.once('value');
    
    let formStarts = 0;
    let formCompletions = 0;
    
    if (snapshot.exists()) {
      snapshot.forEach((childSnapshot) => {
        const saleData = childSnapshot.val();
        
        // Apply filters
        if (filters.dateFrom && saleData.timestamp < filters.dateFrom) return;
        if (filters.dateTo && saleData.timestamp > filters.dateTo) return;
        
        // Count form starts (leads with pasteToForm called - we'll track this separately)
        // For now, count leads that were dispositioned as interested
        if (saleData.disposition === 'interested') {
          formStarts++;
        }
        
        // Count completions (converted)
        if (saleData.submittedAt || saleData.leadStatus === 'converted') {
          formCompletions++;
        }
      });
    }
    
    const completionRate = formStarts > 0 ? ((formCompletions / formStarts) * 100).toFixed(2) : 0;
    
    return {
      starts: formStarts,
      completions: formCompletions,
      rate: completionRate
    };
  } catch (error) {
    console.error('Error calculating form completion rate:', error);
    throw error;
  }
}

/**
 * Render KPI dashboard
 */
async function renderKPIDashboard() {
  const dashboard = document.getElementById('reportsDashboard');
  const loading = document.getElementById('reportsLoading');
  const kpiCards = document.getElementById('kpiCards');
  const kpiCharts = document.getElementById('kpiCharts');
  
  if (!dashboard) return;

  try {
    if (loading) loading.style.display = 'block';
    if (kpiCards) kpiCards.style.display = 'none';
    if (kpiCharts) kpiCharts.style.display = 'none';

    // Get filters
    const dateFrom = document.getElementById('reportDateFrom')?.value;
    const dateTo = document.getElementById('reportDateTo')?.value;
    
    const filters = {};
    if (dateFrom) filters.dateFrom = new Date(dateFrom).getTime();
    if (dateTo) filters.dateTo = new Date(dateTo).getTime() + 86400000; // Add one day

    // Calculate KPIs
    const conversionRate = await calculateConversionRate(filters);
    const dispositionBreakdown = await calculateDispositionBreakdown(filters);
    const acquisitionMetrics = await calculateAcquisitionMetrics(filters);
    const completionRate = await calculateFormCompletionRate(filters);
    
    // Get trend data for charts
    const conversionTrendData = await getConversionTrendData(filters);
    const acquisitionTrendData = await getAcquisitionTrendData(filters);

    // Render KPI cards
    if (kpiCards) {
      kpiCards.innerHTML = `
        <div class="card">
          <h3>Conversion Rate</h3>
          <p style="font-size: 32px; font-weight: bold; color: var(--primary);">${conversionRate.rate}%</p>
          <p style="color: var(--text-secondary); font-size: 14px;">${conversionRate.interested} of ${conversionRate.total} leads</p>
        </div>
        <div class="card">
          <h3>New Leads</h3>
          <p style="font-size: 32px; font-weight: bold; color: var(--primary);">${acquisitionMetrics.newLeads}</p>
          <p style="color: var(--text-secondary); font-size: 14px;">This period</p>
        </div>
        <div class="card">
          <h3>Conversions</h3>
          <p style="font-size: 32px; font-weight: bold; color: var(--primary);">${acquisitionMetrics.conversions}</p>
          <p style="color: var(--text-secondary); font-size: 14px;">Conversion rate: ${acquisitionMetrics.conversionRate}%</p>
        </div>
        <div class="card">
          <h3>Avg Time to Convert</h3>
          <p style="font-size: 32px; font-weight: bold; color: var(--primary);">${acquisitionMetrics.avgTimeToConvert}</p>
          <p style="color: var(--text-secondary); font-size: 14px;">Days</p>
        </div>
        <div class="card">
          <h3>Form Completion</h3>
          <p style="font-size: 32px; font-weight: bold; color: var(--primary);">${completionRate.rate}%</p>
          <p style="color: var(--text-secondary); font-size: 14px;">${completionRate.completions} of ${completionRate.starts} starts</p>
        </div>
      `;
      kpiCards.style.display = 'grid';
    }

    // Render charts
    if (kpiCharts) {
      // Destroy existing charts before re-rendering
      Object.keys(chartInstances).forEach(chartId => {
        if (chartInstances[chartId]) {
          try {
            chartInstances[chartId].destroy();
          } catch (e) {
            console.warn('Error destroying chart:', e);
          }
          delete chartInstances[chartId];
        }
      });
      
      kpiCharts.innerHTML = `
        <div class="card" style="margin-top: 20px;">
          <h3>Disposition Breakdown</h3>
          <div style="position: relative; height: 300px; margin-top: 15px;">
            <canvas id="dispositionPieChart" aria-label="Disposition breakdown pie chart"></canvas>
          </div>
          <div style="margin-top: 15px;">
            <table style="width: 100%; font-size: 14px;">
              <thead>
                <tr>
                  <th>Disposition</th>
                  <th>Count</th>
                  <th>Percentage</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Interested</td>
                  <td>${dispositionBreakdown.counts.interested}</td>
                  <td>${dispositionBreakdown.percentages.interested}%</td>
                </tr>
                <tr>
                  <td>Not Interested</td>
                  <td>${dispositionBreakdown.counts.not_interested}</td>
                  <td>${dispositionBreakdown.percentages.not_interested}%</td>
                </tr>
                <tr>
                  <td>No Answer</td>
                  <td>${dispositionBreakdown.counts.no_answer}</td>
                  <td>${dispositionBreakdown.percentages.no_answer}%</td>
                </tr>
                <tr>
                  <td>Call Back</td>
                  <td>${dispositionBreakdown.counts.call_back}</td>
                  <td>${dispositionBreakdown.percentages.call_back}%</td>
                </tr>
                <tr>
                  <td>Other</td>
                  <td>${dispositionBreakdown.counts.other}</td>
                  <td>${dispositionBreakdown.percentages.other}%</td>
                </tr>
                <tr>
                  <td>Not Set</td>
                  <td>${dispositionBreakdown.counts.none}</td>
                  <td>${dispositionBreakdown.percentages.none}%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div class="card" style="margin-top: 20px;">
          <h3>Conversion Trends</h3>
          <div style="position: relative; height: 300px; margin-top: 15px;">
            <canvas id="conversionBarChart" aria-label="Conversion trends bar chart"></canvas>
          </div>
        </div>
        <div class="card" style="margin-top: 20px;">
          <h3>Lead Acquisition Timeline</h3>
          <div style="position: relative; height: 300px; margin-top: 15px;">
            <canvas id="acquisitionLineChart" aria-label="Lead acquisition timeline line chart"></canvas>
          </div>
        </div>
      `;
      kpiCharts.style.display = 'block';
      
      // Create all charts after DOM is ready
      setTimeout(() => {
        // Pie chart
        if (dispositionBreakdown && Object.keys(dispositionBreakdown.counts).length > 0) {
          createDispositionPieChart(dispositionBreakdown, 'dispositionPieChart');
        }
        
        // Bar chart (only if we have data)
        if (conversionTrendData && conversionTrendData.labels && conversionTrendData.labels.length > 0) {
          createConversionBarChart(conversionTrendData, 'conversionBarChart');
        } else {
          const barCard = document.getElementById('conversionBarChart')?.closest('.card');
          if (barCard) {
            barCard.innerHTML = `
              <h3>Conversion Trends</h3>
              <p style="color: var(--text-secondary); padding: 20px; text-align: center;">No conversion data available for the selected period.</p>
            `;
          }
        }
        
        // Line chart (only if we have data)
        if (acquisitionTrendData && acquisitionTrendData.labels && acquisitionTrendData.labels.length > 0) {
          createAcquisitionLineChart(acquisitionTrendData, 'acquisitionLineChart');
        } else {
          const lineCard = document.getElementById('acquisitionLineChart')?.closest('.card');
          if (lineCard) {
            lineCard.innerHTML = `
              <h3>Lead Acquisition Timeline</h3>
              <p style="color: var(--text-secondary); padding: 20px; text-align: center;">No acquisition data available for the selected period.</p>
            `;
          }
        }
      }, 200);
    }

    if (loading) loading.style.display = 'none';
  } catch (error) {
    console.error('Error rendering KPI dashboard:', error);
    if (loading) {
      loading.innerHTML = `
        <div style="text-align: center; padding: 20px;">
          <p style="color: #dc2626; margin-bottom: 15px;">Unable to load reports</p>
          <p style="color: var(--text-secondary); font-size: 14px; margin-bottom: 15px;">
            ${error.message.includes('permission') 
              ? 'You may need to log in again. Please refresh the page and try again.' 
              : 'Please check your connection and try again.'}
          </p>
          <button class="btn btn-primary" onclick="if(typeof renderKPIDashboard === 'function') { renderKPIDashboard(); }">Retry</button>
        </div>
      `;
    }
    const errorMsg = error.message.includes('permission') 
      ? 'Permission denied. Please refresh the page and log in again.'
      : 'Error loading reports: ' + error.message;
    showCRMMessage(errorMsg, 'error');
  }
}

/**
 * Export reports to CSV (Enhanced with 160+ fields)
 */
async function exportReports() {
  // Use enhanced export service if available
  if (typeof exportService !== 'undefined') {
    try {
      // Get date filters
      const dateFrom = document.getElementById('reportDateFrom')?.value;
      const dateTo = document.getElementById('reportDateTo')?.value;
      
      // Load all sales for export
      const db = getDatabase();
      const salesRef = db.ref('sales');
      const snapshot = await salesRef.once('value');
      
      let allSales = [];
      if (snapshot.exists()) {
        snapshot.forEach((childSnapshot) => {
          const saleId = childSnapshot.key;
          const saleData = childSnapshot.val();
          
          // Apply date filters if set
          if (dateFrom || dateTo) {
            const saleDate = saleData.timestamp ? new Date(saleData.timestamp) : (saleData.submittedAt ? new Date(saleData.submittedAt) : null);
            if (saleDate) {
              if (dateFrom) {
                const fromDate = new Date(dateFrom);
                fromDate.setHours(0, 0, 0, 0);
                if (saleDate < fromDate) return;
              }
              if (dateTo) {
                const toDate = new Date(dateTo);
                toDate.setHours(23, 59, 59, 999);
                if (saleDate > toDate) return;
              }
            }
          }
          
          allSales.push({
            id: saleId,
            ...saleData
          });
        });
      }
      
      if (allSales.length === 0) {
        showCRMMessage('No data to export for the selected date range', 'error');
        return;
      }
      
      const result = await exportService.exportToCSV(allSales, {
        filename: `crm_reports_export_${new Date().toISOString().split('T')[0]}.csv`
      });
      
      if (typeof showCRMMessage === 'function') {
        showCRMMessage(`Exported ${result.recordCount} records to CSV (160+ fields)`, 'success');
      } else {
        alert(`Exported ${result.recordCount} records to CSV (160+ fields)`);
      }
      return;
    } catch (error) {
      console.error('Error with enhanced export service:', error);
      // Fall back to basic export
    }
  }

  // Fallback to basic export (backward compatibility)
  try {
    const dateFrom = document.getElementById('reportDateFrom')?.value;
    const dateTo = document.getElementById('reportDateTo')?.value;
    
    const db = getDatabase();
    const salesRef = db.ref('sales');
    const snapshot = await salesRef.once('value');
    
    const rows = [];
    const headers = ['Date', 'Customer Name', 'Email', 'Phone', 'Status', 'Disposition', 'Source', 'Agent'];
    rows.push(headers.join(','));
    
    if (snapshot.exists()) {
      snapshot.forEach((childSnapshot) => {
        const saleData = childSnapshot.val();
        
        // Apply date filters
        if (dateFrom || dateTo) {
          const saleDate = saleData.timestamp ? new Date(saleData.timestamp) : (saleData.submittedAt ? new Date(saleData.submittedAt) : null);
          if (saleDate) {
            if (dateFrom) {
              const fromDate = new Date(dateFrom);
              fromDate.setHours(0, 0, 0, 0);
              if (saleDate < fromDate) return;
            }
            if (dateTo) {
              const toDate = new Date(dateTo);
              toDate.setHours(23, 59, 59, 999);
              if (saleDate > toDate) return;
            }
          }
        }
        
        const row = [
          saleData.submittedAt ? new Date(saleData.submittedAt).toLocaleDateString('en-GB') : '',
          saleData.contact?.name || '',
          saleData.contact?.email || '',
          saleData.contact?.phone || '',
          saleData.leadStatus || 'new',
          saleData.disposition || '',
          saleData.leadSource || '',
          saleData.agentEmail || ''
        ].map(val => {
          const str = String(val);
          if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        });
        
        rows.push(row.join(','));
      });
    }
    
    const csvContent = rows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `crm_reports_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    if (typeof showCRMMessage === 'function') {
      showCRMMessage(`Exported ${rows.length - 1} records to CSV`, 'success');
    } else {
      alert(`Exported ${rows.length - 1} records to CSV`);
    }
  } catch (error) {
    console.error('Error exporting reports:', error);
    if (typeof showCRMMessage === 'function') {
      showCRMMessage('Error exporting reports: ' + error.message, 'error');
    } else {
      alert('Error exporting reports: ' + error.message);
    }
  }
}
