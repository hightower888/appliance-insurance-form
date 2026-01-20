---
title: "System Architecture - CRM System"
created: 2026-01-18
workflow: DISCOVERY_FULL_AI
step: full-4
status: complete
---

# System Architecture

**Stream:** crm_system  
**Created:** 2026-01-18  
**Workflow:** DISCOVERY_FULL_AI  
**Step:** full-4

---

## File Structure Design

### New Files

```
src/
  ├── crm.html              # Main CRM interface
  ├── crm.js                # Core CRM logic (viewing, editing, navigation)
  ├── crm-leads.js          # Lead management (upload, cycle, disposition)
  ├── crm-reports.js        # Reporting and KPIs
  └── styles.css            # (Extend existing, no new file)
```

### File Responsibilities

#### `src/crm.html`
- **Purpose:** Main CRM interface HTML
- **Contains:**
  - Tab navigation (Leads, Customers, Reports)
  - Lead list/table view
  - Customer detail view
  - Edit forms
  - Upload interface
  - Reports dashboard
- **Pattern:** Similar to `admin.html` structure

#### `src/crm.js`
- **Purpose:** Core CRM functionality
- **Functions:**
  - `loadLeads()` - Load leads from database
  - `loadCustomers()` - Load customers from database
  - `renderLeadList()` - Render lead table/list
  - `viewLeadDetails(leadId)` - Show lead details modal
  - `editLead(leadId)` - Edit lead in modal
  - `saveLead(leadId, data)` - Save changes to database
  - `searchLeads(query)` - Search functionality
  - `filterLeads(filters)` - Filter functionality
- **Pattern:** Similar to `admin.js` loadSales() and renderSalesTable()

#### `src/crm-leads.js`
- **Purpose:** Lead management specific functionality
- **Functions:**
  - `uploadLeads(data)` - Upload customer records
  - `cycleToNextLead()` - Navigate to next lead
  - `cycleToPreviousLead()` - Navigate to previous lead
  - `setDisposition(leadId, disposition)` - Set disposition
  - `getCurrentLeadIndex()` - Get current lead position
- **Pattern:** New pattern for lead workflow

#### `src/crm-reports.js`
- **Purpose:** Reporting and KPI calculations
- **Functions:**
  - `calculateConversionRate()` - Calculate lead conversion rate
  - `calculateDispositionBreakdown()` - Calculate disposition stats
  - `calculateAcquisitionMetrics()` - Calculate acquisition KPIs
  - `generateReport(type, filters)` - Generate reports
  - `renderKPIDashboard()` - Render dashboard
- **Pattern:** New pattern for analytics

---

## Integration Architecture

### Integration Point 1: Form System

**Method:** URL Parameters + localStorage  
**Flow:**
1. CRM: User clicks "Paste to Form" for positive disposition
2. CRM: Store customer data in localStorage with key `crm_prefill_data`
3. CRM: Navigate to `/form?prefill=true`
4. Form: On load, check for `prefill=true` parameter
5. Form: Read data from localStorage
6. Form: Pre-fill form fields using form-renderer
7. Form: Clear localStorage after pre-fill
8. Form: User can edit and submit normally

**Code Pattern:**
```javascript
// In crm.js
function pasteToForm(customerData) {
  localStorage.setItem('crm_prefill_data', JSON.stringify(customerData));
  window.location.href = '/form?prefill=true';
}

// In app.js (form)
if (new URLSearchParams(window.location.search).get('prefill') === 'true') {
  const prefillData = JSON.parse(localStorage.getItem('crm_prefill_data'));
  if (prefillData) {
    prefillFormFields(prefillData);
    localStorage.removeItem('crm_prefill_data');
  }
}
```

---

### Integration Point 2: Admin Panel Patterns

**Reuse:**
- Table rendering pattern (admin.js:767-853)
- Pagination system (admin.js pagination logic)
- Search/filter UI (admin.html:346-357)
- Modal detail view (admin.js:1632-1727)
- Column visibility (admin.js column visibility logic)

**Extend:**
- Add edit capability to modal
- Add disposition controls
- Add lead-specific columns

---

### Integration Point 3: Services

**form-renderer.js:**
- Use `renderForm()` to display form fields in CRM edit mode
- Use `getAllFieldValues()` to collect edited values

**field-config.js:**
- Use `getAllFields()` to get field definitions
- Use field definitions for validation and display

**appliance-relationship-manager.js:**
- Use `addAppliancesToSale()` for adding appliances
- Use `getAppliancesForSale()` for retrieving appliances
- Use `updateAppliance()` for editing appliances
- Use `removeAppliance()` for deleting appliances

---

### Integration Point 4: Authentication

**auth-db.js:**
- Use `getCurrentUser()` for current user info
- Use `checkRole()` for role verification
- Use sessionStorage for user session

**Role-Based Permissions:**
- Admin: Full access (view, edit, upload, disposition, reports)
- Agent: View, edit, disposition (own leads), view reports
- Processor: View only (read-only access)

---

### Integration Point 5: Database

**Firebase Realtime Database:**
- Read from `sales` node (existing)
- Write to `sales` node (extend with new fields)
- Use `appliances` node for appliance data
- Use `users` node for user/agent info
- Use `security_logs` for activity logging

**Database Rules:**
- Extend existing rules to support new fields
- Maintain read/write permissions
- Support role-based access

---

## Database Schema Extensions

### Extended Sales Record Schema

```javascript
{
  // Existing fields (keep as-is)
  contact: { name, phone, email, address, postcode },
  appliances: [...],
  plan: { number, type, totalCost },
  payment: { sortCode, accountNumber, ddDate },
  notes: string,
  agentId: string,
  agentEmail: string,
  timestamp: number,
  submittedAt: string,
  dynamicFields: object,
  applianceIds: string[],
  version: number,
  createdAt: string,
  updatedAt: string,
  
  // New fields for CRM
  leadStatus: 'new' | 'contacted' | 'dispositioned' | 'converted',  // Optional, defaults to 'new' for new leads
  disposition: 'no_answer' | 'not_interested' | 'interested' | 'call_back' | 'other' | null,  // Optional
  dispositionDate: string | null,  // ISO string, optional
  dispositionBy: string | null,  // agentId or email, optional
  leadSource: 'upload' | 'form' | 'manual' | null  // Optional, defaults based on creation method
}
```

### Backward Compatibility

- All new fields are **optional**
- Existing sales records work without new fields
- Default values:
  - `leadStatus`: 'converted' (if has submittedAt) or 'new'
  - `disposition`: null
  - `dispositionDate`: null
  - `dispositionBy`: null
  - `leadSource`: 'form' (if from form submission)

### Activity Logging

**Option 1:** Use existing `security_logs` node
- Add CRM activity events
- Event types: `lead_dispositioned`, `lead_edited`, `lead_uploaded`

**Option 2:** New `crm_activity` node
- Separate from security logs
- Structure: `{ leadId, action, userId, timestamp, details }`

**Recommendation:** Use `security_logs` (Option 1) to maintain consistency

---

## Component Architecture

### CRM Module Structure

```
CRM System
├── Viewing Layer
│   ├── Lead List View
│   ├── Customer List View
│   ├── Detail View (Modal)
│   └── Reports Dashboard
├── Editing Layer
│   ├── Inline Editing
│   ├── Modal Form Editing
│   └── Validation
├── Lead Management Layer
│   ├── Upload Handler
│   ├── Cycle Navigation
│   ├── Disposition Handler
│   └── Status Workflow
├── Integration Layer
│   ├── Form Integration
│   ├── Service Integration
│   └── Database Integration
└── Reporting Layer
    ├── KPI Calculator
    ├── Report Generator
    └── Dashboard Renderer
```

---

## Data Flow

### Lead Upload Flow

```
User Input (CSV/JSON/Manual)
  ↓
Validation
  ↓
Transform to Sales Schema
  ↓
Add leadStatus='new', leadSource='upload'
  ↓
Write to Firebase (sales node)
  ↓
Create Appliance Records (if any)
  ↓
Update UI
```

### Disposition Flow

```
User Selects Disposition
  ↓
Validate (must be logged in)
  ↓
Update Record:
  - disposition = selected
  - dispositionDate = now
  - dispositionBy = currentUser
  - leadStatus = 'dispositioned'
  ↓
If disposition === 'interested':
  - Enable "Paste to Form" button
  ↓
Save to Firebase
  ↓
Log Activity
  ↓
Update UI
```

### Paste to Form Flow

```
User Clicks "Paste to Form"
  ↓
Validate disposition === 'interested'
  ↓
Collect Customer Data
  ↓
Store in localStorage
  ↓
Navigate to /form?prefill=true
  ↓
Form Reads localStorage
  ↓
Pre-fill Fields
  ↓
User Edits (optional)
  ↓
Submit Form (normal flow)
  ↓
Update CRM Record:
  - leadStatus = 'converted'
  ↓
Clear localStorage
```

---

## UI/UX Architecture

### Layout Structure

```
CRM Interface
├── Header
│   ├── Title "CRM System"
│   ├── User Info
│   └── Logout
├── Tabs
│   ├── Leads Tab
│   ├── Customers Tab
│   └── Reports Tab
└── Content Area
    ├── Search/Filter Bar
    ├── Action Buttons
    ├── Data Table/List
    └── Pagination
```

### Lead View Layout

```
Lead Detail View (Modal)
├── Contact Section (Editable)
├── Appliances Section (Editable)
├── Plan/Payment Section (Editable)
├── Form Fields Section (Editable)
├── Disposition Controls
│   ├── Disposition Dropdown
│   └── "Paste to Form" Button (if interested)
└── Action Buttons
    ├── Save
    ├── Cancel
    └── Close
```

---

## Security Architecture

### Authentication
- Use auth-db.js for authentication
- Check authentication on page load
- Redirect to login if not authenticated

### Authorization
- Role-based access control
- Admin: Full access
- Agent: Limited access (own leads)
- Processor: Read-only

### Data Validation
- Validate all inputs before save
- Sanitize user inputs (XSS prevention)
- Validate data types and formats
- Check required fields

### Database Rules
- Extend existing rules
- Support new fields
- Maintain role-based permissions
- Log security events

---

## Performance Considerations

### Data Loading
- Pagination for large datasets (50 records per page)
- Lazy loading of detail views
- Debounced search/filter
- Optimized Firebase queries

### Rendering
- Use DocumentFragment for batch DOM updates
- requestAnimationFrame for smooth rendering
- Virtual scrolling for very large lists (future)

### Caching
- Cache field configurations
- Cache user permissions
- Cache recent searches

---

## Error Handling

### Network Errors
- Retry logic for failed requests
- Offline detection
- User-friendly error messages

### Validation Errors
- Inline field validation
- Error messages below fields
- Prevent save on errors

### Permission Errors
- Clear error messages
- Redirect if unauthorized
- Log security violations

---

## Next Steps

1. Memory Context Initialization (Step 5)
2. Complete Discovery & Handoff (Step 6)

---

**Step 4 Complete - Ready for Memory Context Initialization**
