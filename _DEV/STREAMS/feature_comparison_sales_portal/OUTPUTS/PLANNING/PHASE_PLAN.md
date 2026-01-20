---
title: "Phase Plan and Task Sequencing"
created: 2026-01-19
workflow: PLANNING_STANDARD_AI
step: planning-step-3
status: Complete
---

# Phase Plan and Task Sequencing

**Stream:** feature_comparison_sales_portal  
**Date:** 2026-01-19  
**Workflow:** PLANNING_STANDARD_AI  
**Step:** planning-step-3

---

## Overview

**Total Phases:** 3  
**Total Tasks:** 95  
**Total Effort:** 38-55 days  
**Calendar Time (with parallelization):** 25-35 days

---

## Phase 1: Critical Features (P0)

**Duration:** 2-3 weeks  
**Effort:** 13-19 days  
**Tasks:** 46  
**Requirements:** 4

### Week 1: Foundation Services (Parallel Build)

**Days 1-2: Service Creation (Parallel)**
- **TASK-DUP-001-01 to 06:** duplicate-detection-service.js (2 days)
  - Create structure
  - Phone matching
  - Email matching
  - Name matching
  - Confidence scoring
  - Database queries

- **TASK-EXP-001-01 to 08:** export-service.js (3 days) - **Parallel**
  - Create structure
  - Field mapping design
  - Customer fields
  - Financial fields
  - Technical fields
  - Appliance details (up to 10)
  - Boiler details
  - CSV generation

- **TASK-FIL-001-01:** date-range-picker.js (0.5 days) - **Parallel**
- **TASK-INPUT-001-01:** input-formatter.js (0.5 days) - **Parallel**

**Days 3-4: UI Components (After Services)**

- **TASK-DUP-001-07:** duplicate-warning.js (1 day)
  - Depends on: duplicate-detection-service.js

- **TASK-EXP-001-09:** field-mapping-ui.js (1 day) - **Parallel**
  - Depends on: export-service.js

- **TASK-BULK-001-01 to 04:** bulk-operations.js (2 days) - **Parallel**
  - Create structure
  - Bulk delete
  - Confirmation dialog
  - Progress tracking

- **TASK-FIL-001-02 to 08:** filter-component.js enhancement (2.5 days) - **Parallel**
  - Agent filter
  - Date range filter
  - DD date filter
  - Plan type filter
  - Appliance count filter
  - Boiler cover filter
  - Filter combination logic

**Day 5: Component Enhancements**

- **TASK-BULK-001-05:** bulk-selection.js enhancement (0.5 days)
- **TASK-FIL-001-09:** Filter state persistence (0.5 days)

### Week 2: Integration (Parallel)

**Days 6-8: Integration (Parallel)**

- **TASK-DUP-001-08 to 11:** app.js integration (2 days)
  - Duplicate detection integration
  - Override system
  - Visual feedback styling

- **TASK-EXP-001-10:** admin.js export integration (1 day) - **Parallel**
- **TASK-EXP-001-11:** processor.js export integration (1 day) - **Parallel**
- **TASK-EXP-001-12:** crm-reports.js export integration (0.5 days) - **Parallel**

- **TASK-FIL-001-10:** admin.js, processor.js, crm.js filter integration (1 day) - **Parallel**

- **TASK-BULK-001-06:** admin.js bulk operations integration (0.5 days) - **Parallel**
- **TASK-BULK-001-07:** crm.js bulk operations integration (0.5 days) - **Parallel**

**Day 9: Testing**

- **TASK-DUP-001-12:** Duplicate detection testing (1 day)
- **TASK-EXP-001-14:** Enhanced CSV export testing (1 day)
- **TASK-FIL-001-11:** Advanced filtering testing (0.5 days)
- **TASK-BULK-001-08:** Bulk delete testing (0.5 days)

**Day 10: Documentation and Polish**

- **TASK-EXP-001-15:** Field mapping documentation (0.25 days)
- **TASK-EXP-001-13:** Filtered data export support (0.25 days)
- Integration testing and bug fixes (0.5 days)

**Phase 1 Total:** 10 days (with parallelization) or 13-19 days (sequential)

---

## Phase 2: Important Features (P1)

**Duration:** 1-2 weeks  
**Effort:** 8-11 days  
**Tasks:** 23  
**Requirements:** 3

### Week 3: Services and Enhancements (Parallel)

**Days 11-13: Service Creation (Parallel)**

- **TASK-IMP-001-01 to 08:** import-service.js (4 days)
  - Create structure
  - CSV parser
  - JSON parser
  - Firebase format parser
  - Data validation
  - Appliance parsing
  - Error reporting
  - Progress tracking

- **TASK-EXP-002-01:** export-service.js enhancement (bulk export) (0.5 days) - **Parallel**
- **TASK-INPUT-001-01 to 04:** input-formatter.js completion (2 days) - **Parallel**

**Day 14: UI Updates**

- **TASK-EXP-002-02 to 03:** bulk-selection.js UI updates (0.5 days)
- **TASK-IMP-001-09:** crm-leads.js upload UI enhancement (0.5 days)

**Days 15-16: Integration (Parallel)**

- **TASK-IMP-001-10:** crm-leads.js import integration (0.5 days)
- **TASK-IMP-001-11:** admin.js import UI (0.5 days)
- **TASK-EXP-002-04:** admin.js, processor.js, crm.js export selected integration (0.5 days)
- **TASK-INPUT-001-05:** app.js input formatter integration (0.5 days)

**Day 17: Testing**

- **TASK-IMP-001-12:** Sales import testing (1 day)
- **TASK-EXP-002-05:** Bulk export selected testing (0.5 days)
- **TASK-INPUT-001-06:** Smart input handling testing (0.5 days)

**Phase 2 Total:** 7 days (with parallelization) or 8-11 days (sequential)

---

## Phase 3: Future Features (P2)

**Duration:** 3-4 weeks  
**Effort:** 17-25 days  
**Tasks:** 27  
**Requirements:** 3

### Week 4-5: Services (Parallel)

**Days 18-21: Service Creation (Parallel)**

- **TASK-SMS-001-01 to 06:** sms-service.js (7 days)
  - Research and select service
  - Create structure
  - API integration
  - Bulk SMS
  - Template system
  - Delivery tracking

- **TASK-DOC-001-01 to 07:** document-service.js + pdf-generator.js (8 days) - **Parallel**
  - Research and select library
  - Create structure
  - Template management
  - Template versioning
  - PDF library integration
  - PDF generation
  - File management

- **TASK-DEDUP-001-01 to 02:** export-service.js deduplication enhancement (1.5 days) - **Parallel**

### Week 6-7: UI Components

**Days 22-24: UI Component Creation**

- **TASK-SMS-001-07 to 08:** sms-ui.js (3 days)
  - Depends on: sms-service.js

- **TASK-DOC-001-09 to 10:** document-template-ui.js (3.5 days) - **Parallel**
  - Depends on: document-service.js, pdf-generator.js

- **TASK-DEDUP-001-03 to 04:** Deduplication UI (1 day) - **Parallel**

### Week 8: Integration and Testing

**Days 25-26: Integration**

- **TASK-SMS-001-09:** admin.js SMS integration (0.5 days)
- **TASK-DOC-001-11:** admin.js document integration (1 day)
- **TASK-DEDUP-001-05:** Export deduplication integration (0.5 days)

**Day 27: Testing**

- **TASK-SMS-001-10:** SMS messaging testing (1 day)
- **TASK-DOC-001-12:** Document generation testing (1 day)
- **TASK-DEDUP-001-05:** Deduplication testing (0.5 days)

**Phase 3 Total:** 10 days (with parallelization) or 17-25 days (sequential)

---

## Overall Timeline

### Sequential Timeline
- **Phase 1:** 13-19 days (2-3 weeks)
- **Phase 2:** 8-11 days (1-2 weeks)
- **Phase 3:** 17-25 days (3-4 weeks)
- **Total:** 38-55 days (7-11 weeks)

### Parallel Timeline (Optimized)
- **Phase 1:** 10 days (2 weeks)
- **Phase 2:** 7 days (1 week)
- **Phase 3:** 10 days (2 weeks)
- **Total:** 27 days (5-6 weeks)

---

## Critical Path

### Phase 1 Critical Path
1. duplicate-detection-service.js (2 days)
   ↓
2. duplicate-warning.js (1 day)
   ↓
3. app.js integration (2 days)
   ↓
4. Testing (1 day)

**Parallel:** export-service.js, date-range-picker.js, input-formatter.js can be built simultaneously

### Phase 2 Critical Path
1. import-service.js (4 days)
   ↓
2. crm-leads.js integration (0.5 days)
   ↓
3. Testing (1 day)

**Parallel:** export-service enhancement, input-formatter completion can be built simultaneously

### Phase 3 Critical Path
1. sms-service.js (7 days)
   ↓
2. sms-ui.js (3 days)
   ↓
3. admin.js integration (0.5 days)
   ↓
4. Testing (1 day)

**Parallel:** document-service.js, pdf-generator.js, export-service deduplication can be built simultaneously

---

## Parallel Work Opportunities

### Phase 1 Parallel Groups
1. **Services (Days 1-2):**
   - duplicate-detection-service.js
   - export-service.js
   - date-range-picker.js
   - input-formatter.js

2. **UI Components (Days 3-4):**
   - duplicate-warning.js
   - field-mapping-ui.js
   - bulk-operations.js
   - filter-component.js enhancement

3. **Integration (Days 6-8):**
   - app.js
   - admin.js
   - processor.js
   - crm.js
   - crm-reports.js

### Phase 2 Parallel Groups
1. **Services (Days 11-13):**
   - import-service.js
   - export-service.js enhancement
   - input-formatter.js completion

2. **Integration (Days 15-16):**
   - crm-leads.js
   - admin.js
   - processor.js
   - crm.js
   - app.js

### Phase 3 Parallel Groups
1. **Services (Days 18-21):**
   - sms-service.js
   - document-service.js
   - pdf-generator.js
   - export-service.js deduplication

2. **UI Components (Days 22-24):**
   - sms-ui.js
   - document-template-ui.js
   - Deduplication UI

---

## Risk Mitigation

### High-Risk Areas
1. **duplicate-detection-service.js:** Complex matching logic
   - **Mitigation:** Start early, thorough testing
   - **Contingency:** Simplified matching if needed

2. **export-service.js:** 160+ field mapping complexity
   - **Mitigation:** Incremental field addition
   - **Contingency:** Phased field rollout

3. **import-service.js:** Data validation complexity
   - **Mitigation:** Comprehensive validation rules
   - **Contingency:** Manual review option

### Medium-Risk Areas
1. **SMS service integration:** External API dependency
   - **Mitigation:** Early API research, fallback options
   - **Contingency:** Defer if API issues

2. **PDF generation:** Library complexity
   - **Mitigation:** Library research, proof of concept
   - **Contingency:** Alternative library or defer

---

## Success Criteria

### Phase 1 Complete When:
- ✅ All P0 features implemented
- ✅ Enhanced CSV export includes 160+ fields
- ✅ Advanced filtering works for all types
- ✅ Bulk delete works with confirmation
- ✅ Real-time duplicate detection works in form
- ✅ All features tested and deployed

### Phase 2 Complete When:
- ✅ All P1 features implemented
- ✅ Sales import supports CSV/JSON/Firebase
- ✅ Bulk export selected works
- ✅ Smart input handling works
- ✅ All features tested and deployed

### Phase 3 Complete When:
- ✅ All P2 features implemented (if proceeding)
- ✅ SMS messaging functional (if implemented)
- ✅ Document generation functional (if implemented)
- ✅ Deduplication in exports works
- ✅ All features tested and deployed

---

**Phase Plan Complete**
