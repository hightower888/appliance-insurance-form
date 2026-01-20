# Stream Intent: Dynamic Form & Processor System

## Primary Goal

Enhance the appliance insurance form application with:
1. **Dynamic Form Field Management** - Admin can add/remove fields and toggle required status
2. **Enhanced Admin Table** - Display all collected fields with search, filter, and sort
3. **Processor Role** - New user type for data processors
4. **CSV Field Mapping** - Processors can map form fields to custom CSV column names
5. **Profile-Based Mapping Rules** - Each processor saves their own mapping configuration

## Functional Requirements

### 1. Dynamic Form Field Management
- Admin can add new form fields (text, email, tel, number, select, textarea, checkbox, radio)
- Admin can remove existing fields
- Admin can toggle required status for any field
- Field configuration stored in database
- Form dynamically renders based on configuration
- Validation rules applied based on field type and required status

### 2. Enhanced Admin Sales Table
- Display ALL collected fields from form submissions
- Searchable across all fields
- Filterable by field values (date range, agent, plan type, etc.)
- Sortable by any column
- Export to CSV with all fields
- Pagination for large datasets

### 3. Processor Role & Authentication
- New user role: "processor"
- Processor login redirects to processor dashboard
- Processors can view sales data (read-only or with export permissions)
- Processors have their own profile/settings page

### 4. CSV Field Mapping System
- Processor can view/download sales data as CSV
- Processor can map form field names to custom CSV column names
- Example: "Name" → "Customer Name", "Email" → "Email Address"
- Mapping rules saved per processor
- Multiple mapping profiles per processor (optional)

### 5. Profile Management
- Processor profile stores:
  - Field mapping rules (form field → CSV column name)
  - Default export preferences
  - Saved mapping profiles
- Admin can view processor profiles
- Processors can edit their own profiles

## Technical Requirements

### Database Structure
- `form_fields` - Dynamic field configuration
  - fieldId, fieldName, fieldType, required, order, validation
- `processor_profiles` - Processor-specific settings
  - userId, fieldMappings (JSON), exportPreferences
- `sales` - Enhanced to store all dynamic fields

### User Roles
- `admin` - Full access, can manage form fields
- `agent` - Submit forms only
- `processor` - View sales, export CSV with custom mappings

### API/Backend
- Field configuration CRUD endpoints
- CSV export with field mapping
- Processor profile management

## Success Criteria
- Admin can add/remove/toggle form fields
- All form fields visible in admin table
- Search, filter, sort working on all fields
- Processors can log in and access dashboard
- Processors can create and save field mappings
- CSV export uses processor's mapping rules
- System is scalable and maintainable

## Constraints
- Must work with existing database structure
- Must maintain backward compatibility with existing submissions
- Must use Firebase Realtime Database
- Must be responsive and accessible
