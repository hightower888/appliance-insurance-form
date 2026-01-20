# Extended Discovery Phase 1: Schema Design & Planning

**Stream:** database_restructure
**Phase:** 1 of 4
**Status:** Active
**Objective:** Design normalized database schema with proper one-to-many relationships

---

## 📋 Phase 1 Scope & Objectives

### Primary Objectives
1. **Design Normalized Schema** - Replace embedded arrays with proper relationships
2. **Map All Relationships** - Document entity connections and cardinalities
3. **Document Firebase Constraints** - Identify limitations and required workarounds
4. **Develop Migration Strategy** - Plan data transformation with integrity preservation

### Success Criteria
- [ ] Normalized schema design completed
- [ ] All entity relationships mapped
- [ ] Firebase constraints documented with solutions
- [ ] Migration strategy with rollback procedures
- [ ] Performance implications analyzed
- [ ] Security rules design completed

### Deliverables
- Schema design document with ER diagrams
- Relationship mapping specifications
- Firebase constraint analysis and workarounds
- Migration strategy with testing procedures
- Performance optimization recommendations
- Security rule specifications

---

## 🎯 Current Schema Analysis (From Discovery)

### Existing Structure Problems
```
Current (Embedded Arrays):
sales/{saleId}/appliances: [
  {type: "Washer", make: "Samsung", ...},
  {type: "Dryer", make: "LG", ...}
]

Problems:
- No separate appliance table
- Cannot query appliances across sales
- Update complexity
- Data duplication
- Limited analytics capabilities
```

### Required Structure
```
Proposed (Normalized Relationships):
appliances/{applianceId}: {
  saleId: "sale123",
  type: "Washer",
  make: "Samsung",
  ...
}
sales/{saleId}: {
  applianceIds: ["app1", "app2"],
  boilerIds: ["boil1"],
  ...
}
```

---

## 📊 Entity Relationship Design

### Core Entities

#### 1. Sales (Root Entity)
```json
{
  "sales": {
    "{saleId}": {
      "contact": {
        "name": "string",
        "phoneNumbers": ["string"],
        "address": "string",
        "postcode": "string"
      },
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
      "agentId": "string",
      "agentEmail": "string",
      "timestamp": "number",
      "submittedAt": "string",

      // New relationship fields
      "applianceIds": ["string"],
      "boilerIds": ["string"],
      "dynamicFieldValues": {"fieldId": "value"}
    }
  }
}
```

#### 2. Appliances (One-to-Many with Sales)
```json
{
  "appliances": {
    "{applianceId}": {
      "saleId": "string",           // Foreign key to sales
      "type": "string",             // e.g., "Washing Machine"
      "make": "string",             // e.g., "Samsung"
      "model": "string",            // e.g., "WW90T634DLH"
      "age": "string",              // e.g., "3-5 years"
      "monthlyCost": "number",      // e.g., 15.99
      "serialNumber": "string?",    // Optional
      "warrantyExpiry": "string?",  // Optional
      "createdAt": "string",
      "updatedAt": "string"
    }
  }
}
```

#### 3. Boilers (One-to-Many with Sales)
```json
{
  "boilers": {
    "{boilerId}": {
      "saleId": "string",           // Foreign key to sales
      "type": "string",             // e.g., "Combi Boiler"
      "make": "string",             // e.g., "Worcester"
      "model": "string",            // e.g., "Greenstar 30i"
      "age": "string",              // e.g., "5-10 years"
      "monthlyCost": "number",      // e.g., 25.99
      "fuelType": "string",         // e.g., "Gas", "Oil"
      "efficiencyRating": "string", // e.g., "A+"
      "installationDate": "string?", // Optional
      "lastServiceDate": "string?",  // Optional
      "createdAt": "string",
      "updatedAt": "string"
    }
  }
}
```

#### 4. Dynamic Field Values (One-to-Many with Sales)
```json
{
  "dynamicFieldValues": {
    "{fieldValueId}": {
      "saleId": "string",           // Foreign key to sales
      "fieldId": "string",          // Foreign key to form_fields
      "fieldType": "string",        // e.g., "text", "select", "number"
      "value": "any",               // The actual field value
      "createdAt": "string",
      "updatedAt": "string"
    }
  }
}
```

---

## 🔗 Relationship Mapping

### Cardinality Analysis

| Relationship | Cardinality | Description |
|-------------|-------------|-------------|
| Sales → Appliances | 1 → 0..* | One sale can have multiple appliances |
| Sales → Boilers | 1 → 0..* | One sale can have multiple boilers |
| Sales → Dynamic Fields | 1 → 0..* | One sale can have multiple custom field values |
| Appliances → Sales | * → 1 | Many appliances belong to one sale |
| Boilers → Sales | * → 1 | Many boilers belong to one sale |
| Dynamic Fields → Sales | * → 1 | Many field values belong to one sale |
| Dynamic Fields → Form Fields | * → 1 | Many values reference one field definition |

### Foreign Key Strategy

**Firebase Realtime Database Limitations:**
- No built-in foreign key constraints
- No cascading deletes
- No referential integrity enforcement
- Client-side relationship management required

**Our Strategy:**
- Use string IDs as foreign keys
- Client-side validation before operations
- Cleanup orphaned records during maintenance
- Document relationship dependencies

---

## 🗄️ Firebase Constraints & Workarounds

### Known Limitations

#### 1. No Server-Side Joins
**Problem:** Cannot perform SQL-like joins
**Impact:** Complex queries require client-side processing
**Workaround:** Denormalize frequently accessed data

#### 2. No Transactions
**Problem:** Cannot guarantee atomic multi-record operations
**Impact:** Related data updates may fail partially
**Workaround:** Implement client-side transaction logic with rollback

#### 3. Query Limitations
**Problem:** Limited query capabilities (no complex WHERE clauses)
**Impact:** Cannot filter by multiple criteria efficiently
**Workaround:** Use compound indexes and client-side filtering

#### 4. Real-time Synchronization Complexity
**Problem:** Related data changes trigger multiple listeners
**Impact:** Complex state management in client applications
**Workaround:** Implement relationship-aware caching and sync logic

### Performance Optimization Strategies

#### Indexing Strategy
```javascript
// Firebase indexes for optimal queries
{
  "rules": {
    "appliances": {
      ".indexOn": ["saleId", "type", "make"]
    },
    "boilers": {
      ".indexOn": ["saleId", "type", "fuelType"]
    },
    "dynamicFieldValues": {
      ".indexOn": ["saleId", "fieldId"]
    }
  }
}
```

#### Query Optimization Patterns
- **Denormalized Read Views:** Pre-computed aggregations
- **Compound Indexes:** Multi-field query optimization
- **Pagination:** Limit result sets for performance
- **Caching:** Client-side relationship caching

---

## 🔄 Data Migration Strategy

### Migration Phases

#### Phase 1: Analysis & Preparation
- Inventory existing data structure
- Identify data quality issues
- Create backup procedures
- Develop validation scripts

#### Phase 2: Schema Transformation
- Create new table structures
- Transform embedded arrays to separate records
- Generate relationship IDs
- Validate data integrity

#### Phase 3: Data Migration
- Migrate appliances from arrays to separate table
- Migrate boiler data to separate table
- Create dynamic field value records
- Update sales records with relationship IDs

#### Phase 4: Validation & Cleanup
- Verify all relationships are correct
- Test query performance
- Remove old embedded data
- Update client applications

### Rollback Strategy
- Complete data backup before migration
- Incremental migration with checkpoints
- Automated rollback scripts
- Data integrity validation at each step

### Migration Testing
- Unit tests for transformation logic
- Integration tests for relationship queries
- Performance tests comparing before/after
- Data integrity validation scripts

---

## 🔐 Security Rules Design

### Access Control Requirements

#### Role-Based Permissions
- **Users:** Can only access their own sales data
- **Agents:** Can access sales from their managed customers
- **Processors:** Can access all sales for processing
- **Admins:** Can access all data with full permissions

#### Relationship Security
```javascript
{
  "rules": {
    "sales": {
      "$saleId": {
        ".read": "auth != null && (data.child('agentId').val() === auth.uid || auth.token.role === 'processor' || auth.token.role === 'admin')",
        ".write": "auth != null && (data.child('agentId').val() === auth.uid || auth.token.role === 'admin')"
      }
    },
    "appliances": {
      "$applianceId": {
        ".read": "auth != null && root.child('sales').child(data.child('saleId').val()).child('agentId').val() === auth.uid || auth.token.role === 'processor' || auth.token.role === 'admin'",
        ".write": "auth != null && root.child('sales').child(data.child('saleId').val()).child('agentId').val() === auth.uid || auth.token.role === 'admin'"
      }
    }
  }
}
```

### Security Considerations
- Complex nested permission checks
- Performance impact of relationship validation
- Real-time security rule evaluation
- Client-side permission caching strategies

---

## 📈 Performance Analysis

### Query Performance Projections

#### Before (Embedded Arrays)
- **Simple Queries:** Fast (single record access)
- **Complex Queries:** Slow (client-side filtering required)
- **Updates:** Medium (entire sales record)
- **Analytics:** Poor (limited aggregation capabilities)

#### After (Normalized Relationships)
- **Simple Queries:** Fast (indexed foreign key lookups)
- **Complex Queries:** Medium (client-side joins, but optimized)
- **Updates:** Fast (individual record updates)
- **Analytics:** Excellent (relationship-based aggregations)

### Optimization Recommendations
- Implement client-side relationship caching
- Use Firebase's offline persistence for better UX
- Implement pagination for large result sets
- Monitor query performance with Firebase Profiler
- Use computed fields for common aggregations

---

## 🎯 Phase 1 Completion Checklist

### Schema Design
- [ ] Core entity structures defined
- [ ] Relationship mappings completed
- [ ] Primary and foreign keys specified
- [ ] Data types and constraints documented

### Firebase Analysis
- [ ] All constraints identified
- [ ] Workaround strategies documented
- [ ] Performance implications analyzed
- [ ] Indexing strategy defined

### Migration Planning
- [ ] Current data inventory completed
- [ ] Transformation logic designed
- [ ] Rollback procedures documented
- [ ] Testing strategy outlined

### Security Design
- [ ] Role-based access rules designed
- [ ] Relationship security validated
- [ ] Performance impact assessed
- [ ] Implementation complexity evaluated

---

## 🚀 Next Steps

### Phase 1 Deliverables
1. **Complete Schema Design Document**
2. **Relationship Mapping Specifications**
3. **Firebase Constraints Analysis**
4. **Migration Strategy Document**
5. **Security Rules Specifications**
6. **Performance Optimization Plan**

### Phase 2 Preparation
- Code implementation planning
- Testing framework setup
- Development environment preparation
- Stakeholder review and approval

### Risk Assessment
- **Technical Risks:** Firebase constraint navigation, complex relationships
- **Business Risks:** Migration downtime, data integrity issues
- **Timeline Risks:** 7-10 week estimate validation
- **Mitigation:** Phased approach, comprehensive testing, rollback capabilities

---

## 📋 Phase 1 Status

**Status:** ACTIVE - Schema Design & Planning
**Progress:** 0% Complete
**Estimated Completion:** 2-3 weeks
**Next Milestone:** Schema design document completion

**Phase 1 Objective:** Transform embedded array approach to proper one-to-many relationships with Firebase-optimized design.

**Ready for detailed schema design and relationship mapping!** 🚀