---
title: "Sales Form Portal vs Current CRM System - Feature Comparison"
created: 2026-01-19
workflow: DISCOVERY_ASSESSMENT_AI
step: discovery-step-1
status: Complete
---

# Feature Comparison: Sales Form Portal vs Current CRM System

**Stream:** feature_comparison_sales_portal  
**Date:** 2026-01-19  
**Workflow:** DISCOVERY_ASSESSMENT_AI

---

## Executive Summary

This document compares the Sales Form Portal (reference system) with the current CRM system to identify missing features and implementation opportunities.

**Key Findings:**
- **10 Missing Features** identified
- **4 Critical (P0)** features need immediate implementation
- **3 Important (P1)** features recommended
- **3 Nice-to-Have (P2)** features for future consideration

---

## Feature Comparison Matrix

### ✅ Features Present in Both Systems

| Feature | Sales Portal | Current System | Status |
|---------|--------------|----------------|--------|
| User Management (CRUD) | ✅ | ✅ | Complete |
| Field Configuration | ✅ | ✅ | Complete |
| CSV Export | ✅ | ✅ | Basic (needs enhancement) |
| Sales Data Viewing | ✅ | ✅ | Complete |
| Authentication & RBAC | ✅ | ✅ | Complete |
| Form Submission | ✅ | ✅ | Complete |
| Dynamic Form Fields | ✅ | ✅ | Complete |

---

### ⚠️ Features Partially Implemented

| Feature | Sales Portal | Current System | Gap |
|---------|--------------|----------------|-----|
| **Advanced Filtering** | Full (agent, date ranges, DD dates, plan type, appliance count, boiler cover, status) | Basic (disposition, status, search) | Missing: agent filter, date ranges, DD dates, appliance count, boiler cover filters |
| **CSV Export** | 160+ fields, CRM-ready, deduplication | Basic fields (~20-30), no deduplication | Missing: 160+ field mapping, deduplication logic |
| **Bulk Operations** | Multi-select, bulk delete, bulk export selected | Multi-select only (Phase 2) | Missing: bulk delete, bulk export selected |
| **Sales Import** | CSV/JSON/Firebase formats, validation, error reporting | Lead upload (CSV/JSON) only | Missing: full sales import, Firebase format, comprehensive validation |
| **Smart Input Handling** | Enhanced paste, auto-formatting for banking details | Basic paste support | Missing: comprehensive paste handling, auto-formatting |

---

### ❌ Missing Features (Not in Current System)

| Feature | Sales Portal | Current System | Priority |
|---------|--------------|----------------|----------|
| **Real-time Duplicate Detection** | ✅ Phone/email/name matching, confidence scoring, visual feedback | ❌ None | **P0 - Critical** |
| **SMS Messaging** | ✅ Bulk SMS, templates, delivery tracking | ❌ None | P2 - Future |
| **Document Generation** | ✅ PDF templates, file management | ❌ None | P2 - Future |
| **Enhanced CSV Export** | ✅ 160+ fields, CRM-ready format | ❌ Basic export only | **P0 - Critical** |
| **Bulk Delete** | ✅ Multi-select delete with confirmation | ❌ None | **P0 - Critical** |
| **Bulk Export Selected** | ✅ Export only selected records | ❌ None | P1 - Important |
| **Sales Import System** | ✅ Full import with validation | ❌ Lead upload only | P1 - Important |
| **Deduplication in Exports** | ✅ Remove duplicates before export | ❌ None | P2 - Future |

---

## Detailed Feature Analysis

### 1. Real-time Duplicate Detection ⚠️ MISSING (P0)

**Sales Portal Implementation:**
- Phone number matching (primary)
- Email address matching (secondary)
- Name combination matching (tertiary)
- Confidence scoring (HIGH/MEDIUM/LOW)
- Live checking as users type
- Visual feedback with existing customer details
- Override system for necessary duplicates

**Current System:**
- ❌ No duplicate detection
- ❌ No real-time checking
- ❌ No confidence scoring

**Impact:** Critical for data quality. Prevents duplicate customer records.

**Implementation Effort:** 5-7 days

---

### 2. Enhanced CSV Export ⚠️ PARTIAL (P0)

**Sales Portal Implementation:**
- 160+ field headers
- CRM-ready data mapping
- Deduplication integration
- Custom filtering support
- Selected sales export
- Standardized format

**Current System:**
- ✅ Basic CSV export (~20-30 fields)
- ✅ Field mapping (processor profiles)
- ❌ Not 160+ fields
- ❌ No deduplication
- ❌ No selected export

**Gap:** Need comprehensive field mapping to match Sales Portal's 160+ fields.

**Implementation Effort:** 3-5 days

---

### 3. Advanced Filtering ⚠️ PARTIAL (P0)

**Sales Portal Implementation:**
- Agent filter (by email)
- Date range (from/to for sales creation)
- Direct Debit dates (from/to)
- Plan type (Appliance-only, Boiler-only, Both)
- Appliance count (1, 2-3, 4-5, 6+)
- Boiler cover (Yes/No)
- Customer search (name and email)
- Status filter

**Current System:**
- ✅ Basic filters (disposition, status)
- ✅ Search functionality
- ❌ No agent filter
- ❌ No date range filters
- ❌ No DD date filters
- ❌ No plan type filter
- ❌ No appliance count filter
- ❌ No boiler cover filter

**Gap:** Missing 6 filter types that Sales Portal has.

**Implementation Effort:** 3-4 days

---

### 4. Bulk Operations ⚠️ PARTIAL (P0)

**Sales Portal Implementation:**
- Multi-selection with checkboxes
- Bulk delete (with confirmation)
- Bulk export selected records
- Safety confirmations

**Current System:**
- ✅ Multi-selection (Phase 2 - bulk-selection.js)
- ❌ No bulk delete
- ❌ No bulk export selected

**Gap:** Selection exists, but operations missing.

**Implementation Effort:** 2-3 days

---

### 5. Sales Import System ⚠️ PARTIAL (P1)

**Sales Portal Implementation:**
- CSV import with validation
- JSON import
- Firebase export format import
- Data validation
- Automatic processing
- Appliance parsing (up to 10 appliances)
- Error reporting

**Current System:**
- ✅ Lead upload (CSV/JSON) in CRM
- ❌ Not full sales import
- ❌ No Firebase format support
- ❌ Limited validation

**Gap:** Current lead upload is basic, needs enhancement.

**Implementation Effort:** 4-5 days

---

### 6. SMS Messaging ❌ MISSING (P2)

**Sales Portal Implementation:**
- Bulk SMS sending
- Template system
- Delivery tracking
- Status monitoring (NOT_SENT, SENDING, SENT, FAILED, SKIPPED)
- Error handling and retry

**Current System:**
- ❌ No SMS functionality

**Impact:** Low priority, communication feature.

**Implementation Effort:** 7-10 days

---

### 7. Document Generation ❌ MISSING (P2)

**Sales Portal Implementation:**
- HTML templates
- PDF generation
- File management
- Version control
- Active status management
- Download tracking

**Current System:**
- ❌ No document generation

**Impact:** Low priority, document management feature.

**Implementation Effort:** 8-12 days

---

### 8. Smart Input Handling ⚠️ PARTIAL (P1)

**Sales Portal Implementation:**
- Enhanced paste support (8-digit account numbers, 6-digit sort codes)
- Auto-formatting (removes spaces, hyphens, non-digits)
- Real-time validation
- Format flexibility

**Current System:**
- ✅ Basic paste support in form
- ❌ Not comprehensive
- ❌ Limited auto-formatting

**Gap:** Needs enhancement for banking details specifically.

**Implementation Effort:** 2-3 days

---

## Current System Unique Features

### Features Not in Sales Portal

1. **CRM Capabilities**
   - Lead management system
   - Customer conversion tracking
   - Disposition tracking
   - Lead cycling
   - KPI calculations
   - Advanced reporting

2. **Enhanced Logging**
   - Field-level change tracking
   - Audit log viewer
   - Change history per record
   - Diff view capability

3. **State Management**
   - Centralized state manager
   - Undo/redo functionality
   - State persistence

4. **View System**
   - Multiple view types (table, kanban, timeline, card)
   - View controller abstraction

5. **Advanced UI Components**
   - Sidebar navigation
   - Quick filter pills
   - Status indicators
   - Inline editing

---

## Priority Summary

### P0 - Must Have (Critical)
1. **Real-time Duplicate Detection** - Data quality critical
2. **Enhanced CSV Export (160+ fields)** - CRM integration requirement
3. **Advanced Filtering** - Admin efficiency
4. **Bulk Delete Operations** - Admin efficiency

### P1 - Should Have (Important)
5. **Sales Import System** - Data migration and bulk operations
6. **Bulk Export Selected** - Export flexibility
7. **Smart Input Handling Enhancements** - User experience

### P2 - Could Have (Future)
8. **SMS Messaging** - Communication feature
9. **Document Generation** - Document management
10. **Deduplication in Exports** - Data quality enhancement

---

## Implementation Recommendations

### Phase 1: Critical Features (P0)
- Real-time duplicate detection
- Enhanced CSV export
- Advanced filtering
- Bulk delete operations

**Estimated Effort:** 13-19 days

### Phase 2: Important Features (P1)
- Sales import system
- Bulk export selected
- Smart input handling enhancements

**Estimated Effort:** 8-11 days

### Phase 3: Future Features (P2)
- SMS messaging
- Document generation
- Deduplication in exports

**Estimated Effort:** 17-25 days

---

**Feature Comparison Complete**
