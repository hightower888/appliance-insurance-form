# Database Schema Design

**Generated:** 2026-01-08  
**Purpose:** Define database structure for dynamic form and processor system

---

## Overview

Firebase Realtime Database structure for:
- `form_fields` - Dynamic form field configurations
- `processor_profiles` - Processor-specific CSV mapping settings
- `sales` - Enhanced to support dynamic fields (backward compatible)
- `users` - Enhanced to support processor role

---

## form_fields Schema

**Path:** `/form_fields/{fieldId}`

```json
{
  "fieldId": "string (auto-generated)",
  "fieldName": "string (unique, e.g., 'name', 'email')",
  "fieldLabel": "string (display label, e.g., 'Full Name')",
  "fieldType": "string (text|email|tel|number|select|textarea|checkbox|radio)",
  "required": "boolean",
  "order": "number (display order)",
  "section": "string (section/group name, e.g., 'Contact Details')",
  "validation": {
    "minLength": "number (optional)",
    "maxLength": "number (optional)",
    "pattern": "string (regex pattern, optional)",
    "min": "number (for number type, optional)",
    "max": "number (for number type, optional)",
    "options": "array (for select/radio, optional)"
  },
  "defaultValue": "string (optional)",
  "helpText": "string (optional)",
  "conditional": {
    "showIf": {
      "fieldId": "string",
      "operator": "equals|notEquals|contains",
      "value": "any"
    }
  },
  "createdAt": "ISO timestamp",
  "updatedAt": "ISO timestamp",
  "createdBy": "string (userId)",
  "updatedBy": "string (userId)"
}
```

### Example

```json
{
  "fieldId": "name",
  "fieldName": "name",
  "fieldLabel": "Full Name",
  "fieldType": "text",
  "required": true,
  "order": 1,
  "section": "Contact Details",
  "validation": {
    "minLength": 2,
    "maxLength": 100
  },
  "defaultValue": "",
  "helpText": "Enter your full legal name",
  "createdAt": "2026-01-08T00:00:00Z",
  "updatedAt": "2026-01-08T00:00:00Z",
  "createdBy": "admin-user-id",
  "updatedBy": "admin-user-id"
}
```

---

## processor_profiles Schema

**Path:** `/processor_profiles/{userId}`

```json
{
  "userId": "string (matches users/{userId})",
  "fieldMappings": {
    "formFieldId": "csvColumnName",
    "name": "Customer Name",
    "email": "Email Address",
    "phoneNumbers": "Phone"
  },
  "exportPreferences": {
    "includeHeaders": "boolean (default: true)",
    "dateFormat": "string (default: 'YYYY-MM-DD')",
    "delimiter": "string (default: ',')",
    "encoding": "string (default: 'UTF-8')"
  },
  "savedProfiles": {
    "profileId": {
      "name": "string (profile name)",
      "fieldMappings": "object (same as fieldMappings)",
      "exportPreferences": "object (same as exportPreferences)",
      "createdAt": "ISO timestamp",
      "isDefault": "boolean"
    }
  },
  "defaultProfileId": "string (profileId from savedProfiles)",
  "createdAt": "ISO timestamp",
  "updatedAt": "ISO timestamp"
}
```

### Example

```json
{
  "userId": "processor-user-id",
  "fieldMappings": {
    "name": "Customer Full Name",
    "email": "Email Address",
    "phoneNumbers": "Contact Phone",
    "adress": "Street Address",
    "postcode": "Postal Code"
  },
  "exportPreferences": {
    "includeHeaders": true,
    "dateFormat": "DD/MM/YYYY",
    "delimiter": ",",
    "encoding": "UTF-8"
  },
  "savedProfiles": {
    "profile-1": {
      "name": "Standard Export",
      "fieldMappings": { "name": "Customer Name", "email": "Email" },
      "exportPreferences": { "includeHeaders": true },
      "createdAt": "2026-01-08T00:00:00Z",
      "isDefault": true
    }
  },
  "defaultProfileId": "profile-1",
  "createdAt": "2026-01-08T00:00:00Z",
  "updatedAt": "2026-01-08T00:00:00Z"
}
```

---

## sales Schema (Enhanced)

**Path:** `/sales/{saleId}`

**Existing Structure (Maintained for Backward Compatibility):**
```json
{
  "contact": {
    "name": "string",
    "phone": "string",
    "email": "string",
    "address": "string",
    "postcode": "string"
  },
  "appliances": "array",
  "plan": {
    "number": "string",
    "type": "string",
    "totalCost": "number"
  },
  "payment": {
    "sortCode": "string",
    "accountNumber": "string",
    "ddDate": "string"
  },
  "notes": "string",
  "agentId": "string",
  "agentEmail": "string",
  "timestamp": "number",
  "submittedAt": "ISO timestamp"
}
```

**New Structure (For Dynamic Fields):**
```json
{
  "contact": { ... },
  "appliances": [ ... ],
  "plan": { ... },
  "payment": { ... },
  "notes": "string",
  "agentId": "string",
  "agentEmail": "string",
  "timestamp": "number",
  "submittedAt": "ISO timestamp",
  "dynamicFields": {
    "fieldId": "fieldValue",
    "name": "John Smith",
    "email": "john@example.com",
    "customField1": "value1"
  },
  "fieldConfigVersion": "string (version of form_fields when submitted)"
}
```

**Note:** Both structures supported. Old submissions keep existing structure, new submissions can use dynamicFields.

---

## users Schema (Enhanced)

**Path:** `/users/{userId}`

**Existing Structure:**
```json
{
  "email": "string",
  "role": "string (admin|agent)",
  "status": "string (active|inactive)",
  "createdAt": "ISO timestamp",
  "lastLoginAt": "ISO timestamp"
}
```

**Enhanced Structure:**
```json
{
  "email": "string",
  "role": "string (admin|agent|processor)",
  "status": "string (active|inactive)",
  "createdAt": "ISO timestamp",
  "lastLoginAt": "ISO timestamp",
  "passwordHash": "string (SHA-256, for database auth)"
}
```

---

## Database Rules

See `database.rules.json` for complete security rules.

### Key Rules:

1. **form_fields:**
   - Admin: read/write
   - Others: read-only

2. **processor_profiles:**
   - Processor: read/write own profile
   - Admin: read all, write (for management)
   - Others: no access

3. **sales:**
   - Admin: read/write
   - Processor: read-only
   - Agent: write-only (submit forms)
   - Others: no access

4. **users:**
   - All authenticated: read (for auth)
   - Admin: write (for user management)
   - Others: no write access

---

## Migration Notes

1. **Existing Fields Migration:**
   - 11 hardcoded fields → form_fields database
   - Migration script preserves field order
   - Existing submissions remain unchanged

2. **Backward Compatibility:**
   - Old submissions use existing structure
   - New submissions can use dynamicFields
   - Compatibility layer handles both formats

3. **Processor Role:**
   - Add 'processor' to role validation
   - Update auth logic to recognize processor
   - Create processor_profiles for existing processors (if any)

---

## Indexes & Performance

**Firebase Realtime Database:**
- No explicit indexes needed (Realtime DB handles automatically)
- Queries optimized by structure
- Consider pagination for large datasets

**Query Patterns:**
- Get all form_fields: `/form_fields` (ordered by order field)
- Get processor profile: `/processor_profiles/{userId}`
- Get sales: `/sales` (ordered by timestamp)
- Search: Client-side filtering (or use Firebase query methods)

---

## Data Validation

**Client-Side:**
- Field type validation
- Required field checks
- Custom validation rules

**Server-Side (Database Rules):**
- Field structure validation
- Required fields enforcement
- Type checking where possible

---

**Status:** ✅ Schema Design Complete  
**Next:** Update database.rules.json with new rules
