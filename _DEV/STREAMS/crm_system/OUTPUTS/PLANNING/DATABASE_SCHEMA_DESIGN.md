---
title: "Database Schema Design - CRM Extensions"
created: 2026-01-19
workflow: PLANNING_STANDARD_AI
task: task-1
status: complete
---

# Database Schema Design - CRM Extensions

**Stream:** crm_system  
**Created:** 2026-01-19  
**Task:** task-1

---

## Overview

This document defines the database schema extensions for the CRM system. All new fields are **optional** to maintain backward compatibility with existing sales records.

---

## Extended Sales Record Schema

### New Fields

#### 1. `leadStatus` (string, optional)
- **Type:** String
- **Values:** `'new'` | `'contacted'` | `'dispositioned'` | `'converted'`
- **Default:** Auto-detected based on record state:
  - `'converted'` if `submittedAt` exists
  - `'new'` if no disposition set
  - `'contacted'` if any interaction occurred
  - `'dispositioned'` if `disposition` is set
- **Description:** Tracks the current status of a lead in the workflow
- **Backward Compatibility:** Existing records without this field are treated as `'converted'` if they have `submittedAt`, otherwise `'new'`

#### 2. `disposition` (string | null, optional)
- **Type:** String or null
- **Values:** `'no_answer'` | `'not_interested'` | `'interested'` | `'call_back'` | `'other'` | `null`
- **Default:** `null`
- **Description:** The disposition outcome when contacting a lead
- **Backward Compatibility:** Existing records without this field default to `null`

#### 3. `dispositionDate` (string | null, optional)
- **Type:** ISO 8601 string or null
- **Format:** `"YYYY-MM-DDTHH:mm:ss.sssZ"`
- **Default:** `null`
- **Description:** Timestamp when the disposition was set
- **Backward Compatibility:** Existing records without this field default to `null`

#### 4. `dispositionBy` (string | null, optional)
- **Type:** String or null
- **Format:** User ID (agentId) or email address
- **Default:** `null`
- **Description:** Identifier for the user who set the disposition
- **Backward Compatibility:** Existing records without this field default to `null`

#### 5. `leadSource` (string | null, optional)
- **Type:** String or null
- **Values:** `'upload'` | `'form'` | `'manual'` | `null`
- **Default:** Auto-detected based on creation method:
  - `'form'` if created via form submission
  - `'upload'` if created via CRM upload
  - `'manual'` if created manually in CRM
- **Description:** Tracks where the lead originated from
- **Backward Compatibility:** Existing records without this field default to `'form'` if they have `submittedAt`, otherwise `null`

---

## Complete Sales Record Schema

```javascript
{
  // Existing fields (keep as-is)
  contact: {
    name: string,
    phone: string,
    email: string,
    address: string,
    postcode: string
  },
  appliances: array,
  plan: {
    number: string,
    type: string,
    totalCost: number
  },
  payment: {
    sortCode: string,
    accountNumber: string,
    ddDate: string
  },
  notes: string,
  agentId: string,
  agentEmail: string,
  timestamp: number,
  submittedAt: string,
  dynamicFields: object,
  applianceIds: array,
  version: number,
  createdAt: string,
  updatedAt: string,
  
  // New CRM fields (all optional)
  leadStatus: 'new' | 'contacted' | 'dispositioned' | 'converted' | undefined,
  disposition: 'no_answer' | 'not_interested' | 'interested' | 'call_back' | 'other' | null | undefined,
  dispositionDate: string | null | undefined,
  dispositionBy: string | null | undefined,
  leadSource: 'upload' | 'form' | 'manual' | null | undefined
}
```

---

## Backward Compatibility Strategy

### Default Value Logic

1. **On Read:**
   - If field is missing, use default value based on other fields
   - `leadStatus`: Check `submittedAt` → `'converted'` if exists, else `'new'`
   - `leadSource`: Check `submittedAt` → `'form'` if exists, else `null`
   - `disposition`, `dispositionDate`, `dispositionBy`: Default to `null`

2. **On Write:**
   - New records: Set all fields explicitly
   - Existing records: Only update fields that are being changed
   - Never require these fields to be present

3. **Validation:**
   - Database rules allow these fields to be optional
   - Application logic handles missing fields gracefully
   - No breaking changes to existing data structure

---

## Field Relationships

### Status Workflow

```
new → contacted → dispositioned → converted
```

- **new:** Lead just created, no interaction yet
- **contacted:** Lead has been contacted (viewed, edited, etc.)
- **dispositioned:** Disposition has been set
- **converted:** Lead converted to sale (form submitted)

### Disposition Flow

When `disposition` is set:
1. `disposition` = selected value
2. `dispositionDate` = current timestamp (ISO string)
3. `dispositionBy` = current user ID or email
4. `leadStatus` = `'dispositioned'` (unless already `'converted'`)

### Source Detection

- **form:** Record has `submittedAt` timestamp
- **upload:** Record created via CRM upload interface
- **manual:** Record created manually in CRM interface

---

## Database Rules Considerations

The database rules in `database.rules.json` will be updated to:
1. Allow reads of new fields for authenticated users
2. Allow writes of new fields for authenticated users
3. Maintain existing permission structure
4. Not require new fields to be present

---

## Migration Notes

- **No migration required:** All fields are optional
- **Existing records:** Continue to work without new fields
- **New records:** Include new fields when created
- **Gradual adoption:** Fields can be added to existing records over time

---

**Task 1 Complete - Schema Design Documented**
