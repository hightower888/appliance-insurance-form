# DDS NEED Files - Merge Summary

## ✅ Merge Complete!

Successfully combined **3 DDS NEED CSV files** into one unified spreadsheet.

**Output File:** `DDS_COMBINED.csv`  
**Location:** 
- `_DEV/STREAMS/appliance_insurance_form/OUTPUTS/DDS_COMBINED.csv`
- `~/Downloads/DDS_COMBINED.csv` (copy for easy access)

---

## 📊 Merge Statistics

| Source File | Rows Added | Notes |
|-------------|------------|-------|
| **DDS NEED ! - Active Swap.csv** | 1,599 | Most recent, largest dataset |
| **DDS NEED ! - Tuesday 11th.csv** | 53 | No headers, positional mapping used |
| **DDS NEED ! - Sales (1).csv** | 1,019 | Standard format with headers |
| **TOTAL** | **2,671** | All unique records preserved |

---

## 🗂️ Unified Column Structure

The combined spreadsheet has **15 columns** in this order:

1. **Plan number** - Customer plan identifier (e.g., NDAC7423APP)
2. **Phone Numbers** - Contact phone number
3. **Name** - Customer full name
4. **Address** - Street address (unified from "Address" and "Adress")
5. **Area** - Geographic area/region (from Active Swap file)
6. **Postcode** - UK postcode
7. **Email** - Customer email address
8. **Plan** - Plan type (Apps, Boiler, Apps + WG, etc.)
9. **Total Cost** - Monthly cost (from "TMP" in Active Swap, "Total Cost" elsewhere)
10. **Sort Code** - Bank sort code (6 digits)
11. **Account number** - Bank account number (8 digits)
12. **DD Date** - Direct debit collection date
13. **Notes** - Additional information, appliances covered
14. **Agents** - Sales agent name
15. **Source File** - Which CSV the row came from (for tracking)

---

## 🔄 Column Mappings Applied

### File 1: Active Swap
| Original Column | Mapped To | Notes |
|-----------------|-----------|-------|
| (First column data) | Phone Numbers | No header, contained phone data |
| Name | Name | ✅ |
| Address | Address | ✅ |
| Area | Area | ✅ Unique to this file |
| Postcode | Postcode | ✅ |
| Email | Email | ✅ |
| Plan | Plan | ✅ |
| TMP | Total Cost | 🔄 Renamed |
| Sort Code | Sort Code | ✅ |
| Account number | Account number | ✅ |
| First DD Date | DD Date | 🔄 Renamed |
| Notes | Notes | ✅ |

**Missing in Active Swap:** Plan number, Agents

### File 2: Tuesday 11th
| Position | Mapped To | Notes |
|----------|-----------|-------|
| Column 0 | Plan number | No headers - positional mapping |
| Column 1 | Name | |
| Column 2 | Address | |
| Column 3 | Postcode | |
| Column 4 | Email | |
| Column 5 | Plan | |
| Column 6 | Total Cost | |
| Column 7 | Sort Code | |
| Column 8 | Account number | |
| Column 9 | DD Date | |
| Column 10 | Notes | |
| Column 11 | Agents | |

**Missing in Tuesday 11th:** Phone Numbers, Area

### File 3: Sales (1)
| Original Column | Mapped To | Notes |
|-----------------|-----------|-------|
| Plan number | Plan number | ✅ |
| Phone Numbers | Phone Numbers | ✅ |
| Name | Name | ✅ |
| Adress | Address | 🔄 Fixed spelling |
| Postcode | Postcode | ✅ |
| Email | Email | ✅ |
| Plan | Plan | ✅ |
| Total Cost | Total Cost | ✅ |
| Sort Code | Sort Code | ✅ |
| Account number | Account number | ✅ |
| DD Date | DD Date | ✅ |
| Notes - e.g. whats covered | Notes | 🔄 Simplified name |
| Agents | Agents | ✅ |

**Missing in Sales:** Area

---

## 🎯 Key Features

### ✅ Standardization
- **Address spelling** - Unified "Adress" → "Address"
- **Date columns** - "First DD Date" → "DD Date"
- **Cost columns** - "TMP" → "Total Cost"
- **Notes columns** - "Notes - e.g. whats covered" → "Notes"

### ✅ Data Preservation
- All unique columns preserved
- Empty cells where data not available in source
- No data loss during merge

### ✅ Traceability
- **Source File** column added
- Tracks which CSV each row came from
- Easy to audit or split back if needed

---

## 📝 Sample Data

### Active Swap Example
```csv
,447936220890,Avril Barraclough,61 Quarry Street,West Yorkshire,BD9 4BS,,Apps,20,777113,51498868,01/01/2026,Aaron,,Active Swap
```

### Tuesday 11th Example
```csv
NDAC21790APP,,Ann Mitchell,34 Templeton Road,,B44 9BT,annmitchll2014@gmail.com,Apps + WG,15.99,778516,29336760,08/12/2025,WM (£5) + WG (10.99),Aaron,Tuesday 11th
```

### Sales Example
```csv
NDAC9333APP,7951182224,Helen Carr,9 Maiden View Lanchester,,DH7 0BF,helencarr69@btinternet.com,apps,boiler,772014,2026656,15/12/2025,,finlay,Sales
```

---

## 🔍 Data Quality Notes

### Observations:
1. **Active Swap** has the most complete data (1,599 rows) but missing Plan numbers and Agents
2. **Tuesday 11th** has all fields but missing Phone Numbers column
3. **Sales** has the most consistent structure with all standard fields
4. **Area** column only exists in Active Swap data
5. Some phone numbers are formatted differently (with/without country code)
6. Some rows have missing email addresses (empty cells)

### Recommendations:
- Consider generating Plan numbers for Active Swap rows if needed
- Phone number standardization may be needed (country code handling)
- Email addresses are optional but present in most records
- DD Date formats vary (01/01/2026 vs 08/12/2025 vs 8/12/25) - may need standardization

---

## 🛠️ Script Details

**Script:** `merge_dds_files.py`  
**Language:** Python 3  
**Dependencies:** Standard library only (csv, os, collections, datetime)

**Key Functions:**
- Intelligent column mapping by header name and position
- Handles files with and without headers
- Preserves all unique columns
- Adds source tracking
- Error handling for missing files

---

## 📂 File Locations

### Input Files:
- `~/Downloads/DDS NEED ! - Active Swap.csv` (204 KB)
- `~/Downloads/DDS NEED ! - Tuesday 11th.csv` (6 KB)
- `~/Downloads/DDS NEED ! - Sales (1).csv` (129 KB)

### Output Files:
- `~/Downloads/DDS_COMBINED.csv` ✅
- `_DEV/STREAMS/appliance_insurance_form/OUTPUTS/DDS_COMBINED.csv` ✅

---

## ✅ Next Steps

Now that you have a unified spreadsheet:

1. **Review the data** - Check for any duplicates or data quality issues
2. **Standardize formats** - Phone numbers, dates, postcodes if needed
3. **Fill missing data** - Generate Plan numbers for Active Swap rows
4. **Update the form** - Ensure form matches the unified structure
5. **Import to system** - Use this as master data source

---

**Merge Date:** January 8, 2026  
**Status:** ✅ Complete  
**Total Records:** 2,671
