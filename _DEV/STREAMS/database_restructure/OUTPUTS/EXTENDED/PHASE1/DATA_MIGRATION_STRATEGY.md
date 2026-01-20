# Data Migration Strategy

**Stream:** database_restructure
**Phase:** 1 - Migration Planning
**Objective:** Safely migrate from embedded arrays to normalized one-to-many relationships

---

## 📊 Current vs Target Data Structure

### Current Structure (Embedded Arrays)
```json
{
  "sales": {
    "sale123": {
      "contact": {...},
      "plan": {...},
      "appliances": [
        {
          "type": "Washing Machine",
          "make": "Samsung",
          "model": "WW90T634DLH",
          "age": "3-5 years",
          "monthlyCost": 15.99
        },
        {
          "type": "Dishwasher",
          "make": "Bosch",
          "model": "SMS46MI01G",
          "age": "1-3 years",
          "monthlyCost": 12.50
        }
      ],
      "boilerCoverage": {
        "hasBoiler": true,
        "planType": "comprehensive",
        "monthlyCost": 25.99
      }
    }
  }
}
```

### Target Structure (Normalized)
```json
{
  "sales": {
    "sale123": {
      "contact": {...},
      "plan": {...},
      "applianceIds": ["app1", "app2"],
      "boilerIds": ["boil1"],
      "dynamicFieldValueIds": ["val1"]
    }
  },
  "appliances": {
    "app1": {
      "applianceId": "app1",
      "saleId": "sale123",
      "type": "Washing Machine",
      "make": "Samsung",
      "model": "WW90T634DLH",
      "age": "3-5 years",
      "monthlyCost": 15.99
    },
    "app2": {
      "applianceId": "app2",
      "saleId": "sale123",
      "type": "Dishwasher",
      "make": "Bosch",
      "model": "SMS46MI01G",
      "age": "1-3 years",
      "monthlyCost": 12.50
    }
  },
  "boilers": {
    "boil1": {
      "boilerId": "boil1",
      "saleId": "sale123",
      "type": "Combi Boiler",
      "make": "Worcester",
      "fuelType": "Gas",
      "monthlyCost": 25.99
    }
  }
}
```

---

## 🔄 Migration Phases

### Phase 1: Analysis & Preparation (1-2 weeks)

#### 1.1 Data Inventory
```javascript
async function analyzeCurrentData() {
  const sales = await firebase.database().ref('sales').once('value');
  const stats = {
    totalSales: 0,
    salesWithAppliances: 0,
    salesWithBoilers: 0,
    totalAppliances: 0,
    totalBoilers: 0,
    applianceTypes: {},
    boilerTypes: {}
  };

  sales.forEach(sale => {
    stats.totalSales++;
    const data = sale.val();

    // Analyze appliances
    if (data.appliances) {
      stats.salesWithAppliances++;
      stats.totalAppliances += data.appliances.length;
      data.appliances.forEach(appliance => {
        stats.applianceTypes[appliance.type] =
          (stats.applianceTypes[appliance.type] || 0) + 1;
      });
    }

    // Analyze boilers
    if (data.boilerCoverage && data.boilerCoverage.hasBoiler) {
      stats.salesWithBoilers++;
      stats.totalBoilers++;
      stats.boilerTypes[data.boilerCoverage.planType] =
        (stats.boilerTypes[data.boilerCoverage.planType] || 0) + 1;
    }
  });

  return stats;
}
```

**Expected Output:**
```
{
  totalSales: 150,
  salesWithAppliances: 120,
  salesWithBoilers: 45,
  totalAppliances: 280,
  totalBoilers: 45,
  applianceTypes: {
    "Washing Machine": 85,
    "Dishwasher": 62,
    "Fridge": 45,
    ...
  }
}
```

#### 1.2 Data Quality Assessment
```javascript
async function assessDataQuality() {
  const issues = {
    missingRequiredFields: [],
    invalidDataTypes: [],
    orphanedReferences: [],
    duplicateData: []
  };

  const sales = await firebase.database().ref('sales').once('value');
  sales.forEach(sale => {
    const data = sale.val();
    const saleId = sale.key;

    // Check appliances array
    if (data.appliances) {
      data.appliances.forEach((appliance, index) => {
        if (!appliance.type || !appliance.make || !appliance.model) {
          issues.missingRequiredFields.push({
            saleId,
            applianceIndex: index,
            missing: ['type', 'make', 'model'].filter(f => !appliance[f])
          });
        }
      });
    }

    // Check boiler data
    if (data.boilerCoverage) {
      if (data.boilerCoverage.hasBoiler && !data.boilerCoverage.planType) {
        issues.missingRequiredFields.push({
          saleId,
          field: 'boilerCoverage.planType'
        });
      }
    }
  });

  return issues;
}
```

#### 1.3 Migration Risk Assessment
- **Data Volume:** Estimate based on analysis
- **Complexity:** Assess transformation logic requirements
- **Dependencies:** Identify external system impacts
- **Rollback:** Design reversal procedures

### Phase 2: Development & Testing (2-3 weeks)

#### 2.1 Migration Script Development
```javascript
class DatabaseMigration {
  constructor() {
    this.backupPath = '/backups/migration';
    this.checkpoints = [];
  }

  async migrateAppliances() {
    const sales = await firebase.database().ref('sales').once('value');
    const migrationResults = {
      processed: 0,
      successful: 0,
      failed: 0,
      errors: []
    };

    for (const sale of sales) {
      const saleId = sale.key;
      const saleData = sale.val();

      if (saleData.appliances && Array.isArray(saleData.appliances)) {
        const applianceIds = [];

        for (const applianceData of saleData.appliances) {
          try {
            const applianceId = await this.createApplianceRecord(saleId, applianceData);
            applianceIds.push(applianceId);
            migrationResults.successful++;
          } catch (error) {
            migrationResults.errors.push({
              saleId,
              applianceData,
              error: error.message
            });
            migrationResults.failed++;
          }
        }

        // Update sale with relationship array
        await firebase.database()
          .ref(`sales/${saleId}`)
          .update({ applianceIds });

        // Create checkpoint
        this.checkpoints.push({
          saleId,
          applianceIds,
          timestamp: new Date().toISOString()
        });
      }

      migrationResults.processed++;
    }

    return migrationResults;
  }

  async createApplianceRecord(saleId, applianceData) {
    const applianceId = generateUUID();

    const applianceRecord = {
      applianceId,
      saleId,
      type: applianceData.type,
      make: applianceData.make,
      model: applianceData.model,
      age: applianceData.age || 'Unknown',
      monthlyCost: applianceData.monthlyCost || 0,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Add optional fields if present
    if (applianceData.serialNumber) applianceRecord.serialNumber = applianceData.serialNumber;
    if (applianceData.warrantyExpiry) applianceRecord.warrantyExpiry = applianceData.warrantyExpiry;

    await firebase.database()
      .ref(`appliances/${applianceId}`)
      .set(applianceRecord);

    return applianceId;
  }
}
```

#### 2.2 Rollback Procedures
```javascript
async function rollbackMigration() {
  console.log('Starting migration rollback...');

  // Remove all new entities
  await firebase.database().ref('appliances').remove();
  await firebase.database().ref('boilers').remove();
  await firebase.database().ref('dynamicFieldValues').remove();

  // Restore original embedded data from backup
  const backup = await firebase.database()
    .ref(`${this.backupPath}/sales`)
    .once('value');

  await firebase.database().ref('sales').set(backup.val());

  // Remove relationship arrays
  const sales = await firebase.database().ref('sales').once('value');
  const updates = {};
  sales.forEach(sale => {
    updates[`${sale.key}/applianceIds`] = null;
    updates[`${sale.key}/boilerIds`] = null;
    updates[`${sale.key}/dynamicFieldValueIds`] = null;
  });

  await firebase.database().ref('sales').update(updates);

  console.log('Migration rollback completed');
}
```

#### 2.3 Testing Strategy
```javascript
describe('Migration Testing', () => {
  test('migration preserves all appliance data', async () => {
    const originalSale = await getOriginalSaleData('sale123');
    await runMigration();
    const migratedSale = await getMigratedSaleData('sale123');

    expect(migratedSale.applianceIds).toHaveLength(originalSale.appliances.length);
    expect(migratedSale.appliances).toBeUndefined(); // Embedded array removed

    // Verify individual appliance records
    for (const applianceId of migratedSale.applianceIds) {
      const appliance = await getAppliance(applianceId);
      expect(appliance.saleId).toBe('sale123');
      expect(appliance.type).toBeDefined();
      expect(appliance.make).toBeDefined();
    }
  });

  test('rollback restores original structure', async () => {
    const originalData = await backupData();
    await runMigration();
    await rollbackMigration();
    const restoredData = await getCurrentData();

    expect(restoredData).toEqual(originalData);
  });
});
```

### Phase 3: Execution & Validation (1 week)

#### 3.1 Production Migration
```javascript
async function executeProductionMigration() {
  const migration = new DatabaseMigration();

  try {
    // Pre-migration validation
    await migration.validatePreConditions();

    // Create backup
    await migration.createFullBackup();

    // Execute in phases
    console.log('Phase 1: Migrating appliances...');
    const applianceResults = await migration.migrateAppliances();

    console.log('Phase 2: Migrating boilers...');
    const boilerResults = await migration.migrateBoilers();

    console.log('Phase 3: Migrating dynamic fields...');
    const fieldResults = await migration.migrateDynamicFields();

    // Post-migration validation
    await migration.validatePostConditions();

    // Update schema version
    await migration.updateSchemaVersion();

    console.log('Migration completed successfully!');

  } catch (error) {
    console.error('Migration failed:', error);
    await migration.rollback();
    throw error;
  }
}
```

#### 3.2 Validation Procedures
```javascript
async function validateMigration() {
  const validationResults = {
    salesCount: 0,
    appliancesCount: 0,
    boilersCount: 0,
    fieldValuesCount: 0,
    relationshipIntegrity: true,
    dataIntegrity: true,
    issues: []
  };

  // Count entities
  validationResults.salesCount = (await firebase.database().ref('sales').once('value')).numChildren();
  validationResults.appliancesCount = (await firebase.database().ref('appliances').once('value')).numChildren();
  validationResults.boilersCount = (await firebase.database().ref('boilers').once('value')).numChildren();
  validationResults.fieldValuesCount = (await firebase.database().ref('dynamicFieldValues').once('value')).numChildren();

  // Validate relationships
  const sales = await firebase.database().ref('sales').once('value');
  for (const sale of sales) {
    const saleId = sale.key;
    const saleData = sale.val();

    // Check appliance relationships
    if (saleData.applianceIds) {
      for (const applianceId of saleData.applianceIds) {
        const appliance = await firebase.database()
          .ref(`appliances/${applianceId}`)
          .once('value');

        if (!appliance.exists()) {
          validationResults.relationshipIntegrity = false;
          validationResults.issues.push(`Missing appliance: ${applianceId}`);
        } else if (appliance.val().saleId !== saleId) {
          validationResults.relationshipIntegrity = false;
          validationResults.issues.push(`Invalid appliance relationship: ${applianceId}`);
        }
      }
    }
  }

  return validationResults;
}
```

### Phase 4: Post-Migration Monitoring (Ongoing)

#### 4.1 Performance Monitoring
- Query response times
- Application error rates
- User feedback collection
- Performance regression detection

#### 4.2 Data Integrity Monitoring
- Automated relationship validation
- Orphaned record detection
- Data consistency checks
- Alert system for anomalies

#### 4.3 Application Updates
- Update client code for new data structure
- Deploy application changes
- User training and communication
- Support documentation updates

---

## 🛡️ Risk Mitigation

### Technical Risks
- **Data Loss:** Comprehensive backup strategy
- **Inconsistent State:** Transaction simulation and rollback
- **Performance Impact:** Monitoring and optimization
- **Application Breaks:** Feature flags and gradual rollout

### Business Risks
- **Downtime:** Scheduled maintenance windows
- **User Impact:** Clear communication and support
- **Data Accuracy:** Multiple validation checkpoints
- **Rollback Capability:** Tested rollback procedures

### Mitigation Strategies
- **Phased Rollout:** Test environment → Staging → Production
- **Feature Flags:** Gradual feature activation
- **Monitoring:** Comprehensive logging and alerting
- **Support:** Dedicated migration support team

---

## 📋 Migration Checklist

### Pre-Migration
- [ ] Data inventory completed
- [ ] Data quality assessment done
- [ ] Migration scripts developed and tested
- [ ] Rollback procedures implemented
- [ ] Backup strategy validated
- [ ] Stakeholder communication sent
- [ ] Maintenance window scheduled

### During Migration
- [ ] Pre-migration validation passed
- [ ] Full backup created
- [ ] Migration executed in phases
- [ ] Progress monitoring active
- [ ] Error handling functional
- [ ] Rollback capability ready

### Post-Migration
- [ ] Validation checks passed
- [ ] Application functionality verified
- [ ] Performance benchmarks met
- [ ] User acceptance testing completed
- [ ] Documentation updated
- [ ] Monitoring systems active

---

## ⏱️ Timeline & Milestones

### Week 1-2: Analysis & Development
- Data analysis and quality assessment
- Migration script development
- Testing environment setup
- Risk assessment completion

### Week 3-4: Testing & Validation
- Unit testing of migration logic
- Integration testing with application
- Performance testing
- User acceptance testing

### Week 5: Production Migration
- Pre-migration validation
- Production migration execution
- Post-migration validation
- Application deployment

### Week 6+: Monitoring & Optimization
- Performance monitoring
- Issue resolution
- Optimization implementation
- Documentation finalization

---

## 🎯 Success Criteria

### Technical Success
- [ ] All data migrated without loss
- [ ] Relationships properly established
- [ ] Application functions with new schema
- [ ] Performance meets requirements
- [ ] Rollback capability maintained

### Business Success
- [ ] No user-facing downtime
- [ ] All existing functionality preserved
- [ ] New features work correctly
- [ ] User feedback positive
- [ ] Support tickets minimal

### Quality Success
- [ ] Code coverage > 90% for migration logic
- [ ] Automated tests passing
- [ ] Documentation complete
- [ ] Peer review completed
- [ ] Security assessment passed

---

## 🚀 Migration Strategy Complete

**Migration Approach:** Phased, tested, reversible
**Risk Level:** Medium (with comprehensive mitigation)
**Timeline:** 5-6 weeks total
**Success Probability:** High (with proper preparation)

**Phase 1 Migration Planning: COMPLETE** ✅

**Ready to proceed with Phase 2: Implementation & Migration** 🚀