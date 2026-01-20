# CSV Format Mapping

## Form Updated to Match CSV Structure

The form now collects data in the exact format required by your CSV file: **"DDS NEED ! - Sales.csv"**

---

## CSV Column Mapping

| CSV Column | Form Field | Type | Auto-Generated | Notes |
|------------|------------|------|----------------|-------|
| **Plan number** | Generated | Text | ✅ YES | Format: `NDACXXXXAPP` (auto-generated on submit) |
| **Phone Numbers** | Phone Numbers | Tel | ❌ | User enters phone number |
| **Name** | Name | Text | ❌ | User's full name |
| **Adress** | Adress | Text | ❌ | Note: Matches CSV spelling (one 'd') |
| **Postcode** | Postcode | Text | ❌ | Auto-converts to uppercase |
| **Email** | Email | Email | ❌ | Optional field |
| **Plan** | Auto-detected | Text | ✅ YES | "Appliance" or "Appliance + Boiler" |
| **Total Cost** | Total Cost | Number | ⚡ AUTO | Calculated, but editable |
| **Sort Code** | Sort Code | Text | ❌ | 6 digits, no hyphens (e.g., 123456) |
| **Account number** | Account number | Text | ❌ | Exactly 8 digits |
| **DD Date** | DD Date | Dropdown | ❌ | Day of month (1, 8, 15, 22, 28) |
| **Notes - e.g. whats covered** | Notes | Textarea | ⚡ AUTO | Auto-populated with appliance list, editable |
| **Agents** | Agents | Text | ❌ | Agent name handling the sale |

---

## Key Changes Made

### 1. **Field Name Updates**
- ✅ `fullName` → `Name`
- ✅ `phone` → `Phone Numbers`
- ✅ `address` → `Adress` (matches CSV spelling)
- ✅ Removed `accountName` (not in CSV)
- ✅ Added `DD Date` dropdown
- ✅ Added `Notes` textarea
- ✅ Added `Agents` field

### 2. **Sort Code Format**
- ❌ OLD: `12-34-56` (with hyphens)
- ✅ NEW: `123456` (6 digits, no hyphens) - matches CSV format

### 3. **Auto-Generated Fields**
- **Plan number**: `NDACXXXXAPP` format (random 4 digits)
- **Plan**: Automatically set to:
  - `"Appliance"` if only appliances selected
  - `"Appliance + Boiler"` if boiler cover added
- **Notes**: Auto-populated with appliance details (e.g., "Washing Machine - Bosch WAT28371GB, Dishwasher - Samsung DW60M6040BB")

### 4. **DD Date Format**
- Dropdown with common DD dates: 1st, 8th, 15th, 22nd, 28th
- Formatted as: `DD/MM/YYYY` (e.g., `8/1/2026`)

### 5. **Total Cost**
- Auto-calculates: (Number of appliances × £5.99) + Boiler cost
- **Editable**: Sales agent can manually adjust if needed
- Stored as number (e.g., `20` not `£20.00`)

---

## Data Output Example

When the form is submitted, the data is structured to match your CSV exactly:

```json
{
  "Plan number": "NDAC7423APP",
  "Phone Numbers": "07123456789",
  "Name": "John Smith",
  "Adress": "123 High Street",
  "Postcode": "SW1A 1AA",
  "Email": "john@example.com",
  "Plan": "Appliance",
  "Total Cost": 20,
  "Sort Code": "123456",
  "Account number": "12345678",
  "DD Date": "8/1/2026",
  "Notes - e.g. whats covered": "Washing Machine - Bosch Serie 6, Dishwasher - Samsung",
  "Agents": "Francis",
  "timestamp": 1704723600000,
  "submittedAt": "2026-01-08T12:00:00.000Z",
  "status": "pending"
}
```

---

## CSV Export Ready

The data structure now matches your CSV format exactly, making it easy to:

1. **Export from Firebase** → CSV
2. **Import directly** into your existing system
3. **Merge with existing data** without format conflicts

---

## Field Validation

| Field | Validation | Example |
|-------|------------|---------|
| Name | Required | "John Smith" |
| Phone Numbers | Required, 10-11 digits | "07123456789" |
| Adress | Required | "123 High Street" |
| Postcode | Required | "SW1A 1AA" |
| Email | Optional, valid email format | "john@example.com" |
| Sort Code | Required, exactly 6 digits | "123456" |
| Account number | Required, exactly 8 digits | "12345678" |
| DD Date | Required, dropdown selection | "8" |
| Agents | Required | "Francis" |
| Total Cost | Required, auto-calculated | "20" |

---

## Firebase Storage Path

Data is saved to: `appliance_submissions/{unique-id}/`

Each submission includes:
- All CSV columns (as shown above)
- Detailed appliance breakdown (for reference)
- Timestamp and submission metadata
- Status tracking ("pending", "processed", "cancelled")

---

## Testing Checklist

- [x] Form field names match CSV columns exactly
- [x] Sort code accepts 6 digits (no hyphens)
- [x] Account number validates 8 digits
- [x] Plan number auto-generates in NDACXXXXAPP format
- [x] Plan type auto-detects (Appliance / Appliance + Boiler)
- [x] Total cost auto-calculates but is editable
- [x] DD Date dropdown with common dates
- [x] Notes auto-populate with appliance list
- [x] Agents field added and required
- [x] Data structure matches CSV format
- [x] Validation prevents invalid submissions

---

## Ready for Use! ✅

The form now outputs data in **exactly the same format** as your existing CSV, making integration seamless.

**CSV File Reference:** `~/Downloads/DDS NEED ! - Sales.csv`

**Last Updated:** 2026-01-08
