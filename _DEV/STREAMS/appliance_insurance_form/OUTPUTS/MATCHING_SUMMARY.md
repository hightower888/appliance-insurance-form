# Transaction Matching Summary

## ✅ Matching Complete!

Successfully matched **DDS customer records** with **transaction data** using intelligent fuzzy name matching.

**Output File:** `DDS_MATCHED.csv`  
**Locations:**
- `~/Downloads/DDS_MATCHED.csv` ✅ (opened)
- `_DEV/STREAMS/appliance_insurance_form/OUTPUTS/DDS_MATCHED.csv` ✅

---

## 📊 Matching Statistics

| Metric | Count | Percentage |
|--------|-------|------------|
| **Total Customers** | 2,671 | 100% |
| **Total Transactions** | 2,392 | - |
| **✅ Successfully Matched** | 1,961 | 73.4% |
| **❌ Unmatched** | 710 | 26.6% |

---

## 🎯 Matching Algorithm

### Name Matching Strategy

1. **Normalization**
   - Removed titles (Mr, Mrs, Ms, Miss, Dr)
   - Converted to lowercase
   - Removed punctuation (., ,)
   - Standardized spacing

2. **Name Extraction**
   - First name: First word
   - Last name: Last word
   - Handles middle names/initials

3. **Fuzzy Matching**
   - Uses `SequenceMatcher` algorithm
   - Weighted scoring:
     - **60%** Last name match
     - **40%** First name match
   - Minimum threshold: **0.6** (60% similarity)

4. **Match Selection**
   - Sort by: Name score (descending), then Amount difference (ascending)
   - **One transaction per customer** (no duplicates)
   - **Closest amount** when multiple name matches exist

### Exclusions Applied

✅ **"New Instruction" transactions excluded** (none found in current data)  
✅ **Status filtering**: All statuses included (Paid, Uncleared, Failed, Submitted, Pending)

---

## 📋 New Columns Added

The matched file includes **5 new columns** at the end:

| Column | Description | Example |
|--------|-------------|---------|
| **Matched DD Reference** | Direct Debit reference from transaction | `WRMBX785824` |
| **Matched Collection Date** | Date of collection | `02/01/2026` |
| **Matched Amount** | Transaction amount | `20` |
| **Amount Difference** | Customer Total - Transaction Amount | `0.00` (exact match) |
| **Match Score** | Name similarity score (0-1) | `1.00` (perfect match) |

---

## 🔍 Match Quality Analysis

### Perfect Matches (Score = 1.00)
```
Name: Avril Barraclough
Total Cost: £20 → Matched Amount: £20 → Difference: £0.00
DD Reference: WRMBX785824
Match Score: 1.00 ✅
```

```
Name: Ms. Diane Mitchell  
Total Cost: £20 → Matched Amount: £20 → Difference: £0.00
DD Reference: WRMBX785846
Match Score: 1.00 ✅
```

### Good Matches with Amount Differences
```
Name: Mrs. Tracey Mackey
Total Cost: £80 → Matched Amount: £0 → Difference: £80.00
DD Reference: WRMBX786287
Match Score: 1.00 ⚠️
```
*(Perfect name match but transaction shows £0 - possible data issue)*

### Unmatched Records
**710 customers** could not be matched because:
- No transaction with similar name found (< 60% similarity)
- All matching transactions already assigned to other customers
- Name formatting issues (initials only, incomplete names)

**Examples of unmatched:**
- Zabina Begum (£24.99) - No matching transaction
- Kathryn Brangan (2 records: £28, £16.99) - No matches found
- Pamela Wyeth (2 records: £20, £29.99) - No matches found

---

## 🗂️ File Structure

### Input Files
1. **DDS_COMBINED.csv** (2,671 rows)
   - Combined customer data from 3 DDS files
   - 15 columns including Name, Total Cost, etc.

2. **DEBIT DIRECT TRANSACTIONS - Transactions (1) (1).csv** (2,392 rows)
   - Transaction data with DD Reference, Account Name, Amount, Collection Date
   - Statuses: Paid (1,682), Uncleared (417), Failed (266), Submitted (24), Pending (3)

### Output File
**DDS_MATCHED.csv** (2,671 rows)
- All original 15 columns from DDS_COMBINED
- Plus 5 new matching columns
- **Total: 20 columns**

---

## 📊 Column Order in DDS_MATCHED.csv

| # | Column | Source |
|---|--------|--------|
| 1 | Plan number | Customer |
| 2 | Phone Numbers | Customer |
| 3 | Name | Customer |
| 4 | Address | Customer |
| 5 | Area | Customer |
| 6 | Postcode | Customer |
| 7 | Email | Customer |
| 8 | Plan | Customer |
| 9 | Total Cost | Customer |
| 10 | Sort Code | Customer |
| 11 | Account number | Customer |
| 12 | DD Date | Customer |
| 13 | Notes | Customer |
| 14 | Agents | Customer |
| 15 | Source File | Customer |
| 16 | **Matched DD Reference** | ✨ NEW |
| 17 | **Matched Collection Date** | ✨ NEW |
| 18 | **Matched Amount** | ✨ NEW |
| 19 | **Amount Difference** | ✨ NEW |
| 20 | **Match Score** | ✨ NEW |

---

## 💡 Use Cases

### 1. Reconciliation
- Compare `Total Cost` vs `Matched Amount`
- Identify discrepancies via `Amount Difference`
- Filter by `Amount Difference != 0.00`

### 2. Audit Trail
- `Matched DD Reference` links customer to actual transaction
- `Matched Collection Date` shows when payment was collected
- `Match Score` indicates confidence level

### 3. Missing Transactions
- 710 unmatched customers need investigation
- Filter where `Matched DD Reference` is empty
- May need manual matching or data correction

### 4. Duplicate Customers
- Same customer multiple times? Each gets matched to a transaction
- Multiple records for same person will match to closest amounts first

---

## 🔧 Technical Details

### Matching Logic Flow

```
FOR EACH Customer:
  1. Extract first name & last name
  2. Find all transactions with name similarity >= 0.6
  3. IF multiple matches:
     - Sort by name score (highest first)
     - Then by amount difference (smallest first)
     - Select top match
  4. IF match found:
     - Mark transaction as "used"
     - Add transaction details to customer record
     - Calculate amount difference
  5. IF no match:
     - Leave matching columns empty
```

### Name Normalization Examples

| Original | Normalized | First | Last |
|----------|------------|-------|------|
| Mr. John Smith | john smith | john | smith |
| Mrs. Sarah-Jane Williams | sarah jane williams | sarah | williams |
| Dr William Powell | william powell | william | powell |
| Ms. Diane Mitchell | diane mitchell | diane | mitchell |

### Fuzzy Matching Example

```
Customer: "Avril Barraclough"
Transaction: "Avril Barraclough"

First name: "avril" vs "avril" → 1.00
Last name: "barraclough" vs "barraclough" → 1.00
Final score: (1.00 * 0.6) + (1.00 * 0.4) = 1.00 ✅
```

---

## ⚠️ Known Limitations

1. **One-to-One Matching Only**
   - Each transaction matched to only ONE customer
   - If customer has multiple records, each tries to match separately
   - Best match selected based on name similarity + amount closeness

2. **Name Similarity Threshold**
   - Requires 60%+ name match
   - May miss matches with very different spellings or nicknames
   - Middle names/initials can affect matching

3. **Amount Differences**
   - No automatic amount validation
   - Large differences may indicate:
     - Plan changes
     - Data entry errors
     - Transactions with £0 (possible data issues)

4. **Transaction Statuses**
   - All statuses included (Paid, Failed, Uncleared, etc.)
   - May want to filter by status in analysis

---

## 📈 Next Steps

### For Matched Records (1,961)
1. ✅ Review `Amount Difference` column
2. ✅ Investigate large discrepancies (e.g., Tracey Mackey: £80 diff)
3. ✅ Filter by `Match Score < 0.8` for manual review
4. ✅ Use `Matched DD Reference` for reconciliation

### For Unmatched Records (710)
1. ❓ Manual name matching needed
2. ❓ Check for typos in customer names
3. ❓ Verify these customers have active transactions
4. ❓ Consider alternative matching criteria (phone, account number)

### Data Quality Improvements
- Standardize name entry formats
- Add unique customer IDs
- Validate amounts at entry
- Cross-reference with other data sources

---

## 🎯 Key Insights

### ✅ Strengths
- **73.4% match rate** is solid for fuzzy name matching
- **Perfect name matches** (score 1.00) often have exact amounts too
- Algorithm handles titles, punctuation, and spacing variations
- One-to-one constraint prevents duplicate transaction matching

### ⚠️ Areas for Improvement
- **710 unmatched** customers need investigation
- Some perfect name matches have large amount differences
- Consider adding phone number or account number matching as fallback
- May need manual review of borderline matches (0.6-0.7 score range)

---

**Matching Date:** January 8, 2026  
**Status:** ✅ Complete  
**Total Records:** 2,671  
**Matched:** 1,961 (73.4%)  
**Script:** `match_transactions.py`
