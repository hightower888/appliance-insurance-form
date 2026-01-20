---
title: "Requirements Catalog - Missing Features Implementation"
created: 2026-01-19
workflow: DISCOVERY_ASSESSMENT_AI
step: discovery-step-2
status: Complete
---

# Requirements Catalog

**Stream:** feature_comparison_sales_portal  
**Date:** 2026-01-19  
**Workflow:** DISCOVERY_ASSESSMENT_AI

---

## Requirements Summary

**Total Requirements:** 10  
**P0 (Must Have):** 4  
**P1 (Should Have):** 3  
**P2 (Could Have):** 3

---

## P0 - Must Have Requirements

### REQ-DUP-001: Real-time Duplicate Detection
**Priority:** P0 - Must Have  
**Category:** Data Quality  
**Effort:** 5-7 days

**Description:**  
Implement real-time duplicate customer detection as users type in the form, matching by phone number, email, and name combination with confidence scoring.

**Acceptance Criteria:**
- Phone number matching works (primary detection method)
- Email address matching works (secondary validation)
- Name combination matching works (tertiary check)
- Confidence scoring implemented (HIGH/MEDIUM/LOW)
- Live checking as users type (debounced)
- Visual feedback with color-coded warnings
- Show existing customer details for verification
- Override system allows proceeding with duplicates when necessary
- Works in appliance_form.html
- Stores duplicate matches in database

**Dependencies:** None  
**Implementation:** Create duplicate detection service, integrate with form

---

### REQ-EXP-001: Enhanced CSV Export (160+ Fields)
**Priority:** P0 - Must Have  
**Category:** Export/Import  
**Effort:** 3-5 days

**Description:**  
Enhance CSV export to include 160+ fields in CRM-ready format, matching Sales Portal export structure.

**Acceptance Criteria:**
- Export includes all customer information fields (title, first name, last name, full name, premium, package)
- Export includes all financial information (sort code, account number, account name, DD date, total cost)
- Export includes technical fields (lead source, payment method, processor, customer reference)
- Export includes appliance details (up to 10 appliances with full specifications)
- Export includes boiler cover details
- Standardized column structure (160+ fields)
- Works with filtered data
- Works with selected records
- Field mapping configurable
- Backward compatible with existing exports

**Dependencies:** None  
**Implementation:** Update export functions in admin.js, processor.js, crm-reports.js

---

### REQ-FIL-001: Advanced Filtering
**Priority:** P0 - Must Have  
**Category:** Filtering  
**Effort:** 3-4 days

**Description:**  
Add advanced filtering capabilities matching Sales Portal: agent filter, date ranges, DD dates, plan type, appliance count, boiler cover.

**Acceptance Criteria:**
- Agent filter (by email) works
- Date range filter (from/to for sales creation) works
- Direct Debit dates filter (from/to) works
- Plan type filter (Appliance-only, Boiler-only, Both) works
- Appliance count filter (1, 2-3, 4-5, 6+) works
- Boiler cover filter (Yes/No) works
- Filters combine correctly (AND logic)
- Filter state persists
- Works in admin.js, processor.js, crm.js
- UI shows active filters

**Dependencies:** None  
**Implementation:** Add filter UI components, implement filter logic

---

### REQ-BULK-001: Bulk Delete Operations
**Priority:** P0 - Must Have  
**Category:** Operations  
**Effort:** 2-3 days

**Description:**  
Implement bulk delete functionality for selected records with confirmation and progress tracking.

**Acceptance Criteria:**
- Multi-select checkboxes work (exists - bulk-selection.js)
- Bulk delete button appears when items selected
- Confirmation dialog shows count of items to delete
- Progress tracking shows deletion progress
- Error handling for failed deletions
- Success/error feedback after completion
- Works in admin.js and crm.js
- Cannot delete if user has no permission
- Logs deletion activity

**Dependencies:** bulk-selection.js (exists)  
**Implementation:** Create bulk operations component, add delete functionality

---

## P1 - Should Have Requirements

### REQ-IMP-001: Sales Import System
**Priority:** P1 - Should Have  
**Category:** Export/Import  
**Effort:** 4-5 days

**Description:**  
Enhance existing lead upload to full sales import system supporting CSV, JSON, and Firebase export formats with comprehensive validation.

**Acceptance Criteria:**
- CSV import works with validation
- JSON import works with validation
- Firebase export format import works
- Data validation checks all required fields
- Automatic processing (coverage type detection, cost calculations)
- Appliance parsing handles up to 10 appliances per sale
- Error reporting shows detailed validation errors
- Format flexibility (multiple ways to structure appliance data)
- Progress tracking for large imports
- Works in admin panel

**Dependencies:** Existing lead upload (crm-leads.js)  
**Implementation:** Enhance existing upload functionality

---

### REQ-EXP-002: Bulk Export Selected
**Priority:** P1 - Should Have  
**Category:** Export/Import  
**Effort:** 1-2 days

**Description:**  
Add ability to export only selected records using existing CSV export logic.

**Acceptance Criteria:**
- "Export Selected" button appears when items selected
- Only selected records are exported
- Uses existing CSV export logic
- Shows selection count
- Progress indicator for large selections
- Works in admin.js, processor.js, crm.js

**Dependencies:** bulk-selection.js, existing CSV export  
**Implementation:** Modify export functions to accept selection filter

---

### REQ-INPUT-001: Smart Input Handling Enhancements
**Priority:** P1 - Should Have  
**Category:** User Experience  
**Effort:** 2-3 days

**Description:**  
Enhance input handling for banking details with comprehensive paste support and auto-formatting.

**Acceptance Criteria:**
- Enhanced paste support for 8-digit account numbers
- Enhanced paste support for 6-digit sort codes
- Auto-formatting removes spaces, hyphens, non-digit characters
- Real-time validation as users type
- Format flexibility (accepts various input formats)
- Works for sort code and account number fields
- Visual feedback for formatting

**Dependencies:** None  
**Implementation:** Enhance form input handlers in app.js

---

## P2 - Could Have Requirements

### REQ-SMS-001: SMS Messaging System
**Priority:** P2 - Could Have  
**Category:** Communication  
**Effort:** 7-10 days

**Description:**  
Implement SMS messaging system with bulk sending, templates, and delivery tracking.

**Acceptance Criteria:**
- Bulk SMS sending works
- Template system for messages
- Delivery tracking (NOT_SENT, SENDING, SENT, FAILED, SKIPPED)
- Status monitoring UI
- Error handling and retry capabilities
- SMS organization by sales agent
- Works in admin panel

**Dependencies:** SMS service integration (Twilio, etc.)  
**Implementation:** Integrate SMS service, create UI

---

### REQ-DOC-001: Document Generation
**Priority:** P2 - Could Have  
**Category:** Documents  
**Effort:** 8-12 days

**Description:**  
Implement document generation system with HTML templates, PDF generation, and file management.

**Acceptance Criteria:**
- HTML templates can be created and edited
- PDF generation from templates works
- File management (storage and retrieval)
- Version control for templates
- Active status management
- Download tracking
- Template types (different document categories)
- Works in admin panel

**Dependencies:** PDF library (jsPDF, PDFKit)  
**Implementation:** Integrate PDF library, create template system

---

### REQ-DEDUP-001: Deduplication in Exports
**Priority:** P2 - Could Have  
**Category:** Data Quality  
**Effort:** 2-3 days

**Description:**  
Add deduplication logic to exports to remove duplicate records before export.

**Acceptance Criteria:**
- Deduplication logic works (phone/email matching)
- Duplicates removed before export
- Option to enable/disable deduplication
- Shows count of duplicates removed
- Works with all export functions

**Dependencies:** Duplicate detection service (REQ-DUP-001)  
**Implementation:** Add deduplication service, integrate with exports

---

## Requirements by Category

### Data Quality (2 requirements)
- REQ-DUP-001: Real-time Duplicate Detection (P0)
- REQ-DEDUP-001: Deduplication in Exports (P2)

### Export/Import (3 requirements)
- REQ-EXP-001: Enhanced CSV Export (P0)
- REQ-IMP-001: Sales Import System (P1)
- REQ-EXP-002: Bulk Export Selected (P1)

### Filtering (1 requirement)
- REQ-FIL-001: Advanced Filtering (P0)

### Operations (1 requirement)
- REQ-BULK-001: Bulk Delete Operations (P0)

### User Experience (1 requirement)
- REQ-INPUT-001: Smart Input Handling (P1)

### Communication (1 requirement)
- REQ-SMS-001: SMS Messaging (P2)

### Documents (1 requirement)
- REQ-DOC-001: Document Generation (P2)

---

## Implementation Dependencies

### Phase 1: Foundation (P0)
1. REQ-DUP-001: Real-time Duplicate Detection (no dependencies)
2. REQ-EXP-001: Enhanced CSV Export (no dependencies)
3. REQ-FIL-001: Advanced Filtering (no dependencies)
4. REQ-BULK-001: Bulk Delete (depends on bulk-selection.js - exists)

### Phase 2: Enhancements (P1)
5. REQ-IMP-001: Sales Import (depends on existing lead upload)
6. REQ-EXP-002: Bulk Export Selected (depends on bulk-selection.js, REQ-EXP-001)
7. REQ-INPUT-001: Smart Input Handling (no dependencies)

### Phase 3: Advanced (P2)
8. REQ-SMS-001: SMS Messaging (depends on SMS service)
9. REQ-DOC-001: Document Generation (depends on PDF library)
10. REQ-DEDUP-001: Deduplication in Exports (depends on REQ-DUP-001)

---

**Requirements Catalog Complete**
