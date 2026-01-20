---
title: "Requirements to Component Mapping"
created: 2026-01-19
workflow: PLANNING_STANDARD_AI
step: planning-step-1
status: Complete
---

# Requirements to Component Mapping

**Stream:** feature_comparison_sales_portal  
**Date:** 2026-01-19  
**Workflow:** PLANNING_STANDARD_AI  
**Step:** planning-step-1

---

## Overview

This document maps 10 requirements to specific components and services needed for implementation.

**Total Requirements:** 10  
**New Components/Services:** 15  
**Enhanced Components:** 8  
**Feature Sets:** 7

---

## P0 - Must Have Requirements

### REQ-DUP-001: Real-time Duplicate Detection

**Components/Services Needed:**
1. **NEW:** `services/duplicate-detection-service.js`
   - Phone number matching logic
   - Email matching logic
   - Name matching logic
   - Confidence scoring algorithm
   - Database query methods

2. **NEW:** `components/duplicate-warning.js`
   - Visual warning component
   - Existing customer details display
   - Override button/functionality
   - Color-coded confidence indicators

3. **ENHANCE:** `src/app.js`
   - Integrate duplicate detection on form inputs
   - Debounced checking
   - Handle override logic

**Integration Points:**
- Form inputs (phone, email, name)
- Firebase database (sales collection)
- Enhanced logger (for tracking duplicates)

**Dependencies:** None (can be built first)

---

### REQ-EXP-001: Enhanced CSV Export (160+ Fields)

**Components/Services Needed:**
1. **NEW:** `services/export-service.js`
   - Comprehensive field mapping (160+ fields)
   - Field mapping configuration
   - CSV generation with all fields
   - Appliance details expansion (up to 10)
   - Boiler cover details
   - CRM-ready format generation

2. **NEW:** `components/field-mapping-ui.js`
   - Field mapping configuration UI
   - Custom column name editor
   - Mapping presets
   - Export preview

3. **ENHANCE:** `src/admin.js`
   - Use export-service.js
   - Add field mapping UI integration

4. **ENHANCE:** `src/processor.js`
   - Use export-service.js
   - Integrate with existing processor profiles

5. **ENHANCE:** `src/crm-reports.js`
   - Use export-service.js
   - Add enhanced export option

**Integration Points:**
- Existing CSV export functions
- Processor profiles (field mapping)
- Sales data structure

**Dependencies:** None (can be built independently)

---

### REQ-FIL-001: Advanced Filtering

**Components/Services Needed:**
1. **ENHANCE:** `components/filter-component.js`
   - Add agent filter option
   - Add date range filter
   - Add DD date filter
   - Add plan type filter
   - Add appliance count filter
   - Add boiler cover filter
   - Filter state persistence

2. **NEW:** `components/date-range-picker.js`
   - From/To date picker component
   - Date range validation
   - Date formatting

3. **ENHANCE:** `src/admin.js`
   - Integrate advanced filters
   - Filter logic implementation

4. **ENHANCE:** `src/processor.js`
   - Integrate advanced filters
   - Filter logic implementation

5. **ENHANCE:** `src/crm.js`
   - Integrate advanced filters
   - Filter logic implementation

**Integration Points:**
- Existing filter-component.js
- Sales data filtering
- Filter state in crmState

**Dependencies:** date-range-picker.js (standalone)

---

### REQ-BULK-001: Bulk Delete Operations

**Components/Services Needed:**
1. **NEW:** `components/bulk-operations.js`
   - Bulk delete functionality
   - Confirmation dialog
   - Progress tracking
   - Error handling
   - Success/error feedback

2. **ENHANCE:** `components/bulk-selection.js`
   - Add bulk actions toolbar
   - Selection count display
   - Integration hooks

3. **ENHANCE:** `src/admin.js`
   - Integrate bulk-operations.js
   - Permission checks
   - Activity logging

4. **ENHANCE:** `src/crm.js`
   - Integrate bulk-operations.js
   - Permission checks
   - Activity logging

**Integration Points:**
- Existing bulk-selection.js
- Enhanced logger (for activity tracking)
- Firebase database (delete operations)

**Dependencies:** bulk-selection.js (exists)

---

## P1 - Should Have Requirements

### REQ-IMP-001: Sales Import System

**Components/Services Needed:**
1. **NEW:** `services/import-service.js`
   - CSV parsing and validation
   - JSON parsing and validation
   - Firebase export format parsing
   - Data validation logic
   - Appliance parsing (up to 10)
   - Error reporting
   - Progress tracking

2. **ENHANCE:** `src/crm-leads.js`
   - Use import-service.js
   - Enhanced upload UI
   - Progress indicator
   - Error display

3. **ENHANCE:** `src/admin.js`
   - Add import UI
   - Integrate import-service.js

**Integration Points:**
- Existing lead upload functionality
- Form validation service
- Firebase database (sales collection)

**Dependencies:** Existing lead upload (crm-leads.js)

---

### REQ-EXP-002: Bulk Export Selected

**Components/Services Needed:**
1. **ENHANCE:** `services/export-service.js`
   - Add selection filter support
   - Selected records export logic

2. **ENHANCE:** `components/bulk-selection.js`
   - Add "Export Selected" button
   - Selection count display

3. **ENHANCE:** `src/admin.js`
   - Add export selected functionality

4. **ENHANCE:** `src/processor.js`
   - Add export selected functionality

5. **ENHANCE:** `src/crm.js`
   - Add export selected functionality

**Integration Points:**
- Existing export-service.js (REQ-EXP-001)
- Existing bulk-selection.js
- CSV export functions

**Dependencies:** export-service.js (REQ-EXP-001), bulk-selection.js

---

### REQ-INPUT-001: Smart Input Handling

**Components/Services Needed:**
1. **NEW:** `utils/input-formatter.js`
   - Paste event handling
   - Auto-formatting for sort codes
   - Auto-formatting for account numbers
   - Input cleaning (spaces, hyphens, non-digits)
   - Format validation

2. **ENHANCE:** `src/app.js`
   - Integrate input-formatter.js
   - Add paste listeners
   - Real-time formatting
   - Visual feedback

**Integration Points:**
- Form inputs (sort code, account number)
- Form validation

**Dependencies:** None

---

## P2 - Could Have Requirements

### REQ-SMS-001: SMS Messaging System

**Components/Services Needed:**
1. **NEW:** `services/sms-service.js`
   - SMS service integration (Twilio, etc.)
   - Bulk SMS sending
   - Template management
   - Delivery tracking
   - Status monitoring
   - Error handling and retry

2. **NEW:** `components/sms-ui.js`
   - SMS sending interface
   - Template selector
   - Recipient selection
   - Status display
   - Delivery tracking UI

3. **ENHANCE:** `src/admin.js`
   - Add SMS tab/section
   - Integrate sms-ui.js

**Integration Points:**
- External SMS service API
- Sales data (customer phone numbers)
- Admin panel

**Dependencies:** External SMS service (Twilio, etc.)

---

### REQ-DOC-001: Document Generation

**Components/Services Needed:**
1. **NEW:** `services/document-service.js`
   - Template management
   - Template versioning
   - Active status management
   - File storage management
   - Download tracking

2. **NEW:** `utils/pdf-generator.js`
   - PDF generation from HTML templates
   - PDF library integration (jsPDF, PDFKit)
   - Template rendering

3. **NEW:** `components/document-template-ui.js`
   - Template editor
   - Template preview
   - Version management UI
   - Active status toggle

4. **ENHANCE:** `src/admin.js`
   - Add document management section
   - Integrate document-template-ui.js

**Integration Points:**
- PDF library (external)
- File storage (Firebase Storage or similar)
- Admin panel

**Dependencies:** PDF library (jsPDF, PDFKit)

---

### REQ-DEDUP-001: Deduplication in Exports

**Components/Services Needed:**
1. **ENHANCE:** `services/export-service.js`
   - Add deduplication logic
   - Duplicate detection before export
   - Deduplication options (enable/disable)
   - Duplicate count reporting

2. **USE:** `services/duplicate-detection-service.js`
   - Reuse duplicate detection logic
   - Phone/email matching for exports

**Integration Points:**
- export-service.js (REQ-EXP-001)
- duplicate-detection-service.js (REQ-DUP-001)
- Export functions

**Dependencies:** duplicate-detection-service.js (REQ-DUP-001), export-service.js (REQ-EXP-001)

---

## Component Summary

### New Components (7)
1. `components/duplicate-warning.js`
2. `components/field-mapping-ui.js`
3. `components/date-range-picker.js`
4. `components/bulk-operations.js`
5. `components/sms-ui.js`
6. `components/document-template-ui.js`
7. (Enhanced filter-component.js counts as modification)

### New Services (6)
1. `services/duplicate-detection-service.js`
2. `services/export-service.js`
3. `services/import-service.js`
4. `services/sms-service.js`
5. `services/document-service.js`
6. `utils/input-formatter.js`
7. `utils/pdf-generator.js`

### Enhanced Components (8)
1. `components/filter-component.js`
2. `components/bulk-selection.js`
3. `src/admin.js`
4. `src/processor.js`
5. `src/crm.js`
6. `src/crm-reports.js`
7. `src/crm-leads.js`
8. `src/app.js`

---

## Feature Sets

### Feature Set 1: Data Quality
- REQ-DUP-001: Real-time Duplicate Detection
- REQ-DEDUP-001: Deduplication in Exports
- **Components:** duplicate-detection-service.js, duplicate-warning.js, export-service.js enhancement

### Feature Set 2: Export/Import
- REQ-EXP-001: Enhanced CSV Export
- REQ-EXP-002: Bulk Export Selected
- REQ-IMP-001: Sales Import System
- **Components:** export-service.js, import-service.js, field-mapping-ui.js

### Feature Set 3: Filtering
- REQ-FIL-001: Advanced Filtering
- **Components:** filter-component.js enhancement, date-range-picker.js

### Feature Set 4: Bulk Operations
- REQ-BULK-001: Bulk Delete Operations
- **Components:** bulk-operations.js, bulk-selection.js enhancement

### Feature Set 5: User Experience
- REQ-INPUT-001: Smart Input Handling
- **Components:** input-formatter.js, app.js enhancement

### Feature Set 6: Communication
- REQ-SMS-001: SMS Messaging
- **Components:** sms-service.js, sms-ui.js

### Feature Set 7: Documents
- REQ-DOC-001: Document Generation
- **Components:** document-service.js, pdf-generator.js, document-template-ui.js

---

**Requirements to Component Mapping Complete**
