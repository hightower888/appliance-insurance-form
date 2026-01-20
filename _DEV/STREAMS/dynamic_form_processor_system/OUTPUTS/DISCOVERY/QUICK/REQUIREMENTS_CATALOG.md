# Requirements Catalog

**Generated:** 2026-01-08  
**Source:** STREAM_INTENT.md  
**Workflow:** DISCOVERY_QUICK

---

## Requirements Summary

| Priority | Count |
|----------|-------|
| Critical | 25 |
| High | 8 |
| Medium | 5 |
| Low | 2 |
| **Total** | **40** |

---

## Critical Requirements (25)

### Dynamic Form Field Management (8)

**REQ-DFM-001** - Admin can add new form fields  
- **Type:** Functional  
- **Category:** Dynamic Form Management  
- **Description:** Admin interface to add new form fields with types: text, email, tel, number, select, textarea, checkbox, radio  
- **Acceptance Criteria:** Admin can create new field, specify type, label, and validation rules  
- **Dependencies:** Database schema for form_fields

**REQ-DFM-002** - Admin can remove existing fields  
- **Type:** Functional  
- **Category:** Dynamic Form Management  
- **Description:** Admin can delete form fields from configuration  
- **Acceptance Criteria:** Field removed from config, form updates dynamically, existing submissions preserved  
- **Dependencies:** REQ-DFM-001

**REQ-DFM-003** - Admin can toggle required status  
- **Type:** Functional  
- **Category:** Dynamic Form Management  
- **Description:** Admin can mark any field as required or optional  
- **Acceptance Criteria:** Required status saved, validation rules updated, form reflects changes  
- **Dependencies:** REQ-DFM-001

**REQ-DFM-004** - Field configuration stored in database  
- **Type:** Technical  
- **Category:** Dynamic Form Management  
- **Description:** All field configurations persisted in Firebase Realtime Database under `form_fields`  
- **Acceptance Criteria:** CRUD operations work, data persists across sessions  
- **Dependencies:** Database schema design

**REQ-DFM-005** - Form dynamically renders based on configuration  
- **Type:** Functional  
- **Category:** Dynamic Form Management  
- **Description:** Form HTML/JS generates fields from database configuration at runtime  
- **Acceptance Criteria:** Form displays all configured fields in correct order, handles all field types  
- **Dependencies:** REQ-DFM-004

**REQ-DFM-006** - Validation rules applied based on field type and required status  
- **Type:** Functional  
- **Category:** Dynamic Form Management  
- **Description:** Client-side and server-side validation based on field configuration  
- **Acceptance Criteria:** Required fields validated, type-specific validation (email format, number range, etc.)  
- **Dependencies:** REQ-DFM-005

**REQ-DFM-007** - Field ordering/sequencing  
- **Type:** Functional  
- **Category:** Dynamic Form Management  
- **Description:** Admin can reorder fields, fields display in specified order  
- **Acceptance Criteria:** Order field in config, form respects order  
- **Dependencies:** REQ-DFM-001

**REQ-DFM-008** - Backward compatibility with existing submissions  
- **Type:** Technical  
- **Category:** Dynamic Form Management  
- **Description:** Existing sales data remains accessible even if fields are removed  
- **Acceptance Criteria:** Old submissions viewable, no data loss  
- **Dependencies:** Database migration strategy

### Enhanced Admin Sales Table (7)

**REQ-ADM-001** - Display ALL collected fields from form submissions  
- **Type:** Functional  
- **Category:** Admin Table  
- **Description:** Admin table shows every field collected in each submission, not just summary  
- **Acceptance Criteria:** All fields visible, expandable rows or wide table, responsive design  
- **Dependencies:** Dynamic field system

**REQ-ADM-002** - Searchable across all fields  
- **Type:** Functional  
- **Category:** Admin Table  
- **Description:** Search box searches through all field values in all submissions  
- **Acceptance Criteria:** Real-time search, highlights matches, searches nested data (appliances, contact info)  
- **Dependencies:** REQ-ADM-001

**REQ-ADM-003** - Filterable by field values  
- **Type:** Functional  
- **Category:** Admin Table  
- **Description:** Filter dropdowns/controls for date range, agent, plan type, etc.  
- **Acceptance Criteria:** Multiple filters combinable, clear filters option, filters persist in URL  
- **Dependencies:** REQ-ADM-001

**REQ-ADM-004** - Sortable by any column  
- **Type:** Functional  
- **Category:** Admin Table  
- **Description:** Click column header to sort ascending/descending  
- **Acceptance Criteria:** Multi-column sort, sort indicator, handles all data types  
- **Dependencies:** REQ-ADM-001

**REQ-ADM-005** - Export to CSV with all fields  
- **Type:** Functional  
- **Category:** Admin Table  
- **Description:** Export button generates CSV with all submission data  
- **Acceptance Criteria:** CSV includes all fields, proper formatting, handles special characters  
- **Dependencies:** REQ-ADM-001

**REQ-ADM-006** - Pagination for large datasets  
- **Type:** Functional  
- **Category:** Admin Table  
- **Description:** Table paginated when >50 rows, page size configurable  
- **Acceptance Criteria:** Page navigation, page size selector, shows "X of Y" results  
- **Dependencies:** REQ-ADM-001

**REQ-ADM-007** - Column visibility toggle  
- **Type:** Functional  
- **Category:** Admin Table  
- **Description:** Admin can show/hide columns to customize view  
- **Acceptance Criteria:** Column selector UI, preferences saved, responsive to hidden columns  
- **Dependencies:** REQ-ADM-001

### Processor Role & Authentication (5)

**REQ-PRO-001** - New user role: "processor"  
- **Type:** Technical  
- **Category:** Authentication  
- **Description:** Add processor role to user system, update database rules  
- **Acceptance Criteria:** Role stored in users table, auth system recognizes processor role  
- **Dependencies:** Database schema update, auth-db.js update

**REQ-PRO-002** - Processor login redirects to processor dashboard  
- **Type:** Functional  
- **Category:** Authentication  
- **Description:** After login, processor users redirected to processor.html (not admin.html or appliance_form.html)  
- **Acceptance Criteria:** Login flow checks role, redirects appropriately  
- **Dependencies:** REQ-PRO-001, auth-db.js

**REQ-PRO-003** - Processors can view sales data  
- **Type:** Functional  
- **Category:** Processor Dashboard  
- **Description:** Processor dashboard displays sales data (read-only or with export permissions)  
- **Acceptance Criteria:** Sales table visible, same data as admin (possibly filtered), export enabled  
- **Dependencies:** REQ-PRO-002, processor.html

**REQ-PRO-004** - Processors have their own profile/settings page  
- **Type:** Functional  
- **Category:** Processor Dashboard  
- **Description:** Processor can access profile page to manage settings, mappings, preferences  
- **Acceptance Criteria:** Profile page accessible, settings persist, UI intuitive  
- **Dependencies:** REQ-PRO-002

**REQ-PRO-005** - Database rules for processor access  
- **Type:** Technical  
- **Category:** Security  
- **Description:** Firebase rules allow processors to read sales data, read/write their own profile  
- **Acceptance Criteria:** Rules deployed, processors can access data, cannot modify sales  
- **Dependencies:** REQ-PRO-001, database.rules.json

### CSV Field Mapping System (5)

**REQ-CSV-001** - Processor can view/download sales data as CSV  
- **Type:** Functional  
- **Category:** CSV Export  
- **Description:** Processor dashboard has export button to download CSV  
- **Acceptance Criteria:** CSV downloads with all sales data, proper formatting  
- **Dependencies:** REQ-PRO-003

**REQ-CSV-002** - Processor can map form field names to custom CSV column names  
- **Type:** Functional  
- **Category:** CSV Mapping  
- **Description:** UI to map each form field to a custom CSV column name (e.g., "Name" → "Customer Name")  
- **Acceptance Criteria:** Mapping interface, preview of mapped columns, validation  
- **Dependencies:** REQ-CSV-001

**REQ-CSV-003** - Mapping rules saved per processor  
- **Type:** Functional  
- **Category:** CSV Mapping  
- **Description:** Each processor's mapping rules saved to their profile  
- **Acceptance Criteria:** Mappings persist, loaded on login, can be edited  
- **Dependencies:** REQ-PRO-004, processor_profiles database

**REQ-CSV-004** - CSV export uses processor's mapping rules  
- **Type:** Functional  
- **Category:** CSV Export  
- **Description:** When processor exports CSV, column headers use their custom mappings  
- **Acceptance Criteria:** CSV headers match mappings, data correctly aligned  
- **Dependencies:** REQ-CSV-002, REQ-CSV-003

**REQ-CSV-005** - Multiple mapping profiles per processor (optional)  
- **Type:** Functional  
- **Category:** CSV Mapping  
- **Description:** Processor can save multiple mapping profiles and switch between them  
- **Acceptance Criteria:** Profile selector, save/load profiles, default profile  
- **Dependencies:** REQ-CSV-003

---

## High Priority Requirements (8)

**REQ-HIGH-001** - Field validation configuration  
- **Type:** Functional  
- **Category:** Dynamic Form Management  
- **Description:** Admin can configure validation rules (min/max length, regex patterns, number ranges)  
- **Priority:** High

**REQ-HIGH-002** - Field grouping/sections  
- **Type:** Functional  
- **Category:** Dynamic Form Management  
- **Description:** Admin can organize fields into sections/groups  
- **Priority:** High

**REQ-HIGH-003** - Bulk field operations  
- **Type:** Functional  
- **Category:** Dynamic Form Management  
- **Description:** Admin can select multiple fields and toggle required, delete, or reorder  
- **Priority:** High

**REQ-HIGH-004** - Advanced search (regex, field-specific)  
- **Type:** Functional  
- **Category:** Admin Table  
- **Description:** Advanced search with regex support, search specific fields only  
- **Priority:** High

**REQ-HIGH-005** - Saved filter presets  
- **Type:** Functional  
- **Category:** Admin Table  
- **Description:** Admin can save filter combinations as presets  
- **Priority:** High

**REQ-HIGH-006** - CSV export with processor mappings (admin view)  
- **Type:** Functional  
- **Category:** Admin Table  
- **Description:** Admin can see how each processor's CSV would look with their mappings  
- **Priority:** High

**REQ-HIGH-007** - Processor activity logging  
- **Type:** Functional  
- **Category:** Processor Dashboard  
- **Description:** Log when processors export CSVs, view data, update mappings  
- **Priority:** High

**REQ-HIGH-008** - Field migration tool  
- **Type:** Technical  
- **Category:** Dynamic Form Management  
- **Description:** Tool to migrate existing hardcoded fields to dynamic system  
- **Priority:** High

---

## Medium Priority Requirements (5)

**REQ-MED-001** - Field templates/presets  
- **Type:** Functional  
- **Category:** Dynamic Form Management  
- **Description:** Pre-built field templates (address, contact info, etc.)  
- **Priority:** Medium

**REQ-MED-002** - Field conditional logic  
- **Type:** Functional  
- **Category:** Dynamic Form Management  
- **Description:** Show/hide fields based on other field values  
- **Priority:** Medium

**REQ-MED-003** - Export formats (JSON, Excel)  
- **Type:** Functional  
- **Category:** CSV Export  
- **Description:** Support JSON and Excel export in addition to CSV  
- **Priority:** Medium

**REQ-MED-004** - Scheduled exports  
- **Type:** Functional  
- **Category:** CSV Export  
- **Description:** Processors can schedule automatic CSV exports  
- **Priority:** Medium

**REQ-MED-005** - Field usage analytics  
- **Type:** Functional  
- **Category:** Dynamic Form Management  
- **Description:** Show which fields are most/least used in submissions  
- **Priority:** Medium

---

## Low Priority Requirements (2)

**REQ-LOW-001** - Field translation/i18n  
- **Type:** Functional  
- **Category:** Dynamic Form Management  
- **Description:** Multi-language support for field labels  
- **Priority:** Low

**REQ-LOW-002** - Field versioning  
- **Type:** Technical  
- **Category:** Dynamic Form Management  
- **Description:** Track field configuration changes over time  
- **Priority:** Low

---

## Gap Analysis

### Identified Gaps

1. **Field Type Validation Details** - Need to specify exact validation rules for each field type
2. **Migration Strategy** - How to migrate existing 11 hardcoded fields to dynamic system
3. **Performance Considerations** - How to handle large datasets (1000+ submissions) in admin table
4. **CSV Mapping UI/UX** - Detailed wireframe/design for mapping interface
5. **Processor Permissions Granularity** - Exact permissions (read-only vs export vs view-only certain fields)

### Implicit Requirements (Inferred)

1. **Form Field Default Values** - Admin should be able to set default values for fields
2. **Field Help Text** - Admin can add help text/descriptions to fields
3. **Form Section Management** - Admin can create/manage form sections
4. **Submission Data Validation** - Server-side validation of dynamic fields
5. **Audit Trail** - Track who changed field configurations and when

---

## Conflicts & Dependencies

### No Conflicts Identified

### Key Dependencies

1. Dynamic Form Management → Enhanced Admin Table (table needs dynamic fields)
2. Processor Role → CSV Mapping (processors need role before mapping)
3. Field Configuration → Form Rendering (form needs config to render)
4. Processor Profiles → CSV Mapping (mappings stored in profiles)

---

## Requirements Quality Assessment

- **Clarity:** ✅ High - Requirements are well-defined
- **Testability:** ✅ High - Clear acceptance criteria
- **Completeness:** ⚠️ Medium - Some gaps identified above
- **Conflicts:** ✅ None identified
- **Dependencies:** ✅ Well-documented

**Overall:** Requirements are ready for Planning phase with minor clarifications needed on gaps.
