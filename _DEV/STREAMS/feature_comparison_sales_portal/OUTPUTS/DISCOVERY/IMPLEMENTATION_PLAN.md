---
title: "Implementation Plan - Missing Features"
created: 2026-01-19
workflow: DISCOVERY_ASSESSMENT_AI
step: discovery-step-3
status: Complete
---

# Implementation Plan

**Stream:** feature_comparison_sales_portal  
**Date:** 2026-01-19  
**Workflow:** DISCOVERY_ASSESSMENT_AI

---

## Executive Summary

This implementation plan addresses 10 missing features identified from Sales Form Portal comparison, prioritized into 3 phases over 7-11 weeks.

**Total Effort:** 38-55 days  
**Phases:** 3  
**Quick Wins:** 5 features (can be parallelized)

---

## Phase 1: Critical Features (P0)

**Duration:** 2-3 weeks  
**Effort:** 13-19 days  
**Priority:** Must Have

### Features

1. **Enhanced CSV Export (160+ Fields)** - 3-5 days
2. **Advanced Filtering** - 3-4 days
3. **Bulk Delete Operations** - 2-3 days
4. **Real-time Duplicate Detection** - 5-7 days

### Task Breakdown

#### Feature 1: Enhanced CSV Export
**Tasks:**
1. Design 160+ field mapping structure (0.5 days)
2. Update admin.js export function (1 day)
3. Update processor.js export function (1 day)
4. Update crm-reports.js export function (0.5 days)
5. Add field mapping configuration UI (1 day)
6. Test with CRM systems (1 day)

**Dependencies:** None  
**Parallel:** Can work with Feature 2

---

#### Feature 2: Advanced Filtering
**Tasks:**
1. Create filter UI components (1 day)
2. Add date range pickers (0.5 days)
3. Implement agent filter logic (0.5 days)
4. Implement date range filters (0.5 days)
5. Implement plan type/appliance count/boiler filters (0.5 days)
6. Add filter state persistence (0.5 days)
7. Integrate with admin.js, processor.js, crm.js (0.5 days)

**Dependencies:** None  
**Parallel:** Can work with Feature 1

---

#### Feature 3: Bulk Delete Operations
**Tasks:**
1. Create bulk operations component (0.5 days)
2. Add delete functionality (0.5 days)
3. Add confirmation dialog (0.5 days)
4. Add progress tracking (0.5 days)
5. Integrate with admin.js and crm.js (0.5 days)

**Dependencies:** bulk-selection.js (exists)  
**Parallel:** Can work with Features 1 and 2

---

#### Feature 4: Real-time Duplicate Detection
**Tasks:**
1. Create duplicate detection service (1 day)
2. Implement phone number matching (1 day)
3. Implement email matching (0.5 days)
4. Implement name matching (0.5 days)
5. Add confidence scoring (1 day)
6. Create UI components (visual feedback) (1 day)
7. Integrate with form (0.5 days)
8. Add override system (0.5 days)
9. Testing (1 day)

**Dependencies:** None  
**Sequential:** Should be after quick wins

---

### Phase 1 Timeline

**Week 1:**
- Days 1-2: Enhanced CSV Export (parallel with Advanced Filtering)
- Days 1-2: Advanced Filtering (parallel with Enhanced CSV)
- Days 3-4: Bulk Delete Operations (parallel)
- Day 5: Integration and testing

**Week 2-3:**
- Days 6-12: Real-time Duplicate Detection

**Total:** 13-19 days (2-3 weeks)

---

## Phase 2: Important Features (P1)

**Duration:** 1-2 weeks  
**Effort:** 8-11 days  
**Priority:** Should Have

### Features

5. **Bulk Export Selected** - 1-2 days
6. **Smart Input Handling** - 2-3 days
7. **Sales Import System** - 4-5 days

### Task Breakdown

#### Feature 5: Bulk Export Selected
**Tasks:**
1. Modify export functions to accept selection filter (0.5 days)
2. Add "Export Selected" button (0.5 days)
3. Update UI to show selection count (0.5 days)

**Dependencies:** bulk-selection.js, existing CSV export  
**Effort:** 1-2 days

---

#### Feature 6: Smart Input Handling
**Tasks:**
1. Enhance paste event listeners (0.5 days)
2. Add auto-formatting for sort code (0.5 days)
3. Add auto-formatting for account number (0.5 days)
4. Add real-time validation (0.5 days)
5. Testing (0.5 days)

**Dependencies:** None  
**Effort:** 2-3 days

---

#### Feature 7: Sales Import System
**Tasks:**
1. Enhance existing lead upload (1 day)
2. Add Firebase format support (1 day)
3. Improve validation (1 day)
4. Add error reporting (1 day)
5. Testing (1 day)

**Dependencies:** Existing lead upload (crm-leads.js)  
**Effort:** 4-5 days

---

### Phase 2 Timeline

**Week 4:**
- Days 1-2: Bulk Export Selected
- Days 3-5: Smart Input Handling

**Week 5:**
- Days 6-10: Sales Import System

**Total:** 8-11 days (1-2 weeks)

---

## Phase 3: Future Features (P2)

**Duration:** 3-4 weeks  
**Effort:** 17-25 days  
**Priority:** Could Have

### Features

8. **Deduplication in Exports** - 2-3 days
9. **SMS Messaging** - 7-10 days
10. **Document Generation** - 8-12 days

### Task Breakdown

#### Feature 8: Deduplication in Exports
**Tasks:**
1. Create deduplication service (1 day)
2. Integrate with export functions (0.5 days)
3. Add deduplication options UI (0.5 days)
4. Testing (0.5 days)

**Dependencies:** REQ-DUP-001 (duplicate detection)  
**Effort:** 2-3 days

---

#### Feature 9: SMS Messaging
**Tasks:**
1. Research and select SMS service (0.5 days)
2. Integrate SMS service (2 days)
3. Create SMS UI (1.5 days)
4. Add template management (1.5 days)
5. Add delivery tracking (1.5 days)
6. Testing (1 day)

**Dependencies:** SMS service (Twilio, etc.)  
**Effort:** 7-10 days

---

#### Feature 10: Document Generation
**Tasks:**
1. Research and select PDF library (0.5 days)
2. Create template system (2 days)
3. Implement PDF generation (2 days)
4. Add file management (1.5 days)
5. Add version control (1 day)
6. Add download tracking (1 day)
7. Testing (1 day)

**Dependencies:** PDF library (jsPDF, PDFKit)  
**Effort:** 8-12 days

---

### Phase 3 Timeline

**Week 6:**
- Days 1-3: Deduplication in Exports

**Week 7-8:**
- Days 4-13: SMS Messaging

**Week 9-10:**
- Days 14-25: Document Generation

**Total:** 17-25 days (3-4 weeks)

---

## Overall Timeline

### Sequential Timeline
- **Phase 1:** 2-3 weeks (13-19 days)
- **Phase 2:** 1-2 weeks (8-11 days)
- **Phase 3:** 3-4 weeks (17-25 days)
- **Total:** 7-11 weeks (38-55 days)

### Parallel Timeline (Optimized)
- **Phase 1:** 2 weeks (13 days with parallel work)
- **Phase 2:** 1.5 weeks (10 days)
- **Phase 3:** 3 weeks (20 days)
- **Total:** 6.5-7 weeks (43 days)

---

## Critical Path

### Must Complete in Order

1. **Enhanced CSV Export** (Week 1)
   ↓
2. **Advanced Filtering** (Week 1) - Parallel
   ↓
3. **Bulk Delete** (Week 1) - Parallel
   ↓
4. **Real-time Duplicate Detection** (Week 2-3)
   ↓
5. **Bulk Export Selected** (Week 4) - Depends on Enhanced CSV
   ↓
6. **Smart Input Handling** (Week 4) - Parallel
   ↓
7. **Sales Import** (Week 5)

---

## Risk Assessment

### High Risk
- **Real-time Duplicate Detection:** Complex matching logic, performance concerns
- **Sales Import System:** Data validation complexity, format variations

### Medium Risk
- **Enhanced CSV Export:** Field mapping complexity, backward compatibility
- **SMS Messaging:** External service dependency, cost considerations

### Low Risk
- **Bulk Delete:** Straightforward implementation
- **Advanced Filtering:** Well-understood patterns
- **Bulk Export Selected:** Simple extension

---

## Success Criteria

### Phase 1 Complete When:
- ✅ Enhanced CSV export includes 160+ fields
- ✅ Advanced filtering works for all filter types
- ✅ Bulk delete works with confirmation
- ✅ Real-time duplicate detection works in form

### Phase 2 Complete When:
- ✅ Bulk export selected works
- ✅ Smart input handling works for banking details
- ✅ Sales import supports CSV/JSON/Firebase formats

### Phase 3 Complete When:
- ✅ Deduplication in exports works
- ✅ SMS messaging functional (if implemented)
- ✅ Document generation functional (if implemented)

---

**Implementation Plan Complete**
