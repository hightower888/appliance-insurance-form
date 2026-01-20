/**
 * Migration Script: Convert Existing Hardcoded Fields to Dynamic Form Fields
 * 
 * This script migrates the 11 existing hardcoded form fields to the new
 * dynamic form_fields database structure.
 * 
 * Usage: node scripts/migrate-existing-fields.js
 */

const admin = require('firebase-admin');
const serviceAccount = require('../service-account-key.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://appliance-bot-default-rtdb.firebaseio.com'
});

const db = admin.database();

// Existing fields from appliance_form.html (in order)
const existingFields = [
  {
    fieldName: 'name',
    fieldLabel: 'Name',
    fieldType: 'text',
    required: true,
    order: 1,
    section: 'Contact Details',
    validation: { minLength: 2, maxLength: 100 }
  },
  {
    fieldName: 'phoneNumbers',
    fieldLabel: 'Phone Numbers',
    fieldType: 'tel',
    required: true,
    order: 2,
    section: 'Contact Details',
    validation: { pattern: '^[0-9\\s\\-\\+()]+$' }
  },
  {
    fieldName: 'email',
    fieldLabel: 'Email',
    fieldType: 'email',
    required: false,
    order: 3,
    section: 'Contact Details',
    validation: {}
  },
  {
    fieldName: 'adress',
    fieldLabel: 'Address',
    fieldType: 'text',
    required: true,
    order: 4,
    section: 'Contact Details',
    validation: { minLength: 5, maxLength: 200 }
  },
  {
    fieldName: 'postcode',
    fieldLabel: 'Postcode',
    fieldType: 'text',
    required: true,
    order: 5,
    section: 'Contact Details',
    validation: { pattern: '^[A-Z0-9\\s]+$', maxLength: 10 }
  },
  {
    fieldName: 'sortCode',
    fieldLabel: 'Sort Code',
    fieldType: 'text',
    required: true,
    order: 6,
    section: 'Direct Debit Details',
    validation: { pattern: '^[0-9]{6}$', minLength: 6, maxLength: 6 }
  },
  {
    fieldName: 'accountNumber',
    fieldLabel: 'Account number',
    fieldType: 'text',
    required: true,
    order: 7,
    section: 'Direct Debit Details',
    validation: { pattern: '^[0-9]{8}$', minLength: 8, maxLength: 8 }
  },
  {
    fieldName: 'ddDate',
    fieldLabel: 'DD Date',
    fieldType: 'select',
    required: true,
    order: 8,
    section: 'Direct Debit Details',
    validation: {
      options: [
        { value: '1', label: '1st of month' },
        { value: '8', label: '8th of month' },
        { value: '15', label: '15th of month' },
        { value: '22', label: '22nd of month' },
        { value: '28', label: '28th of month' }
      ]
    }
  },
  {
    fieldName: 'notes',
    fieldLabel: 'Notes - e.g. whats covered',
    fieldType: 'textarea',
    required: false,
    order: 9,
    section: 'Additional Information',
    validation: { maxLength: 1000 }
  }
];

async function migrateFields() {
  console.log('🚀 Starting field migration...\n');
  console.log(`📋 Migrating ${existingFields.length} fields to form_fields database\n`);

  const timestamp = new Date().toISOString();
  const adminUserId = 'migration-script'; // Or get from environment

  try {
    // Check if fields already exist
    const existingFieldsRef = db.ref('form_fields');
    const snapshot = await existingFieldsRef.once('value');
    
    if (snapshot.exists() && snapshot.numChildren() > 0) {
      console.log('⚠️  WARNING: form_fields already contains data!');
      console.log('   Existing fields:', snapshot.numChildren());
      console.log('   This migration will add new fields or update existing ones.\n');
    }

    let created = 0;
    let updated = 0;

    for (const field of existingFields) {
      const fieldRef = db.ref(`form_fields/${field.fieldName}`);
      const existingField = await fieldRef.once('value');

      const fieldData = {
        fieldId: field.fieldName,
        fieldName: field.fieldName,
        fieldLabel: field.fieldLabel,
        fieldType: field.fieldType,
        required: field.required,
        order: field.order,
        section: field.section,
        validation: field.validation || {},
        defaultValue: '',
        helpText: '',
        createdAt: existingField.exists() ? existingField.val().createdAt : timestamp,
        updatedAt: timestamp,
        createdBy: existingField.exists() ? existingField.val().createdBy : adminUserId,
        updatedBy: adminUserId
      };

      if (existingField.exists()) {
        await fieldRef.update(fieldData);
        console.log(`   ✅ Updated: ${field.fieldLabel} (${field.fieldName})`);
        updated++;
      } else {
        await fieldRef.set(fieldData);
        console.log(`   ✅ Created: ${field.fieldLabel} (${field.fieldName})`);
        created++;
      }
    }

    console.log('\n==================================================');
    console.log('📊 Migration Summary:');
    console.log('==================================================');
    console.log(`✅ Created: ${created} fields`);
    console.log(`🔄 Updated: ${updated} fields`);
    console.log(`📋 Total: ${existingFields.length} fields`);
    console.log('==================================================\n');
    console.log('✅ Migration complete! Fields are now in form_fields database.\n');

  } catch (error) {
    console.error('❌ Migration error:', error);
    throw error;
  }
}

// Run migration
migrateFields()
  .then(() => {
    console.log('✅ Migration script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Migration script failed:', error);
    process.exit(1);
  });
