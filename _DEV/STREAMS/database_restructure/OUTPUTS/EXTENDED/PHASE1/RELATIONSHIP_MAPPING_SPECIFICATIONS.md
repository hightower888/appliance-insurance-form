# Relationship Mapping Specifications

**Stream:** database_restructure
**Phase:** 1 - Relationship Design
**Objective:** Document all entity relationships and their implementations

---

## 📊 Entity Relationship Overview

### Core Relationship Types

| Relationship Type | Cardinality | Implementation | Example |
|-------------------|-------------|----------------|---------|
| **Sales → Appliances** | 1 → 0..* | Parent array + Child FK | One sale has multiple appliances |
| **Sales → Boilers** | 1 → 0..* | Parent array + Child FK | One sale has multiple boilers |
| **Sales → Dynamic Fields** | 1 → 0..* | Parent array + Child FK | One sale has multiple custom values |
| **Appliances → Sales** | * → 1 | Child FK to Parent | Many appliances belong to one sale |
| **Boilers → Sales** | * → 1 | Child FK to Parent | Many boilers belong to one sale |
| **Dynamic Values → Sales** | * → 1 | Child FK to Parent | Many values belong to one sale |
| **Dynamic Values → Form Fields** | * → 1 | Child FK to Reference | Many values reference one field definition |

---

## 🔗 Detailed Relationship Mappings

### 1. Sales → Appliances Relationship

#### Cardinality: 1 → 0..*
- **One sale** can have **zero or more appliances**
- **Business Rule:** Unlimited appliances per sale
- **Use Case:** Home with multiple appliances covered

#### Implementation Details

**Parent Entity (Sales):**
```json
{
  "sales": {
    "sale123": {
      "applianceIds": ["app1", "app2", "app3"]
    }
  }
}
```

**Child Entity (Appliances):**
```json
{
  "appliances": {
    "app1": {
      "applianceId": "app1",
      "saleId": "sale123",  // Foreign Key
      "type": "Washing Machine",
      "make": "Samsung"
    },
    "app2": {
      "applianceId": "app2",
      "saleId": "sale123",  // Foreign Key
      "type": "Dishwasher",
      "make": "Bosch"
    }
  }
}
```

#### Relationship Operations

**Create Appliance:**
1. Generate new applianceId
2. Create appliance record with saleId FK
3. Add applianceId to sale's applianceIds array
4. Update both records atomically (client-side transaction)

**Delete Appliance:**
1. Remove appliance record
2. Remove applianceId from sale's applianceIds array
3. Update both records atomically

**Query Appliances for Sale:**
```javascript
// Get all appliances for a sale
const appliances = await firebase.database()
  .ref('appliances')
  .orderByChild('saleId')
  .equalTo('sale123')
  .once('value');
```

### 2. Sales → Boilers Relationship

#### Cardinality: 1 → 0..*
- **One sale** can have **zero or more boilers**
- **Business Rule:** Support multiple boiler systems
- **Use Case:** Commercial properties, multiple heating zones

#### Implementation Details

**Parent Entity (Sales):**
```json
{
  "sales": {
    "sale123": {
      "boilerIds": ["boil1", "boil2"]
    }
  }
}
```

**Child Entity (Boilers):**
```json
{
  "boilers": {
    "boil1": {
      "boilerId": "boil1",
      "saleId": "sale123",  // Foreign Key
      "type": "Combi Boiler",
      "make": "Worcester",
      "fuelType": "Gas"
    },
    "boil2": {
      "boilerId": "boil2",
      "saleId": "sale123",  // Foreign Key
      "type": "System Boiler",
      "make": "Vaillant",
      "fuelType": "Oil"
    }
  }
}
```

### 3. Sales → Dynamic Field Values Relationship

#### Cardinality: 1 → 0..*
- **One sale** can have **zero or more custom field values**
- **Business Rule:** Flexible data collection per sale
- **Use Case:** Custom coverage options, special requirements

#### Implementation Details

**Parent Entity (Sales):**
```json
{
  "sales": {
    "sale123": {
      "dynamicFieldValueIds": ["val1", "val2"]
    }
  }
}
```

**Child Entity (Dynamic Field Values):**
```json
{
  "dynamicFieldValues": {
    "val1": {
      "fieldValueId": "val1",
      "saleId": "sale123",        // FK to sales
      "fieldId": "coverage_type", // FK to form_fields
      "fieldType": "select",
      "value": "extended_warranty"
    },
    "val2": {
      "fieldValueId": "val2",
      "saleId": "sale123",        // FK to sales
      "fieldId": "special_notes", // FK to form_fields
      "fieldType": "text",
      "value": "Customer requested priority service"
    }
  }
}
```

**Reference Entity (Form Fields):**
```json
{
  "form_fields": {
    "coverage_type": {
      "fieldId": "coverage_type",
      "fieldName": "coverageType",
      "fieldType": "select",
      "label": "Coverage Type",
      "options": ["basic", "extended_warranty", "comprehensive"]
    }
  }
}
```

---

## 🔄 Relationship Lifecycle Management

### 1. Creating Relationships

#### Appliance Addition Process
```javascript
async function addApplianceToSale(saleId, applianceData) {
  // Generate IDs
  const applianceId = generateUUID();

  // Create appliance record
  const applianceRef = firebase.database().ref(`appliances/${applianceId}`);
  await applianceRef.set({
    applianceId,
    saleId,
    ...applianceData,
    createdAt: new Date().toISOString()
  });

  // Update sale's applianceIds array
  const saleRef = firebase.database().ref(`sales/${saleId}/applianceIds`);
  const currentIds = (await saleRef.once('value')).val() || [];
  await saleRef.set([...currentIds, applianceId]);
}
```

#### Validation Checks
- Sale exists and user has access
- Appliance data is valid
- No duplicate appliances (optional business rule)
- Array size limits (optional)

### 2. Maintaining Relationship Integrity

#### Bidirectional Consistency
- **Forward:** Child.saleId must reference valid parent
- **Reverse:** Parent.relationshipIds must contain all valid children
- **Validation:** Check consistency during operations

#### Orphan Prevention
- **Delete Child:** Remove from parent's relationship array
- **Delete Parent:** Handle child records (cascade, reassign, or block)
- **Validation:** Prevent orphaned records

### 3. Querying Relationships

#### Get All Related Records
```javascript
async function getSaleWithRelationships(saleId) {
  // Get sale data
  const sale = await firebase.database()
    .ref(`sales/${saleId}`)
    .once('value');

  // Get related appliances
  const appliances = await firebase.database()
    .ref('appliances')
    .orderByChild('saleId')
    .equalTo(saleId)
    .once('value');

  // Get related boilers
  const boilers = await firebase.database()
    .ref('boilers')
    .orderByChild('saleId')
    .equalTo(saleId)
    .once('value');

  // Get dynamic field values
  const fieldValues = await firebase.database()
    .ref('dynamicFieldValues')
    .orderByChild('saleId')
    .equalTo(saleId)
    .once('value');

  return {
    sale: sale.val(),
    appliances: appliances.val(),
    boilers: boilers.val(),
    fieldValues: fieldValues.val()
  };
}
```

#### Cross-Entity Queries
```javascript
// Find all washing machines across all sales
async function getAllWashingMachines() {
  return await firebase.database()
    .ref('appliances')
    .orderByChild('type')
    .equalTo('Washing Machine')
    .once('value');
}

// Find sales by agent with appliance counts
async function getAgentSalesSummary(agentId) {
  const sales = await firebase.database()
    .ref('sales')
    .orderByChild('agentId')
    .equalTo(agentId)
    .once('value');

  // For each sale, count appliances
  const summary = {};
  sales.forEach(sale => {
    const saleId = sale.key;
    const applianceCount = sale.val().applianceIds?.length || 0;
    summary[saleId] = {
      ...sale.val(),
      applianceCount
    };
  });

  return summary;
}
```

---

## 🔐 Security Relationship Validation

### Access Control Patterns

#### 1. Parent-Child Relationship Security
```javascript
// Appliance access rule
".read": "auth != null && " +
  "root.child('sales').child(data.child('saleId').val()).child('agentId').val() === auth.uid || " +
  "auth.token.role === 'processor' || " +
  "auth.token.role === 'admin'"
```

**Logic:**
- User must be authenticated
- Must be the agent who owns the sale, OR
- Must be a processor, OR
- Must be an admin

#### 2. Reference Data Security
```javascript
// Form fields access rule (reference data)
".read": "auth != null && auth.token.role === 'admin'"
".write": "auth != null && auth.token.role === 'admin'"
```

**Logic:**
- Only admins can read/write field definitions
- Field values are secured through sale relationships

### Relationship Validation Rules

#### 1. Foreign Key Integrity
- Child records must reference valid parent
- Parent relationship arrays must be accurate
- Invalid references are rejected

#### 2. Ownership Validation
- Users can only access their own sales and related records
- Processors can access all sales and related records
- Admins have full access to all entities

#### 3. Cascade Prevention
- No automatic deletes (Firebase limitation)
- Manual cleanup required
- Documentation of dependencies

---

## 📊 Performance Optimization Strategies

### 1. Denormalized Read Optimization

#### Pre-computed Aggregations
```json
{
  "sales": {
    "sale123": {
      "applianceCount": 3,
      "boilerCount": 1,
      "totalMonthlyCost": 57.47
    }
  }
}
```

**Benefits:**
- Faster dashboard loading
- Reduced client-side calculations
- Better user experience

#### Update Triggers
- Appliance added/removed → Update sale aggregations
- Cost changes → Recalculate totals
- Use Firebase Cloud Functions for background updates

### 2. Client-Side Relationship Caching

#### Memory Cache Strategy
```javascript
class RelationshipCache {
  constructor() {
    this.cache = new Map();
    this.listeners = new Map();
  }

  async getSaleWithRelationships(saleId) {
    if (this.cache.has(saleId)) {
      return this.cache.get(saleId);
    }

    const data = await fetchSaleWithRelationships(saleId);
    this.cache.set(saleId, data);

    // Set up real-time listeners
    this.setupRealtimeListeners(saleId);

    return data;
  }
}
```

#### Cache Invalidation
- Time-based expiration
- Event-driven invalidation
- Memory limits and cleanup

### 3. Query Optimization Patterns

#### Compound Index Usage
```json
{
  "rules": {
    "appliances": {
      ".indexOn": ["saleId", "type", "make", "age"]
    }
  }
}
```

#### Efficient Query Patterns
- Use indexed fields for filtering
- Limit result sets with pagination
- Prefer specific queries over broad scans
- Cache frequently accessed data

---

## 🧪 Relationship Testing Strategy

### Unit Testing Relationships

#### 1. Foreign Key Validation Tests
```javascript
describe('Relationship Integrity', () => {
  test('appliance must reference valid sale', async () => {
    const invalidAppliance = {
      saleId: 'nonexistent-sale',
      type: 'Washing Machine'
    };

    await expect(createAppliance(invalidAppliance))
      .rejects.toThrow('Invalid sale reference');
  });

  test('sale applianceIds must contain valid appliances', async () => {
    const sale = await getSale('sale123');
    const applianceIds = sale.applianceIds;

    for (const id of applianceIds) {
      const appliance = await getAppliance(id);
      expect(appliance.saleId).toBe('sale123');
    }
  });
});
```

#### 2. CRUD Operation Tests
```javascript
describe('Relationship CRUD', () => {
  test('adding appliance updates both entities', async () => {
    const initialSale = await getSale('sale123');
    const initialCount = initialSale.applianceIds.length;

    await addApplianceToSale('sale123', applianceData);

    const updatedSale = await getSale('sale123');
    expect(updatedSale.applianceIds).toHaveLength(initialCount + 1);

    const appliances = await getAppliancesForSale('sale123');
    expect(appliances).toHaveLength(initialCount + 1);
  });
});
```

### Integration Testing

#### End-to-End Relationship Flows
1. **Create Sale** → Verify empty relationship arrays
2. **Add Appliance** → Verify both entities updated
3. **Query Relationships** → Verify correct data retrieval
4. **Update Appliance** → Verify changes propagate
5. **Delete Appliance** → Verify cleanup in both entities
6. **Delete Sale** → Verify proper handling of child records

#### Performance Testing
- Query response times for relationship-heavy operations
- Memory usage with cached relationships
- Network efficiency with batched operations
- Real-time synchronization overhead

---

## 📋 Relationship Maintenance Procedures

### 1. Data Consistency Checks

#### Daily Integrity Validation
```javascript
async function validateRelationships() {
  const issues = [];

  // Check all appliances reference valid sales
  const appliances = await firebase.database().ref('appliances').once('value');
  appliances.forEach(appliance => {
    const saleId = appliance.val().saleId;
    // Verify sale exists and contains appliance ID
  });

  // Check sale relationship arrays are accurate
  const sales = await firebase.database().ref('sales').once('value');
  sales.forEach(sale => {
    const applianceIds = sale.val().applianceIds || [];
    // Verify all IDs exist and reference this sale
  });

  return issues;
}
```

#### Orphaned Record Cleanup
```javascript
async function cleanupOrphanedRecords() {
  // Find appliances without valid sales
  // Find boilers without valid sales
  // Find field values without valid sales
  // Remove or reassign as appropriate
}
```

### 2. Relationship Monitoring

#### Real-time Health Checks
- Monitor relationship array consistency
- Alert on orphaned records
- Track query performance metrics
- Monitor client-side cache hit rates

#### Automated Maintenance
- Scheduled integrity checks
- Automated cleanup procedures
- Performance metric collection
- Anomaly detection and alerting

---

## 🎯 Relationship Mapping Complete

### Summary of Mapped Relationships

| Entity Relationship | Cardinality | Implementation | Status |
|---------------------|-------------|----------------|--------|
| Sales → Appliances | 1 → 0..* | Array + FK | ✅ Designed |
| Sales → Boilers | 1 → 0..* | Array + FK | ✅ Designed |
| Sales → Dynamic Fields | 1 → 0..* | Array + FK | ✅ Designed |
| Appliances → Sales | * → 1 | FK only | ✅ Designed |
| Boilers → Sales | * → 1 | FK only | ✅ Designed |
| Dynamic Fields → Sales | * → 1 | FK only | ✅ Designed |
| Dynamic Fields → Form Fields | * → 1 | FK only | ✅ Designed |

### Implementation Readiness

**✅ Relationship Design:** Complete with detailed specifications
**✅ Security Rules:** Designed for all relationship types
**✅ Query Patterns:** Optimized for Firebase Realtime Database
**✅ Testing Strategy:** Comprehensive validation procedures
**✅ Maintenance Procedures:** Automated integrity checks

**Phase 1 Relationship Mapping: COMPLETE** 🚀

**Ready to proceed with Firebase constraints documentation!**