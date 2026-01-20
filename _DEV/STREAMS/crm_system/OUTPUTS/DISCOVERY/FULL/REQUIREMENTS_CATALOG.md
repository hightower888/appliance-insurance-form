---
title: "Requirements Catalog - CRM System"
created: 2026-01-18
workflow: DISCOVERY_FULL_AI
step: full-3
status: complete
---

# Requirements Catalog

**Stream:** crm_system  
**Created:** 2026-01-18  
**Workflow:** DISCOVERY_FULL_AI  
**Step:** full-3

---

## Requirements Summary

| Category | Count |
|----------|-------|
| **Functional** | 15 |
| **Non-Functional** | 10 |
| **Constraints** | 4 |
| **Total** | **29** |

---

## Functional Requirements

### Chunk 1: Core CRM Viewing (6 requirements)

#### REQ-001: View All Customers/Leads
- **ID:** REQ-001
- **Priority:** P0 (Critical)
- **Category:** Functional - Database Viewing
- **Description:** Display all customer/lead records from Firebase database in a list/table view
- **Source:** Explicit (STREAM_INTENT.md)
- **Acceptance Criteria:**
  - [ ] All records from `sales` node displayed
  - [ ] Records show key information (name, contact, status)
  - [ ] Loading indicator during data fetch
  - [ ] Empty state when no records

#### REQ-002: Navigate Through Records
- **ID:** REQ-002
- **Priority:** P0 (Critical)
- **Category:** Functional - Navigation
- **Description:** Navigate through customer/lead records with next/previous buttons
- **Source:** Explicit (STREAM_INTENT.md)
- **Acceptance Criteria:**
  - [ ] Next/Previous buttons functional
  - [ ] Current record indicator (e.g., "Record 5 of 100")
  - [ ] Keyboard navigation (arrow keys)
  - [ ] Wrap around or disable at boundaries

#### REQ-003: Search Functionality
- **ID:** REQ-003
- **Priority:** P1 (High)
- **Category:** Functional - Search/Filter
- **Description:** Search across all customer fields (name, email, phone, address, etc.)
- **Source:** Implicit (standard CRM feature)
- **Acceptance Criteria:**
  - [ ] Search input field
  - [ ] Real-time search results
  - [ ] Search across all text fields
  - [ ] Highlight search matches

#### REQ-004: Filter Functionality
- **ID:** REQ-004
- **Priority:** P1 (High)
- **Category:** Functional - Search/Filter
- **Description:** Filter records by disposition, status, date range, agent
- **Source:** Implicit (standard CRM feature)
- **Acceptance Criteria:**
  - [ ] Filter dropdowns (disposition, status, agent)
  - [ ] Date range picker
  - [ ] Multiple filters can be combined
  - [ ] Clear filters button

#### REQ-005: Sort Functionality
- **ID:** REQ-005
- **Priority:** P2 (Medium)
- **Category:** Functional - Search/Filter
- **Description:** Sort records by date, name, status, disposition, etc.
- **Source:** Implicit (standard CRM feature)
- **Acceptance Criteria:**
  - [ ] Sortable columns
  - [ ] Ascending/descending toggle
  - [ ] Visual sort indicators
  - [ ] Default sort (newest first)

#### REQ-006: Column Visibility
- **ID:** REQ-006
- **Priority:** P2 (Medium)
- **Category:** Functional - UI Customization
- **Description:** Show/hide columns in table view
- **Source:** Implicit (existing admin panel has this)
- **Acceptance Criteria:**
  - [ ] Column visibility menu
  - [ ] Toggle columns on/off
  - [ ] Persist preferences
  - [ ] Reset to default option

---

### Chunk 2: Record Management (5 requirements)

#### REQ-007: Edit Customer Details
- **ID:** REQ-007
- **Priority:** P0 (Critical)
- **Category:** Functional - Record Management
- **Description:** Edit customer contact information (name, email, phone, address, postcode)
- **Source:** Explicit (STREAM_INTENT.md)
- **Acceptance Criteria:**
  - [ ] Edit mode in detail view
  - [ ] Inline editing or modal form
  - [ ] Save changes to database
  - [ ] Validation before save
  - [ ] Success/error feedback

#### REQ-008: Edit Form Field Data
- **ID:** REQ-008
- **Priority:** P0 (Critical)
- **Category:** Functional - Record Management
- **Description:** Edit dynamic form field values for a customer record
- **Source:** Explicit (STREAM_INTENT.md)
- **Acceptance Criteria:**
  - [ ] Display all form fields
  - [ ] Edit field values
  - [ ] Respect field types (text, number, date, etc.)
  - [ ] Validate required fields
  - [ ] Save to database

#### REQ-009: Update Appliance Information
- **ID:** REQ-009
- **Priority:** P1 (High)
- **Category:** Functional - Record Management
- **Description:** Edit, add, or remove appliances from customer record
- **Source:** Explicit (STREAM_INTENT.md)
- **Acceptance Criteria:**
  - [ ] Display appliances list
  - [ ] Edit appliance details (type, make, model, age)
  - [ ] Add new appliances
  - [ ] Remove appliances
  - [ ] Update costs automatically

#### REQ-010: Save Changes to Database
- **ID:** REQ-010
- **Priority:** P0 (Critical)
- **Category:** Functional - Data Persistence
- **Description:** Save all edits to Firebase Realtime Database
- **Source:** Explicit (STREAM_INTENT.md)
- **Acceptance Criteria:**
  - [ ] Save button functionality
  - [ ] Update `updatedAt` timestamp
  - [ ] Handle save errors gracefully
  - [ ] Optimistic updates (UI updates immediately)
  - [ ] Rollback on error

#### REQ-011: Data Validation
- **ID:** REQ-011
- **Priority:** P1 (High)
- **Category:** Functional - Data Quality
- **Description:** Validate customer data before saving
- **Source:** Implicit (data integrity requirement)
- **Acceptance Criteria:**
  - [ ] Validate email format
  - [ ] Validate phone format
  - [ ] Validate postcode format
  - [ ] Validate required fields
  - [ ] Show validation errors

---

### Chunk 3: Lead Management (6 requirements)

#### REQ-012: Upload Customer Records
- **ID:** REQ-012
- **Priority:** P1 (High)
- **Category:** Functional - Lead Management
- **Description:** Upload customer records with appliances (CSV, JSON, or manual entry)
- **Source:** Explicit (STREAM_INTENT.md)
- **Acceptance Criteria:**
  - [ ] Upload form/interface
  - [ ] Support CSV import
  - [ ] Support JSON import
  - [ ] Manual entry form
  - [ ] Validate uploaded data
  - [ ] Create records in database

#### REQ-013: Cycle Through Leads
- **ID:** REQ-013
- **Priority:** P0 (Critical)
- **Category:** Functional - Lead Management
- **Description:** Navigate through leads with next/previous buttons
- **Source:** Explicit (STREAM_INTENT.md)
- **Acceptance Criteria:**
  - [ ] Next/Previous buttons
  - [ ] Current lead indicator
  - [ ] Filter to show only leads (not completed sales)
  - [ ] Keyboard shortcuts
  - [ ] Jump to specific lead

#### REQ-014: Disposition Tracking
- **ID:** REQ-014
- **Priority:** P0 (Critical)
- **Category:** Functional - Lead Management
- **Description:** Track lead dispositions (No answer, Not interested, Interested, Call back, Other)
- **Source:** Explicit (STREAM_INTENT.md)
- **Acceptance Criteria:**
  - [ ] Disposition dropdown/buttons
  - [ ] Options: No answer, Not interested, Interested, Call back, Other
  - [ ] Store disposition in database
  - [ ] Timestamp disposition change
  - [ ] Visual disposition indicator (badge/color)

#### REQ-015: Store Disposition in Database
- **ID:** REQ-015
- **Priority:** P0 (Critical)
- **Category:** Functional - Data Persistence
- **Description:** Save disposition to Firebase database with timestamp
- **Source:** Explicit (STREAM_INTENT.md)
- **Acceptance Criteria:**
  - [ ] Add `disposition` field to record
  - [ ] Add `dispositionDate` timestamp
  - [ ] Add `dispositionBy` (agent/admin who set it)
  - [ ] Update record in database
  - [ ] Handle errors

#### REQ-016: Lead Status Workflow
- **ID:** REQ-016
- **Priority:** P2 (Medium)
- **Category:** Functional - Lead Management
- **Description:** Track lead status (new, contacted, dispositioned, converted)
- **Source:** Implicit (workflow requirement)
- **Acceptance Criteria:**
  - [ ] Status field in database
  - [ ] Status transitions (new -> contacted -> dispositioned)
  - [ ] Status badges/indicators
  - [ ] Filter by status
  - [ ] Auto-update status on actions

#### REQ-017: Lead Source Tracking
- **ID:** REQ-017
- **Priority:** P2 (Medium)
- **Category:** Functional - Lead Management
- **Description:** Track where leads come from (upload, form submission, manual entry)
- **Source:** Implicit (analytics requirement)
- **Acceptance Criteria:**
  - [ ] `leadSource` field in database
  - [ ] Set source on creation
  - [ ] Display source in UI
  - [ ] Filter by source
  - [ ] Report on sources

---

### Chunk 4: Form Integration (3 requirements)

#### REQ-018: Paste Customer Details to Form
- **ID:** REQ-018
- **Priority:** P0 (Critical)
- **Category:** Functional - Form Integration
- **Description:** Paste customer details from CRM to form when disposition is positive
- **Source:** Explicit (STREAM_INTENT.md)
- **Acceptance Criteria:**
  - [ ] "Paste to Form" button/action
  - [ ] Navigate to form page
  - [ ] Pre-fill form fields with customer data
  - [ ] Only available for positive dispositions
  - [ ] Clear indication of pre-filled data

#### REQ-019: Pre-fill Form Fields
- **ID:** REQ-019
- **Priority:** P0 (Critical)
- **Category:** Functional - Form Integration
- **Description:** Pre-fill form fields with customer data from CRM
- **Source:** Explicit (STREAM_INTENT.md)
- **Acceptance Criteria:**
  - [ ] Map CRM data to form fields
  - [ ] Pre-fill contact details
  - [ ] Pre-fill appliance data
  - [ ] Pre-fill payment details (if available)
  - [ ] Handle field name differences

#### REQ-020: Submit Form with Pre-filled Data
- **ID:** REQ-020
- **Priority:** P0 (Critical)
- **Category:** Functional - Form Integration
- **Description:** Allow form submission with pre-filled data (user can edit before submitting)
- **Source:** Explicit (STREAM_INTENT.md)
- **Acceptance Criteria:**
  - [ ] Form validates pre-filled data
  - [ ] User can edit pre-filled fields
  - [ ] Submit works normally
  - [ ] Link back to CRM record
  - [ ] Update CRM record status to "converted"

---

### Chunk 5: Reporting & Analytics (5 requirements)

#### REQ-021: Lead Conversion Rates
- **ID:** REQ-021
- **Priority:** P0 (Critical)
- **Category:** Functional - Reporting
- **Description:** Calculate and display lead conversion rates (dispositioned as interested / total leads)
- **Source:** Explicit (STREAM_INTENT.md)
- **Acceptance Criteria:**
  - [ ] Calculate conversion rate percentage
  - [ ] Display in dashboard
  - [ ] Filter by date range
  - [ ] Filter by agent
  - [ ] Historical trends

#### REQ-022: Disposition Breakdown
- **ID:** REQ-022
- **Priority:** P0 (Critical)
- **Category:** Functional - Reporting
- **Description:** Show breakdown of dispositions (count and percentage for each)
- **Source:** Explicit (STREAM_INTENT.md)
- **Acceptance Criteria:**
  - [ ] Count by disposition type
  - [ ] Percentage calculation
  - [ ] Visual chart (pie/bar)
  - [ ] Filter by date range
  - [ ] Export breakdown

#### REQ-023: Customer Acquisition Metrics
- **ID:** REQ-023
- **Priority:** P1 (High)
- **Category:** Functional - Reporting
- **Description:** Track and report customer acquisition metrics (new leads, conversions, etc.)
- **Source:** Explicit (STREAM_INTENT.md)
- **Acceptance Criteria:**
  - [ ] New leads count (by period)
  - [ ] Conversion count
  - [ ] Conversion rate
  - [ ] Average time to convert
  - [ ] Trends over time

#### REQ-024: Form Completion Rates
- **ID:** REQ-024
- **Priority:** P1 (High)
- **Category:** Functional - Reporting
- **Description:** Track form completion rates (forms started vs completed)
- **Source:** Explicit (STREAM_INTENT.md)
- **Acceptance Criteria:**
  - [ ] Track form starts
  - [ ] Track form completions
  - [ ] Calculate completion rate
  - [ ] Identify drop-off points
  - [ ] Report on completion trends

#### REQ-025: KPI Dashboard
- **ID:** REQ-025
- **Priority:** P0 (Critical)
- **Category:** Functional - Reporting
- **Description:** Dashboard displaying all KPIs and metrics
- **Source:** Explicit (STREAM_INTENT.md)
- **Acceptance Criteria:**
  - [ ] Visual dashboard layout
  - [ ] KPI cards/widgets
  - [ ] Charts and graphs
  - [ ] Real-time updates
  - [ ] Filterable by date/agent
  - [ ] Exportable reports

---

## Non-Functional Requirements

### Chunk 6: Infrastructure (4 requirements)

#### REQ-026: Authentication/Authorization
- **ID:** REQ-026
- **Priority:** P1 (High)
- **Category:** Non-Functional - Security
- **Description:** CRM must work with existing auth-db.js system and support role-based access
- **Source:** Implicit (system integration requirement)
- **Acceptance Criteria:**
  - [ ] Use auth-db.js for authentication
  - [ ] Support admin, agent, processor roles
  - [ ] Role-based permissions (who can edit, who can disposition)
  - [ ] Secure API calls
  - [ ] Session management

#### REQ-027: Performance
- **ID:** REQ-027
- **Priority:** P1 (High)
- **Category:** Non-Functional - Performance
- **Description:** Handle large datasets efficiently (pagination, lazy loading, optimized queries)
- **Source:** Implicit (scalability requirement)
- **Acceptance Criteria:**
  - [ ] Pagination for 100+ records
  - [ ] Lazy loading of details
  - [ ] Optimized database queries
  - [ ] Fast search/filter (< 100ms)
  - [ ] Smooth UI interactions

#### REQ-028: Real-time Updates
- **ID:** REQ-028
- **Priority:** P1 (High)
- **Category:** Non-Functional - Data Consistency
- **Description:** Database changes should reflect in UI in real-time
- **Source:** Implicit (data consistency requirement)
- **Acceptance Criteria:**
  - [ ] Use Firebase real-time listeners (on())
  - [ ] Update UI when data changes
  - [ ] Handle concurrent edits
  - [ ] Show update indicators
  - [ ] Conflict resolution

#### REQ-029: Error Handling
- **ID:** REQ-029
- **Priority:** P1 (High)
- **Category:** Non-Functional - Reliability
- **Description:** User-friendly error messages and retry logic
- **Source:** Implicit (usability requirement)
- **Acceptance Criteria:**
  - [ ] Clear error messages
  - [ ] Retry failed operations
  - [ ] Network error handling
  - [ ] Validation error display
  - [ ] Error logging

#### REQ-030: Mobile Responsiveness
- **ID:** REQ-030
- **Priority:** P1 (High)
- **Category:** Non-Functional - Usability
- **Description:** CRM interface should work on mobile devices
- **Source:** Implicit (accessibility requirement)
- **Acceptance Criteria:**
  - [ ] Responsive layout
  - [ ] Touch-friendly buttons
  - [ ] Mobile-optimized forms
  - [ ] Readable on small screens
  - [ ] Mobile navigation

#### REQ-031: Data Export
- **ID:** REQ-031
- **Priority:** P2 (Medium)
- **Category:** Non-Functional - Usability
- **Description:** Export leads/customers to CSV
- **Source:** Implicit (existing admin panel has this)
- **Acceptance Criteria:**
  - [ ] Export button
  - [ ] CSV format
  - [ ] Include all fields
  - [ ] Filtered export (current view)
  - [ ] Download file

#### REQ-032: Activity Logging
- **ID:** REQ-032
- **Priority:** P1 (High)
- **Category:** Non-Functional - Audit
- **Description:** Log disposition changes, edits, and other activities
- **Source:** Implicit (audit requirement)
- **Acceptance Criteria:**
  - [ ] Log disposition changes
  - [ ] Log record edits
  - [ ] Log who made changes
  - [ ] Log timestamps
  - [ ] View activity history

#### REQ-033: Maintainability
- **ID:** REQ-033
- **Priority:** P2 (Medium)
- **Category:** Non-Functional - Code Quality
- **Description:** Code should be maintainable and follow existing patterns
- **Source:** Implicit (code quality requirement)
- **Acceptance Criteria:**
  - [ ] Follow existing code patterns
  - [ ] Reuse existing services
  - [ ] Consistent code style
  - [ ] Well-documented
  - [ ] Modular structure

#### REQ-034: Scalability
- **ID:** REQ-034
- **Priority:** P2 (Medium)
- **Category:** Non-Functional - Performance
- **Description:** System should handle growth (more leads, more users)
- **Source:** Implicit (scalability requirement)
- **Acceptance Criteria:**
  - [ ] Efficient database queries
  - [ ] Pagination for large datasets
  - [ ] Optimized rendering
  - [ ] Caching where appropriate
  - [ ] Performance monitoring

#### REQ-035: Usability
- **ID:** REQ-035
- **Priority:** P1 (High)
- **Category:** Non-Functional - Usability
- **Description:** Intuitive, user-friendly interface
- **Source:** Implicit (user experience requirement)
- **Acceptance Criteria:**
  - [ ] Clear navigation
  - [ ] Intuitive controls
  - [ ] Helpful tooltips
  - [ ] Consistent UI patterns
  - [ ] Accessible (WCAG AA)

---

## Constraints

#### CON-001: Firebase Database Structure
- **ID:** CON-001
- **Priority:** P0 (Critical)
- **Category:** Constraint
- **Description:** Must work with existing Firebase Realtime Database structure
- **Source:** Implicit (system constraint)
- **Impact:** Cannot change database schema significantly, must extend existing structure

#### CON-002: Form System Integration
- **ID:** CON-002
- **Priority:** P0 (Critical)
- **Category:** Constraint
- **Description:** Must integrate with existing form submission system
- **Source:** Implicit (system constraint)
- **Impact:** Must use existing form renderer and field config services

#### CON-003: Data Consistency
- **ID:** CON-003
- **Priority:** P0 (Critical)
- **Category:** Constraint
- **Description:** Must maintain data consistency across systems
- **Source:** Implicit (data integrity constraint)
- **Impact:** Edits must sync properly, no data loss

#### CON-004: Role Support
- **ID:** CON-004
- **Priority:** P0 (Critical)
- **Category:** Constraint
- **Description:** Must support existing roles (admin, agent, processor)
- **Source:** Implicit (system constraint)
- **Impact:** Must implement role-based permissions

---

## Gaps Identified

1. **Lead Status Workflow** - Not fully defined (new -> contacted -> dispositioned -> converted)
2. **Disposition Options** - Need complete list (currently: no answer, not interested, interested, call back, other - but "other" needs specification)
3. **KPI Calculation Formulas** - Not defined (how to calculate conversion rate, average time, etc.)
4. **Report Formats** - Not specified (charts vs tables, export formats)
5. **Upload Format** - Not specified (CSV structure, JSON structure, field mapping)
6. **Permission Model** - Not fully defined (who can edit, who can disposition, who can upload)

---

## Conflicts

**None identified** - All requirements are compatible.

---

## Dependencies

### Internal Dependencies
- REQ-018, REQ-019, REQ-020 depend on REQ-007, REQ-008 (form integration needs editing)
- REQ-021, REQ-022, REQ-023, REQ-024, REQ-025 depend on REQ-014, REQ-015 (reporting needs disposition data)
- REQ-013 depends on REQ-012 (cycling needs leads to exist)
- REQ-010 depends on REQ-007, REQ-008, REQ-009 (save needs edits)

### External Dependencies
- All requirements depend on Firebase Realtime Database
- Form integration depends on existing form system (app.js, appliance_form.html)
- Authentication depends on auth-db.js
- Form rendering depends on form-renderer.js and field-config.js

---

## Semantic Chunks

### Chunk 1: Core CRM Viewing
**Requirements:** REQ-001, REQ-002, REQ-003, REQ-004, REQ-005, REQ-006  
**Theme:** Viewing and navigating customer/lead data

### Chunk 2: Record Management
**Requirements:** REQ-007, REQ-008, REQ-009, REQ-010, REQ-011  
**Theme:** Editing and managing customer records

### Chunk 3: Lead Management
**Requirements:** REQ-012, REQ-013, REQ-014, REQ-015, REQ-016, REQ-017  
**Theme:** Lead workflow and disposition tracking

### Chunk 4: Form Integration
**Requirements:** REQ-018, REQ-019, REQ-020  
**Theme:** Integration with form submission system

### Chunk 5: Reporting & Analytics
**Requirements:** REQ-021, REQ-022, REQ-023, REQ-024, REQ-025  
**Theme:** Business intelligence and KPIs

### Chunk 6: Infrastructure
**Requirements:** REQ-026, REQ-027, REQ-028, REQ-029, REQ-030, REQ-031, REQ-032, REQ-033, REQ-034, REQ-035  
**Theme:** System infrastructure and quality attributes

---

## Next Steps

1. Project Structure Analysis (Step 4)
2. Memory Context Initialization (Step 5)
3. Complete Discovery & Handoff (Step 6)

---

**Step 3 Complete - Ready for Project Structure Analysis**
