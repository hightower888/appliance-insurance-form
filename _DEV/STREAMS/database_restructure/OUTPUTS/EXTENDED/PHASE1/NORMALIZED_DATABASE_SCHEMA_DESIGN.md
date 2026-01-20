# Normalized Database Schema Design

**Stream:** database_restructure
**Phase:** 1 - Schema Design
**Objective:** Replace embedded arrays with proper one-to-many relationships

---

## 📊 Entity Relationship Diagram (ERD)

```
┌─────────────────┐       ┌─────────────────┐
│      Sales      │       │   Appliances    │
├─────────────────┤       ├─────────────────┤
│ saleId (PK)     │◄──────┤ applianceId (PK)│
│ contact         │   1   │ saleId (FK)     │
│ plan            │   ┼   │ type            │
│ payment         │   ∞   │ make            │
│ agentId         │       │ model           │
│ applianceIds[]  │──────►│ age             │
│ boilerIds[]     │       │ monthlyCost     │
│ dynamicFieldIds[]│      │ serialNumber    │
│ timestamp       │       │ warrantyExpiry  │
└─────────────────┘       └─────────────────┘

┌─────────────────┐       ┌─────────────────┐
│      Sales      │       │     Boilers     │
├─────────────────┤       ├─────────────────┤
│ saleId (PK)     │◄──────┤ boilerId (PK)   │
│ contact         │   1   │ saleId (FK)     │
│ plan            │   ┼   │ type            │
│ payment         │   ∞   │ make            │
│ agentId         │       │ model           │
│ applianceIds[]  │──────►│ age             │
│ boilerIds[]     │       │ monthlyCost     │
│ dynamicFieldIds[]│      │ fuelType        │
│ timestamp       │       │ efficiencyRating│
└─────────────────┘       └─────────────────┘

┌─────────────────┐       ┌─────────────────┐
│      Sales      │       │DynamicFieldValues│
├─────────────────┤       ├─────────────────┤
│ saleId (PK)     │◄──────┤ fieldValueId(PK)│
│ contact         │   1   │ saleId (FK)     │
│ plan            │   ┼   │ fieldId (FK)    │
│ payment         │   ∞   │ fieldType       │
│ agentId         │       │ value           │
│ applianceIds[]  │──────►│ createdAt       │
│ boilerIds[]     │       │ updatedAt       │
│ dynamicFieldIds[]│      └─────────────────┘
│ timestamp       │              ▲
└─────────────────┘              │
                                 │
                    ┌─────────────────┐
                    │  Form Fields    │
                    ├─────────────────┤
                    │ fieldId (PK)    │
                    │ fieldName       │
                    │ fieldType       │
                    │ label           │
                    │ required        │
                    │ options[]       │
                    │ order           │
                    │ active          │
                    └─────────────────┘
```

---

## 🗄️ Detailed Entity Specifications

### 1. Sales Entity (Root)

**Path:** `/sales/{saleId}`
**Purpose:** Core sales record with relationships to child entities

```json
{
  "sales": {
    "{saleId}": {
      // Core sale data
      "saleId": "string",           // Auto-generated UUID
      "timestamp": "number",        // Unix timestamp
      "submittedAt": "string",      // ISO date string

      // Customer contact information
      "contact": {
        "name": "string",
        "phoneNumbers": ["string"], // Array for multiple numbers
        "address": "string",
        "postcode": "string"
      },

      // Coverage plan details
      "plan": {
        "number": "string",         // e.g., "NDAC123APP"
        "type": "string",          // e.g., "Appliance", "Combined"
        "totalCost": "number"      // Total monthly cost
      },

      // Payment information
      "payment": {
        "sortCode": "string",      // 6 digits
        "accountNumber": "string", // 8 digits
        "ddDate": "string"         // e.g., "28th"
      },

      // Agent association
      "agentId": "string",         // Foreign key to users
      "agentEmail": "string",

      // Relationship arrays (NEW)
      "applianceIds": ["string"],  // Array of appliance IDs
      "boilerIds": ["string"],     // Array of boiler IDs
      "dynamicFieldValueIds": ["string"], // Array of field value IDs

      // Metadata
      "status": "string",          // e.g., "active", "cancelled"
      "version": "number",         // Schema version for migrations
      "createdAt": "string",       // ISO date
      "updatedAt": "string"        // ISO date
    }
  }
}
```

### 2. Appliances Entity

**Path:** `/appliances/{applianceId}`
**Purpose:** Individual appliance records linked to sales
**Relationship:** Many appliances → One sale

```json
{
  "appliances": {
    "{applianceId}": {
      // Primary identifiers
      "applianceId": "string",     // Auto-generated UUID
      "saleId": "string",          // Foreign key to sales

      // Appliance specifications
      "type": "string",            // e.g., "Washing Machine", "Dishwasher"
      "make": "string",            // e.g., "Samsung", "Bosch"
      "model": "string",           // e.g., "WW90T634DLH", "SMS46MI01G"
      "age": "string",             // e.g., "0-1 years", "3-5 years"
      "monthlyCost": "number",     // e.g., 15.99

      // Optional extended data
      "serialNumber": "string?",   // Optional
      "warrantyExpiry": "string?", // ISO date, optional
      "purchaseDate": "string?",   // ISO date, optional
      "installationDate": "string?", // ISO date, optional

      // Technical specifications
      "capacity": "string?",       // e.g., "8kg", optional
      "energyRating": "string?",   // e.g., "A+++", optional
      "powerConsumption": "number?", // Watts, optional

      // Metadata
      "status": "string",          // e.g., "active", "removed"
      "version": "number",         // Schema version
      "createdAt": "string",       // ISO date
      "updatedAt": "string"        // ISO date
    }
  }
}
```

### 3. Boilers Entity

**Path:** `/boilers/{boilerId}`
**Purpose:** Individual boiler records linked to sales
**Relationship:** Many boilers → One sale

```json
{
  "boilers": {
    "{boilerId}": {
      // Primary identifiers
      "boilerId": "string",        // Auto-generated UUID
      "saleId": "string",          // Foreign key to sales

      // Boiler specifications
      "type": "string",            // e.g., "Combi Boiler", "System Boiler"
      "make": "string",            // e.g., "Worcester", "Vaillant"
      "model": "string",           // e.g., "Greenstar 30i", "EcoTEC Plus"
      "age": "string",             // e.g., "0-1 years", "5-10 years"
      "monthlyCost": "number",     // e.g., 25.99

      // Fuel and efficiency
      "fuelType": "string",        // e.g., "Gas", "Oil", "Electric"
      "efficiencyRating": "string", // e.g., "A", "A+", "B"
      "outputKw": "number?",       // Kilowatts, optional

      // Optional extended data
      "serialNumber": "string?",   // Optional
      "installationDate": "string?", // ISO date, optional
      "lastServiceDate": "string?", // ISO date, optional
      "warrantyExpiry": "string?", // ISO date, optional

      // Technical specifications
      "flowRate": "number?",       // Litres/minute, optional
      "pressureRange": "string?",  // e.g., "0.5-3.0 bar", optional
      "flueType": "string?",       // e.g., "Horizontal", "Vertical", optional

      // Metadata
      "status": "string",          // e.g., "active", "removed"
      "version": "number",         // Schema version
      "createdAt": "string",       // ISO date
      "updatedAt": "string"        // ISO date
    }
  }
}
```

### 4. Dynamic Field Values Entity

**Path:** `/dynamicFieldValues/{fieldValueId}`
**Purpose:** Custom field responses linked to sales and field definitions
**Relationship:** Many values → One sale, Many values → One field definition

```json
{
  "dynamicFieldValues": {
    "{fieldValueId}": {
      // Primary identifiers
      "fieldValueId": "string",    // Auto-generated UUID
      "saleId": "string",          // Foreign key to sales
      "fieldId": "string",         // Foreign key to form_fields

      // Field metadata (denormalized for performance)
      "fieldType": "string",       // e.g., "text", "select", "number"
      "fieldName": "string",       // e.g., "additionalCoverage"
      "required": "boolean",       // Whether field was required

      // Field value (flexible typing)
      "value": "any",              // Can be string, number, boolean, array

      // For select fields, store selected option
      "selectedOption": "string?", // Optional, for select fields

      // Validation metadata
      "isValid": "boolean",        // Whether value passed validation
      "validationErrors": ["string"], // Array of error messages

      // Metadata
      "version": "number",         // Schema version
      "createdAt": "string",       // ISO date
      "updatedAt": "string"        // ISO date
    }
  }
}
```

### 5. Form Fields Entity (Reference)

**Path:** `/form_fields/{fieldId}`
**Purpose:** Field definition configurations (existing, enhanced)
**Status:** Existing table, minor enhancements needed

```json
{
  "form_fields": {
    "{fieldId}": {
      // Existing fields
      "fieldId": "string",         // Primary key
      "fieldName": "string",       // Unique field identifier
      "fieldType": "string",       // "text", "select", "number", etc.
      "label": "string",           // Display label
      "required": "boolean",       // Validation requirement
      "options": ["string"],       // For select fields
      "order": "number",           // Display order
      "active": "boolean",         // Whether field is enabled

      // Enhanced fields for relationships
      "category": "string",        // e.g., "appliance", "boiler", "general"
      "validationRules": {         // Enhanced validation
        "min": "number?",          // For numbers
        "max": "number?",          // For numbers
        "pattern": "string?",      // Regex pattern
        "customValidator": "string?" // Function name
      },

      // Metadata
      "createdBy": "string",       // User ID who created
      "version": "number",         // Schema version
      "createdAt": "string",       // ISO date
      "updatedAt": "string"        // ISO date
    }
  }
}
```

---

## 🔗 Relationship Implementation Strategy

### Foreign Key Management

**Firebase Realtime Database Limitations:**
- No built-in foreign key constraints
- No cascading deletes
- No referential integrity enforcement

**Our Strategy:**
1. **String IDs as Foreign Keys:** Use UUIDs for all primary keys
2. **Client-Side Validation:** Validate relationships before operations
3. **Cleanup Procedures:** Remove orphaned records during maintenance
4. **Documentation:** Track all relationship dependencies

### Relationship Arrays in Parent Entities

**Sales Entity Relationship Arrays:**
```json
{
  "sales": {
    "sale123": {
      "applianceIds": ["app1", "app2", "app3"],
      "boilerIds": ["boil1"],
      "dynamicFieldValueIds": ["val1", "val2", "val3"]
    }
  }
}
```

**Benefits:**
- Fast lookup of related records
- Enables efficient querying
- Supports real-time updates
- Maintains referential integrity

### Bidirectional Relationship Validation

**Forward Relationships:** Child → Parent (appliance.saleId → sales.saleId)
**Reverse Relationships:** Parent → Children (sales.applianceIds → appliances)

**Validation Rules:**
- All child records must reference valid parent
- Parent relationship arrays must contain all valid children
- Orphaned records should be flagged for cleanup

---

## 📊 Query Optimization Design

### Firebase Indexing Strategy

```json
{
  "rules": {
    "sales": {
      ".indexOn": ["agentId", "timestamp", "status"]
    },
    "appliances": {
      ".indexOn": ["saleId", "type", "make", "age"]
    },
    "boilers": {
      ".indexOn": ["saleId", "type", "fuelType", "age"]
    },
    "dynamicFieldValues": {
      ".indexOn": ["saleId", "fieldId", "fieldType"]
    },
    "form_fields": {
      ".indexOn": ["fieldName", "category", "active"]
    }
  }
}
```

### Common Query Patterns

#### 1. Get All Appliances for a Sale
```javascript
// Query: appliances where saleId == "sale123"
const appliancesRef = firebase.database()
  .ref('appliances')
  .orderByChild('saleId')
  .equalTo('sale123');
```

#### 2. Get Sales by Agent
```javascript
// Query: sales where agentId == "agent456"
const salesRef = firebase.database()
  .ref('sales')
  .orderByChild('agentId')
  .equalTo('agent456');
```

#### 3. Get Appliances by Type Across All Sales
```javascript
// Query: appliances where type == "Washing Machine"
const washingMachinesRef = firebase.database()
  .ref('appliances')
  .orderByChild('type')
  .equalTo('Washing Machine');
```

#### 4. Get Dynamic Field Values for a Sale
```javascript
// Query: dynamicFieldValues where saleId == "sale123"
const fieldValuesRef = firebase.database()
  .ref('dynamicFieldValues')
  .orderByChild('saleId')
  .equalTo('sale123');
```

### Performance Optimization Techniques

#### 1. Denormalized Read Views
- Pre-compute expensive aggregations
- Store summary data for quick access
- Use Firebase Cloud Functions for background processing

#### 2. Client-Side Caching
- Cache relationship data in memory
- Implement smart invalidation strategies
- Use Firebase's offline persistence

#### 3. Pagination Strategy
- Implement cursor-based pagination
- Limit result sets to prevent performance issues
- Use compound queries for efficient filtering

---

## 🔐 Security Rules Design

### Role-Based Access Control

```json
{
  "rules": {
    "sales": {
      "$saleId": {
        ".read": "auth != null && (data.child('agentId').val() === auth.uid || auth.token.role === 'processor' || auth.token.role === 'admin')",
        ".write": "auth != null && (data.child('agentId').val() === auth.uid || auth.token.role === 'admin')",
        ".validate": "newData.hasChildren(['contact', 'plan', 'payment', 'agentId', 'applianceIds', 'boilerIds'])"
      }
    },
    "appliances": {
      "$applianceId": {
        ".read": "auth != null && root.child('sales').child(data.child('saleId').val()).child('agentId').val() === auth.uid || auth.token.role === 'processor' || auth.token.role === 'admin'",
        ".write": "auth != null && root.child('sales').child(data.child('saleId').val()).child('agentId').val() === auth.uid || auth.token.role === 'admin'",
        ".validate": "newData.hasChildren(['saleId', 'type', 'make', 'model', 'age', 'monthlyCost'])"
      }
    },
    "boilers": {
      "$boilerId": {
        ".read": "auth != null && root.child('sales').child(data.child('saleId').val()).child('agentId').val() === auth.uid || auth.token.role === 'processor' || auth.token.role === 'admin'",
        ".write": "auth != null && root.child('sales').child(data.child('saleId').val()).child('agentId').val() === auth.uid || auth.token.role === 'admin'",
        ".validate": "newData.hasChildren(['saleId', 'type', 'make', 'model', 'age', 'monthlyCost', 'fuelType'])"
      }
    },
    "dynamicFieldValues": {
      "$fieldValueId": {
        ".read": "auth != null && root.child('sales').child(data.child('saleId').val()).child('agentId').val() === auth.uid || auth.token.role === 'processor' || auth.token.role === 'admin'",
        ".write": "auth != null && root.child('sales').child(data.child('saleId').val()).child('agentId').val() === auth.uid || auth.token.role === 'admin'",
        ".validate": "newData.hasChildren(['saleId', 'fieldId', 'fieldType', 'value'])"
      }
    },
    "form_fields": {
      ".read": "auth != null && auth.token.role === 'admin'",
      ".write": "auth != null && auth.token.role === 'admin'",
      ".validate": "newData.hasChildren(['fieldName', 'fieldType', 'label', 'required'])"
    }
  }
}
```

### Security Considerations

#### 1. Relationship Validation
- Verify foreign key references exist
- Ensure user has access to referenced sale
- Validate relationship arrays are consistent

#### 2. Data Integrity
- Prevent orphaned records
- Validate required fields
- Enforce data type constraints

#### 3. Performance Impact
- Complex security rules may slow queries
- Consider caching authenticated user data
- Use Firebase Auth custom claims for role data

---

## 📋 Schema Validation Rules

### Data Type Validation

#### Sales Entity
```json
{
  "saleId": "string, required, UUID format",
  "timestamp": "number, required, Unix timestamp",
  "contact": {
    "name": "string, required, 2-100 chars",
    "phoneNumbers": "array, required, 1+ items",
    "address": "string, required, 5-200 chars",
    "postcode": "string, required, UK format"
  },
  "plan": {
    "number": "string, required, NDAC format",
    "type": "string, required, enum",
    "totalCost": "number, required, >0"
  }
}
```

#### Appliances Entity
```json
{
  "applianceId": "string, required, UUID",
  "saleId": "string, required, valid FK to sales",
  "type": "string, required, enum",
  "make": "string, required, 2-50 chars",
  "model": "string, required, 2-100 chars",
  "age": "string, required, enum",
  "monthlyCost": "number, required, 0-1000"
}
```

### Relationship Integrity Rules

#### 1. Foreign Key Validation
- All child records must reference valid parent
- Parent relationship arrays must be consistent
- Invalid references should be rejected

#### 2. Cascade Prevention
- No automatic deletes (Firebase limitation)
- Manual cleanup of orphaned records
- Document relationship dependencies

#### 3. Consistency Checks
- Relationship arrays match actual child records
- No duplicate IDs in relationship arrays
- Valid data types for all fields

---

## 🎯 Schema Benefits

### Functional Benefits
- ✅ **Unlimited Appliances:** Support any number per sale
- ✅ **Multiple Boilers:** Handle complex heating systems
- ✅ **Dynamic Fields:** Flexible custom data collection
- ✅ **Better Queries:** Efficient filtering and analytics
- ✅ **Data Integrity:** Proper relationships and constraints

### Performance Benefits
- ✅ **Faster Updates:** Modify individual records
- ✅ **Better Indexing:** Optimized query performance
- ✅ **Scalable Analytics:** Relationship-based aggregations
- ✅ **Reduced Payloads:** Smaller individual records

### Maintenance Benefits
- ✅ **Easier Debugging:** Clear relationship structure
- ✅ **Better Testing:** Isolated entity testing
- ✅ **Future Extensibility:** Easy to add new entity types
- ✅ **Migration Friendly:** Structured data transformation

---

## 📈 Migration Impact Assessment

### Current Data Volume
- **Sales Records:** ~100-1000 (estimate)
- **Embedded Appliances:** ~200-2000 total
- **Data Size:** ~500KB-5MB total

### Migration Complexity
- **Transformation Logic:** Medium (array to separate records)
- **Data Validation:** High (relationship integrity)
- **Downtime:** Minimal (can be done incrementally)
- **Rollback:** Straightforward (restore backups)

### Performance Impact
- **Initial:** Slight increase in database operations
- **Ongoing:** Better query performance
- **Memory:** Similar client-side usage
- **Network:** Slightly more requests (normalized)

---

## ✅ Schema Design Complete

**Status:** NORMALIZED SCHEMA FULLY DESIGNED
**Entities:** 5 core entities with proper relationships
**Relationships:** One-to-many implemented correctly
**Security:** Role-based access rules designed
**Performance:** Indexing and optimization strategies included
**Migration:** Transformation path clearly defined

**Ready for Phase 1 completion and Phase 2 implementation!** 🚀