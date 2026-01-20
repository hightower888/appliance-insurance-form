---
title: "Component Dependency Graph"
created: 2026-01-19
workflow: PLANNING_STANDARD_AI
step: planning-step-1
status: Complete
---

# Component Dependency Graph

**Stream:** feature_comparison_sales_portal  
**Date:** 2026-01-19  
**Workflow:** PLANNING_STANDARD_AI  
**Step:** planning-step-1

---

## Dependency Overview

**Total Components:** 23 (15 new + 8 enhanced)  
**Dependency Levels:** 3  
**Critical Path:** Foundation Services → UI Components → Integration

---

## Dependency Levels

### Level 0: Foundation Services (No Dependencies)
**Build first - core business logic services**

1. **`services/duplicate-detection-service.js`**
   - No dependencies
   - Used by: duplicate-warning.js, export-service.js (deduplication)
   - Priority: P0
   - Effort: 1-2 days

2. **`services/export-service.js`**
   - No dependencies
   - Used by: admin.js, processor.js, crm-reports.js, bulk-operations.js
   - Priority: P0
   - Effort: 2-3 days

3. **`services/import-service.js`**
   - No dependencies
   - Used by: crm-leads.js, admin.js
   - Priority: P1
   - Effort: 2-3 days

4. **`utils/input-formatter.js`**
   - No dependencies
   - Used by: app.js
   - Priority: P1
   - Effort: 1 day

5. **`services/sms-service.js`**
   - External dependency: SMS API (Twilio, etc.)
   - Used by: sms-ui.js
   - Priority: P2
   - Effort: 3-4 days

6. **`services/document-service.js`**
   - No dependencies (uses Firebase Storage)
   - Used by: document-template-ui.js
   - Priority: P2
   - Effort: 2-3 days

7. **`utils/pdf-generator.js`**
   - External dependency: PDF library (jsPDF, PDFKit)
   - Used by: document-service.js
   - Priority: P2
   - Effort: 2-3 days

---

### Level 1: UI Components (Depends on Level 0)
**Build after foundation services**

8. **`components/duplicate-warning.js`**
   - Depends on: duplicate-detection-service.js
   - Used by: app.js
   - Priority: P0
   - Effort: 1 day

9. **`components/field-mapping-ui.js`**
   - Depends on: export-service.js
   - Used by: admin.js, processor.js
   - Priority: P0
   - Effort: 1 day

10. **`components/date-range-picker.js`**
    - No dependencies (standalone)
    - Used by: filter-component.js
    - Priority: P0
    - Effort: 0.5 days

11. **`components/bulk-operations.js`**
    - Depends on: bulk-selection.js (exists)
    - Used by: admin.js, crm.js
    - Priority: P0
    - Effort: 1-2 days

12. **`components/sms-ui.js`**
    - Depends on: sms-service.js
    - Used by: admin.js
    - Priority: P2
    - Effort: 2-3 days

13. **`components/document-template-ui.js`**
    - Depends on: document-service.js, pdf-generator.js
    - Used by: admin.js
    - Priority: P2
    - Effort: 2-3 days

---

### Level 2: Enhanced Components (Depends on Level 1)
**Build after UI components**

14. **`components/filter-component.js` (ENHANCE)**
    - Depends on: date-range-picker.js
    - Used by: admin.js, processor.js, crm.js
    - Priority: P0
    - Effort: 1-2 days

15. **`components/bulk-selection.js` (ENHANCE)**
    - No new dependencies (exists)
    - Used by: bulk-operations.js, export-service.js
    - Priority: P0
    - Effort: 0.5 days

16. **`services/export-service.js` (ENHANCE for deduplication)**
    - Depends on: duplicate-detection-service.js (for REQ-DEDUP-001)
    - Used by: All export functions
    - Priority: P2
    - Effort: 1 day

---

### Level 3: Integration Points (Depends on All Levels)
**Integrate components into main application files**

17. **`src/app.js` (ENHANCE)**
    - Depends on: duplicate-warning.js, input-formatter.js
    - Priority: P0 (duplicate), P1 (input)
    - Effort: 1 day (duplicate), 1 day (input)

18. **`src/admin.js` (ENHANCE)**
    - Depends on: export-service.js, filter-component.js, bulk-operations.js, import-service.js, sms-ui.js, document-template-ui.js
    - Priority: P0 (export, filter, bulk), P1 (import), P2 (SMS, docs)
    - Effort: 2-3 days

19. **`src/processor.js` (ENHANCE)**
    - Depends on: export-service.js, filter-component.js
    - Priority: P0
    - Effort: 1-2 days

20. **`src/crm.js` (ENHANCE)**
    - Depends on: filter-component.js, bulk-operations.js
    - Priority: P0
    - Effort: 1-2 days

21. **`src/crm-reports.js` (ENHANCE)**
    - Depends on: export-service.js
    - Priority: P0
    - Effort: 0.5 days

22. **`src/crm-leads.js` (ENHANCE)**
    - Depends on: import-service.js
    - Priority: P1
    - Effort: 1 day

---

## Critical Path

### Phase 1: Foundation (P0)
1. **duplicate-detection-service.js** (1-2 days)
   ↓
2. **export-service.js** (2-3 days) - Parallel with #1
   ↓
3. **duplicate-warning.js** (1 day) - After #1
   ↓
4. **field-mapping-ui.js** (1 day) - After #2
   ↓
5. **date-range-picker.js** (0.5 days) - Parallel
   ↓
6. **bulk-operations.js** (1-2 days) - After bulk-selection.js enhancement
   ↓
7. **filter-component.js enhancement** (1-2 days) - After #5
   ↓
8. **Integration** (admin.js, processor.js, crm.js, app.js, crm-reports.js) (4-6 days)

**Total Phase 1:** 13-19 days

---

### Phase 2: Enhancements (P1)
1. **import-service.js** (2-3 days)
   ↓
2. **input-formatter.js** (1 day) - Parallel
   ↓
3. **export-service.js enhancement** (bulk export selected) (0.5 days)
   ↓
4. **Integration** (crm-leads.js, app.js, admin.js, processor.js, crm.js) (2-3 days)

**Total Phase 2:** 8-11 days

---

### Phase 3: Advanced (P2)
1. **sms-service.js** (3-4 days)
   ↓
2. **document-service.js** (2-3 days) - Parallel
   ↓
3. **pdf-generator.js** (2-3 days) - Parallel
   ↓
4. **sms-ui.js** (2-3 days) - After #1
   ↓
5. **document-template-ui.js** (2-3 days) - After #2, #3
   ↓
6. **export-service.js enhancement** (deduplication) (1 day) - After duplicate-detection-service.js
   ↓
7. **Integration** (admin.js) (1-2 days)

**Total Phase 3:** 17-25 days

---

## Parallel Build Opportunities

### Can Build in Parallel (Phase 1)
- duplicate-detection-service.js + export-service.js
- date-range-picker.js + field-mapping-ui.js
- bulk-operations.js + filter-component.js enhancement

### Can Build in Parallel (Phase 2)
- import-service.js + input-formatter.js
- export-service.js enhancement (bulk export) + integration work

### Can Build in Parallel (Phase 3)
- sms-service.js + document-service.js + pdf-generator.js
- sms-ui.js + document-template-ui.js (after their services)

---

## Dependency Matrix

| Component | Depends On | Used By |
|-----------|------------|---------|
| duplicate-detection-service.js | None | duplicate-warning.js, export-service.js |
| export-service.js | None | admin.js, processor.js, crm-reports.js, bulk-operations.js |
| import-service.js | None | crm-leads.js, admin.js |
| input-formatter.js | None | app.js |
| duplicate-warning.js | duplicate-detection-service.js | app.js |
| field-mapping-ui.js | export-service.js | admin.js, processor.js |
| date-range-picker.js | None | filter-component.js |
| bulk-operations.js | bulk-selection.js | admin.js, crm.js |
| filter-component.js (enhanced) | date-range-picker.js | admin.js, processor.js, crm.js |
| sms-service.js | External API | sms-ui.js |
| document-service.js | pdf-generator.js | document-template-ui.js |
| pdf-generator.js | External library | document-service.js |

---

## Build Order Recommendation

### Week 1-2: Foundation Services
1. duplicate-detection-service.js
2. export-service.js
3. date-range-picker.js
4. input-formatter.js (P1, can start early)

### Week 2-3: UI Components
5. duplicate-warning.js
6. field-mapping-ui.js
7. bulk-operations.js
8. filter-component.js enhancement

### Week 3-4: Integration
9. app.js integration
10. admin.js integration
11. processor.js integration
12. crm.js integration
13. crm-reports.js integration

### Week 4-5: P1 Features
14. import-service.js
15. export-service.js enhancement (bulk export)
16. Integration (crm-leads.js, etc.)

### Week 6+: P2 Features (Optional)
17. sms-service.js
18. document-service.js
19. pdf-generator.js
20. sms-ui.js
21. document-template-ui.js
22. export-service.js enhancement (deduplication)

---

**Component Dependency Graph Complete**
