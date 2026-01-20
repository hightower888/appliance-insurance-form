---
title: "Missing Features List - Implementation Priorities"
created: 2026-01-19
workflow: DISCOVERY_ASSESSMENT_AI
step: discovery-step-1
status: Complete
---

# Missing Features List

**Stream:** feature_comparison_sales_portal  
**Date:** 2026-01-19  
**Workflow:** DISCOVERY_ASSESSMENT_AI

---

## Priority Classification

**P0 (Must Have):** Critical for data quality and admin efficiency  
**P1 (Should Have):** Important for functionality and user experience  
**P2 (Could Have):** Nice-to-have features for future consideration

---

## P0 - Must Have Features (Critical)

### 1. Real-time Duplicate Detection
**Priority:** P0 - Critical  
**Effort:** 5-7 days  
**Impact:** High - Prevents duplicate customer records

**Requirements:**
- Phone number matching (primary detection)
- Email address matching (secondary validation)
- Name combination matching (tertiary check)
- Confidence scoring (HIGH/MEDIUM/LOW)
- Live checking as users type
- Visual feedback with existing customer details
- Override system for necessary duplicates
- Show existing customer data for verification

**Implementation:**
- Create duplicate detection service
- Integrate with form (appliance_form.html)
- Add visual indicators
- Store duplicate matches in database
- Add override functionality

---

### 2. Enhanced CSV Export (160+ Fields)
**Priority:** P0 - Critical  
**Effort:** 3-5 days  
**Impact:** High - CRM integration requirement

**Requirements:**
- Map all form fields to CSV columns
- Include customer information (title, first name, last name, full name, premium, package)
- Include financial information (sort code, account number, account name, DD date, total cost)
- Include technical fields (lead source, payment method, processor, customer reference)
- Include appliance details (up to 10 appliances with full specifications)
- Include boiler cover details
- Standardized column structure
- Support for filtered exports
- Support for selected records export

**Current State:**
- Basic CSV export exists (~20-30 fields)
- Field mapping exists (processor profiles)
- Needs expansion to 160+ fields

**Implementation:**
- Create comprehensive field mapping
- Update export functions (admin.js, processor.js, crm-reports.js)
- Add field mapping configuration
- Test with CRM systems

---

### 3. Advanced Filtering
**Priority:** P0 - Critical  
**Effort:** 3-4 days  
**Impact:** High - Admin efficiency

**Missing Filters:**
- Agent filter (by email)
- Date range (from/to for sales creation)
- Direct Debit dates (from/to)
- Plan type (Appliance-only, Boiler-only, Both)
- Appliance count (1, 2-3, 4-5, 6+)
- Boiler cover (Yes/No)

**Current State:**
- Basic filters exist (disposition, status, search)
- Filter component exists (filter-component.js)

**Implementation:**
- Add filter UI components
- Implement filter logic in admin.js, processor.js, crm.js
- Add date range pickers
- Add filter persistence

---

### 4. Bulk Delete Operations
**Priority:** P0 - Critical  
**Effort:** 2-3 days  
**Impact:** High - Admin efficiency

**Requirements:**
- Multi-select checkboxes (exists - bulk-selection.js)
- Bulk delete button
- Confirmation dialog
- Progress tracking
- Error handling
- Success/error feedback

**Current State:**
- Bulk selection component exists
- No bulk delete functionality

**Implementation:**
- Create bulk operations component
- Add delete functionality
- Add confirmation dialog
- Integrate with admin.js and crm.js

---

## P1 - Should Have Features (Important)

### 5. Sales Import System
**Priority:** P1 - Important  
**Effort:** 4-5 days  
**Impact:** Medium - Data migration and bulk operations

**Requirements:**
- CSV import with validation
- JSON import
- Firebase export format import
- Data validation (all required fields)
- Automatic processing
- Appliance parsing (up to 10 appliances)
- Error reporting with details
- Format flexibility

**Current State:**
- Lead upload exists in CRM (CSV/JSON)
- Basic validation
- Needs enhancement for full sales import

**Implementation:**
- Enhance existing lead upload
- Add Firebase format support
- Improve validation
- Add error reporting

---

### 6. Bulk Export Selected
**Priority:** P1 - Important  
**Effort:** 1-2 days  
**Impact:** Medium - Export flexibility

**Requirements:**
- Export only selected records
- Use existing CSV export logic
- Filter by selection
- Progress indicator

**Current State:**
- Bulk selection exists
- CSV export exists
- Need to combine them

**Implementation:**
- Modify export functions to accept selection filter
- Add "Export Selected" button
- Update UI to show selection count

---

### 7. Smart Input Handling Enhancements
**Priority:** P1 - Important  
**Effort:** 2-3 days  
**Impact:** Medium - User experience

**Requirements:**
- Enhanced paste support for banking details
- Auto-formatting (remove spaces, hyphens, non-digits)
- Real-time validation
- Format flexibility (accept various input formats)

**Current State:**
- Basic paste support exists
- Limited auto-formatting

**Implementation:**
- Enhance form input handlers
- Add paste event listeners
- Add auto-formatting logic
- Improve validation

---

## P2 - Could Have Features (Future)

### 8. SMS Messaging
**Priority:** P2 - Future  
**Effort:** 7-10 days  
**Impact:** Low - Communication feature

**Requirements:**
- Bulk SMS sending
- Template system
- Delivery tracking
- Status monitoring
- Error handling

**Implementation:**
- Integrate SMS service (Twilio, etc.)
- Create SMS UI
- Add template management
- Add delivery tracking

---

### 9. Document Generation
**Priority:** P2 - Future  
**Effort:** 8-12 days  
**Impact:** Low - Document management

**Requirements:**
- HTML templates
- PDF generation
- File management
- Version control
- Download tracking

**Implementation:**
- Integrate PDF library (jsPDF, PDFKit)
- Create template system
- Add file management
- Add download tracking

---

### 10. Deduplication in Exports
**Priority:** P2 - Future  
**Effort:** 2-3 days  
**Impact:** Low - Data quality enhancement

**Requirements:**
- Remove duplicates before export
- Duplicate detection logic
- Export deduplicated data

**Implementation:**
- Add deduplication service
- Integrate with export functions
- Add deduplication options

---

## Implementation Plan

### Phase 1: Critical Features (P0)
**Duration:** 3-4 weeks  
**Effort:** 13-19 days

1. Real-time Duplicate Detection (5-7 days)
2. Enhanced CSV Export (3-5 days)
3. Advanced Filtering (3-4 days)
4. Bulk Delete Operations (2-3 days)

### Phase 2: Important Features (P1)
**Duration:** 1-2 weeks  
**Effort:** 8-11 days

5. Sales Import System (4-5 days)
6. Bulk Export Selected (1-2 days)
7. Smart Input Handling (2-3 days)

### Phase 3: Future Features (P2)
**Duration:** 3-4 weeks  
**Effort:** 17-25 days

8. SMS Messaging (7-10 days)
9. Document Generation (8-12 days)
10. Deduplication in Exports (2-3 days)

---

## Total Implementation Effort

**P0 Features:** 13-19 days  
**P1 Features:** 8-11 days  
**P2 Features:** 17-25 days  
**Total:** 38-55 days (7-11 weeks)

---

**Missing Features List Complete**
