# Migration Plan

**Generated:** 2026-01-08  
**Purpose:** Document migration strategy for existing fields to dynamic system

---

## Overview

Migrate 11 existing hardcoded form fields to dynamic `form_fields` database structure while maintaining backward compatibility with existing submissions.

---

## Pre-Migration Checklist

- [x] Database schema designed
- [x] Database rules updated
- [x] Migration script created
- [x] Backward compatibility layer created
- [ ] Backup strategy defined
- [ ] Staging test completed
- [ ] Rollback plan prepared

---

## Backup Strategy

### Before Migration

1. **Export Current Data:**
   ```bash
   # Export all sales data
   firebase database:get /sales --project appliance-bot > backup_sales_$(date +%Y%m%d).json
   
   # Export all users
   firebase database:get /users --project appliance-bot > backup_users_$(date +%Y%m%d).json
   ```

2. **Verify Backup:**
   - Check file sizes
   - Verify JSON validity
   - Store in safe location

3. **Document Current State:**
   - Count of submissions
   - Count of users
   - Field structure

### Backup Storage

- Store backups in: `_backups/`
- Keep for: 30 days minimum
- Document backup date/time

---

## Migration Steps

### Step 1: Pre-Migration (Completed ✅)

- [x] Design database schema
- [x] Create migration script
- [x] Update database rules
- [x] Create compatibility layer

### Step 2: Staging Test

1. **Run Migration Script:**
   ```bash
   node scripts/migrate-existing-fields.js
   ```

2. **Verify Results:**
   - Check form_fields in Firebase Console
   - Verify all 9 fields created
   - Check field order and properties

3. **Test Backward Compatibility:**
   - Load old submissions
   - Verify they display correctly
   - Test field value extraction

### Step 3: Production Migration

1. **Create Backup** (see Backup Strategy above)

2. **Run Migration:**
   ```bash
   node scripts/migrate-existing-fields.js
   ```

3. **Verify:**
   - Check Firebase Console
   - Test form rendering
   - Verify existing submissions accessible

### Step 4: Post-Migration

1. **Monitor:**
   - Check for errors
   - Verify form functionality
   - Test submission flow

2. **Document:**
   - Migration date/time
   - Fields migrated
   - Any issues encountered

---

## Rollback Plan

If migration causes issues:

1. **Restore Backup:**
   ```bash
   firebase database:set /sales backup_sales_YYYYMMDD.json --project appliance-bot
   ```

2. **Remove form_fields:**
   - Delete via Firebase Console or script
   - Revert to hardcoded fields

3. **Revert Code:**
   - Restore previous version of app.js
   - Restore previous database rules

---

## Risk Assessment

### Low Risk
- Field migration (read-only operation)
- Database rules update (tested)

### Medium Risk
- Form rendering changes (requires testing)
- Submission format changes (backward compatible)

### Mitigation
- Staging environment testing
- Gradual rollout
- Backward compatibility layer
- Comprehensive backups

---

## Success Criteria

- [x] All 9 fields migrated to form_fields
- [ ] Form renders correctly with dynamic fields
- [ ] Existing submissions still accessible
- [ ] New submissions work correctly
- [ ] No data loss
- [ ] Performance acceptable

---

## Timeline

- **Pre-Migration:** ✅ Complete
- **Staging Test:** Ready to execute
- **Production Migration:** After staging verification
- **Post-Migration:** Monitor for 24-48 hours

---

**Status:** ✅ Migration Script Ready  
**Next:** Execute staging test
