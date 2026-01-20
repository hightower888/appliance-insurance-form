/**
 * CRM Leads Module
 * Handles lead upload, cycling, and disposition management
 */

// Note: currentLeadIndex is declared in crm.js to avoid duplicate declaration

/**
 * Cycle to next lead
 */
function cycleToNextLead() {
  if (filteredLeads.length === 0) {
    showCRMMessage('No leads available', 'info');
    return;
  }

  // Ensure we're working with filtered leads
  if (currentLeadIndex >= filteredLeads.length) {
    currentLeadIndex = 0;
  }

  currentLeadIndex = (currentLeadIndex + 1) % filteredLeads.length;
  const lead = filteredLeads[currentLeadIndex];
  
  if (lead) {
    viewLeadDetails(lead.id);
    showCRMMessage(`Lead ${currentLeadIndex + 1} of ${filteredLeads.length}`, 'info');
  }
}

/**
 * Cycle to previous lead
 */
function cycleToPreviousLead() {
  if (filteredLeads.length === 0) {
    showCRMMessage('No leads available', 'info');
    return;
  }

  // Ensure we're working with filtered leads
  if (currentLeadIndex >= filteredLeads.length) {
    currentLeadIndex = filteredLeads.length - 1;
  }

  currentLeadIndex = currentLeadIndex - 1;
  if (currentLeadIndex < 0) {
    currentLeadIndex = filteredLeads.length - 1;
  }
  
  const lead = filteredLeads[currentLeadIndex];
  
  if (lead) {
    viewLeadDetails(lead.id);
    showCRMMessage(`Lead ${currentLeadIndex + 1} of ${filteredLeads.length}`, 'info');
  }
}

/**
 * Get current lead index
 */
function getCurrentLeadIndex() {
  return currentLeadIndex;
}

/**
 * Set disposition for a lead
 */
async function setDisposition() {
  const dispositionSelect = document.getElementById('dispositionSelect');
  if (!dispositionSelect) {
    showCRMMessage('Disposition selector not found', 'error');
    return;
  }

  if (!editingLeadId) {
    showCRMMessage('No lead selected', 'error');
    return;
  }

  const disposition = dispositionSelect.value;
  if (!disposition) {
    showCRMMessage('Please select a disposition', 'error');
    return;
  }

  // Get current user
  let currentUser = null;
  if (typeof getCurrentUser === 'function') {
    currentUser = getCurrentUser();
  }

  if (!currentUser) {
    showCRMMessage('You must be logged in to set disposition', 'error');
    return;
  }

  try {
    const db = getDatabase();
    const leadRef = db.ref(`sales/${editingLeadId}`);
    
    const updates = {
      disposition: disposition,
      dispositionDate: new Date().toISOString(),
      dispositionBy: currentUser.email || currentUser.uid || 'unknown',
      leadStatus: 'dispositioned'
    };

    await leadRef.update(updates);

    // Log activity
    await logActivity('lead_dispositioned', editingLeadId, { disposition });

    showCRMMessage('Disposition set successfully', 'success');
    
    // Update UI
    if (disposition === 'interested') {
      const pasteToFormBtn = document.getElementById('pasteToFormBtn');
      if (pasteToFormBtn) {
        pasteToFormBtn.style.display = 'block';
      }
    }

    // Reload leads
    await loadLeads();
    
    // Refresh modal if open
    if (editingLeadId) {
      await viewLeadDetails(editingLeadId);
    }
    
    // Reset disposition select
    if (dispositionSelect) {
      dispositionSelect.value = '';
    }
  } catch (error) {
    console.error('Error setting disposition:', error);
    showCRMMessage('Error setting disposition: ' + error.message, 'error');
  }
}

/**
 * Upload leads from file (Enhanced with import-service.js)
 */
async function uploadLeadsFromFile() {
  const fileInput = document.getElementById('uploadFileInput');
  if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
    showCRMMessage('Please select a file', 'error');
    return;
  }

  const file = fileInput.files[0];
  
  // Use enhanced import service if available
  if (typeof importService !== 'undefined' && typeof database !== 'undefined') {
    try {
      // Initialize import service
      importService.initialize(database);
      
      // Get current user
      let currentUser = null;
      if (typeof getCurrentUser === 'function') {
        currentUser = getCurrentUser();
      }
      
      // Show progress modal
      const progressModal = showImportProgress(0, 0);
      
      // Import from file
      const result = await importService.importFromFile(file, {
        user: currentUser,
        importToDatabase: true,
        onProgress: (current, total, record) => {
          updateImportProgress(progressModal, current, total);
        }
      });
      
      // Close progress modal
      closeImportProgress(progressModal);
      
      // Show results
      if (result.errorCount > 0) {
        const errorReport = importService.generateErrorReport(result.failed);
        showCRMMessage(`Imported ${result.successCount} records, ${result.errorCount} errors. Check console for details.`, 'error');
        console.error('Import Errors:', errorReport);
      } else {
        showCRMMessage(`Successfully imported ${result.successCount} records`, 'success');
      }
      
      // Reload leads
      if (typeof loadLeads === 'function') {
        await loadLeads();
      }
      
      return;
    } catch (error) {
      console.error('Error with enhanced import service:', error);
      // Fall back to basic import
    }
  }

  // Fallback to basic import (backward compatibility)
  const fileType = file.name.split('.').pop().toLowerCase();

  try {
    let data;
    if (fileType === 'json') {
      const text = await file.text();
      data = JSON.parse(text);
    } else if (fileType === 'csv') {
      const text = await file.text();
      data = parseCSV(text);
    } else {
      showCRMMessage('Unsupported file type. Please use CSV or JSON', 'error');
      return;
    }

    await uploadLeads(data);
  } catch (error) {
    console.error('Error uploading leads:', error);
    showCRMMessage('Error uploading leads: ' + error.message, 'error');
  }
}

/**
 * Show import progress modal
 * @param {number} current - Current progress
 * @param {number} total - Total records
 * @returns {HTMLElement} Modal element
 */
function showImportProgress(current, total) {
  const modal = document.createElement('div');
  modal.className = 'bulk-operations-modal bulk-operations-progress-modal';
  modal.innerHTML = `
    <div class="bulk-operations-modal-content">
      <div class="bulk-operations-modal-header">
        <h3>Importing Records</h3>
      </div>
      <div class="bulk-operations-modal-body">
        <div class="bulk-operations-progress">
          <div class="bulk-operations-progress-bar">
            <div class="bulk-operations-progress-fill" style="width: ${total > 0 ? (current / total) * 100 : 0}%"></div>
          </div>
          <p class="bulk-operations-progress-text">
            Importing ${current} of ${total} records...
          </p>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  return modal;
}

/**
 * Update import progress
 * @param {HTMLElement} modal - Progress modal element
 * @param {number} current - Current progress
 * @param {number} total - Total records
 */
function updateImportProgress(modal, current, total) {
  const fill = modal.querySelector('.bulk-operations-progress-fill');
  const text = modal.querySelector('.bulk-operations-progress-text');
  
  if (fill) {
    fill.style.width = `${total > 0 ? (current / total) * 100 : 0}%`;
  }
  if (text) {
    text.textContent = `Importing ${current} of ${total} records...`;
  }
}

/**
 * Close import progress modal
 * @param {HTMLElement} modal - Progress modal element
 */
function closeImportProgress(modal) {
  if (modal && modal.parentNode) {
    modal.parentNode.removeChild(modal);
  }
}

/**
 * Parse CSV text to array of objects
 */
function parseCSV(text) {
  const lines = text.split('\n');
  if (lines.length < 2) {
    throw new Error('CSV file must have at least a header row and one data row');
  }

  const headers = lines[0].split(',').map(h => h.trim());
  const data = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = line.split(',').map(v => v.trim());
    const obj = {};
    
    headers.forEach((header, index) => {
      obj[header] = values[index] || '';
    });

    data.push(obj);
  }

  return data;
}

/**
 * Upload leads to database
 */
async function uploadLeads(data) {
  if (!Array.isArray(data)) {
    data = [data];
  }

  // Get current user
  let currentUser = null;
  if (typeof getCurrentUser === 'function') {
    currentUser = getCurrentUser();
  }

  if (!currentUser) {
    showCRMMessage('You must be logged in to upload leads', 'error');
    return;
  }

  try {
    const db = getDatabase();
    const salesRef = db.ref('sales');
    
    let successCount = 0;
    let errorCount = 0;

    for (const item of data) {
      try {
        // Transform to sales schema
        const saleData = transformToSalesSchema(item, currentUser);
        const appliances = saleData.appliances || [];
        
        // Remove appliances from saleData (will be added separately)
        delete saleData.appliances;
        
        // Create record
        const newRef = salesRef.push();
        const saleId = newRef.key;
        await newRef.set(saleData);
        
        // Add appliances using relationship manager if available
        if (appliances.length > 0 && typeof ApplianceRelationshipManager !== 'undefined') {
          try {
            const relationshipManager = new ApplianceRelationshipManager(db);
            await relationshipManager.addAppliancesToSale(saleId, appliances);
          } catch (applianceError) {
            console.warn('Error adding appliances, adding to saleData directly:', applianceError);
            // Fallback: add appliances array directly
            await newRef.update({ appliances: appliances });
          }
        } else if (appliances.length > 0) {
          // Fallback: add appliances array directly
          await newRef.update({ appliances: appliances });
        }
        
        successCount++;
      } catch (error) {
        console.error('Error creating lead:', error);
        errorCount++;
      }
    }

    showCRMMessage(`Uploaded ${successCount} leads${errorCount > 0 ? `, ${errorCount} errors` : ''}`, 'success');
    
    // Close modal and reload
    closeUploadModal();
    await loadLeads();
  } catch (error) {
    console.error('Error uploading leads:', error);
    showCRMMessage('Error uploading leads: ' + error.message, 'error');
  }
}

/**
 * Transform data to sales schema
 */
function transformToSalesSchema(data, user) {
  const timestamp = Date.now();
  const now = new Date().toISOString();

  // Handle appliances - can be array or single object
  let appliances = [];
  if (Array.isArray(data.appliances)) {
    appliances = data.appliances;
  } else if (data.appliances && typeof data.appliances === 'object') {
    appliances = [data.appliances];
  } else if (data.applianceType || data.applianceMake) {
    // Single appliance from CSV
    appliances = [{
      type: data.applianceType || data.type || '',
      make: data.applianceMake || data.make || '',
      model: data.applianceModel || data.model || '',
      age: data.applianceAge || data.age || ''
    }];
  }

  return {
    contact: {
      name: data.name || data.contactName || data['Name'] || '',
      phone: data.phone || data.contactPhone || data['Phone Numbers'] || '',
      email: data.email || data.contactEmail || data['Email'] || '',
      address: data.address || data.contactAddress || data['Adress'] || '',
      postcode: data.postcode || data.contactPostcode || data['Postcode'] || ''
    },
    appliances: appliances,
    plan: {
      number: data.planNumber || '',
      type: data.planType || data.plan || '',
      totalCost: data.totalCost || data['Total Cost'] || 0
    },
    payment: {
      sortCode: data.sortCode || data['Sort Code'] || '',
      accountNumber: data.accountNumber || data['Account number'] || '',
      ddDate: data.ddDate || data['DD Date'] || ''
    },
    notes: data.notes || data['Notes - e.g. whats covered'] || '',
    agentId: user.uid || '',
    agentEmail: user.email || user.username || '',
    timestamp: timestamp,
    createdAt: now,
    updatedAt: now,
    leadStatus: 'new',
    leadSource: 'upload',
    disposition: null,
    dispositionDate: null,
    dispositionBy: null
  };
}

/**
 * Show manual entry form
 */
// Expose functions to global scope
if (typeof window !== 'undefined') {
  window.setDisposition = setDisposition;
  window.cycleToNextLead = cycleToNextLead;
  window.cycleToPreviousLead = cycleToPreviousLead;
  window.uploadLeadsFromFile = uploadLeadsFromFile;
  window.showManualEntryForm = showManualEntryForm;
  window.handleManualLeadSubmit = handleManualLeadSubmit;
}

function showManualEntryForm() {
  const uploadContent = document.getElementById('uploadLeadsContent');
  if (!uploadContent) return;

  uploadContent.innerHTML = `
    <div class="form-section">
      <h3>Manual Lead Entry</h3>
      <form id="manualLeadForm" onsubmit="handleManualLeadSubmit(event)">
        <div class="form-row">
          <div class="form-group">
            <label>Name <span class="required">*</span></label>
            <input type="text" id="manualName" required>
          </div>
          <div class="form-group">
            <label>Email</label>
            <input type="email" id="manualEmail">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Phone</label>
            <input type="text" id="manualPhone">
          </div>
          <div class="form-group">
            <label>Postcode</label>
            <input type="text" id="manualPostcode">
          </div>
        </div>
        <div class="form-group">
          <label>Address</label>
          <input type="text" id="manualAddress">
        </div>
        <div class="form-group">
          <label>Notes</label>
          <textarea id="manualNotes" rows="3"></textarea>
        </div>
        <div style="display: flex; gap: 10px; margin-top: 20px;">
          <button type="submit" class="btn btn-primary">Create Lead</button>
          <button type="button" class="btn btn-secondary" onclick="closeUploadModal()">Cancel</button>
        </div>
      </form>
    </div>
  `;
}

/**
 * Handle manual lead form submission
 */
async function handleManualLeadSubmit(event) {
  event.preventDefault();

  // Get current user
  let currentUser = null;
  if (typeof getCurrentUser === 'function') {
    currentUser = getCurrentUser();
  }

  if (!currentUser) {
    showCRMMessage('You must be logged in to create leads', 'error');
    return;
  }

  const manualData = {
    name: document.getElementById('manualName')?.value.trim(),
    email: document.getElementById('manualEmail')?.value.trim(),
    phone: document.getElementById('manualPhone')?.value.trim(),
    postcode: document.getElementById('manualPostcode')?.value.trim(),
    address: document.getElementById('manualAddress')?.value.trim(),
    notes: document.getElementById('manualNotes')?.value.trim()
  };

  if (!manualData.name) {
    showCRMMessage('Name is required', 'error');
    return;
  }

  try {
    await uploadLeads([manualData]);
    closeUploadModal();
  } catch (error) {
    console.error('Error creating manual lead:', error);
    showCRMMessage('Error creating lead: ' + error.message, 'error');
  }
}
