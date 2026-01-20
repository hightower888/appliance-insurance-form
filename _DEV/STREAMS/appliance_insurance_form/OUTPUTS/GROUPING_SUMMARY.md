# Customer Grouping Summary

## ✅ Grouping Complete!

Successfully grouped all customer records by customer name with totals for payment amounts and differences.

**Output File:** `DDS_GROUPED_BY_CUSTOMER.csv`  
**Locations:**
- `~/Downloads/DDS_GROUPED_BY_CUSTOMER.csv` ✅ (opened)
- `_DEV/STREAMS/appliance_insurance_form/OUTPUTS/DDS_GROUPED_BY_CUSTOMER.csv` ✅

---

## 📊 Grouping Statistics

| Metric | Count | Notes |
|--------|-------|-------|
| **Total Records** | 2,648 | Original data rows (23 had blank names) |
| **Unique Customers** | 1,503 | Distinct customer names |
| **Customers with Multiple Records** | 754 | 50.2% of customers |
| **Total Output Rows** | 5,654 | Records + Totals + Blank separators |

---

## 🗂️ File Structure

The grouped file organizes data as follows:

### For Each Customer:
1. **All customer records** (if multiple records exist)
2. **TOTAL row** showing:
   - `>>> TOTAL FOR [Customer Name] (X records)`
   - Total Cost (sum of all customer records)
   - Matched Amount (sum of all matched transactions)
   - Amount Difference (sum of all differences)
3. **Blank separator row**

### Example Structure:
```
. J A Farley, £40, DD Ref: WRMBX123, Amount: £73.92, Diff: -£33.92
. J A Farley, £10.99, (no match), Diff: £0
>>> TOTAL FOR . J A Farley (2 records), £50.99, £73.92, -£33.92
[BLANK ROW]

. Janice Black, £32.12, DD Ref: WRMBX456, Amount: £0, Diff: £32.12
>>> TOTAL FOR . Janice Black (1 record), £32.12, £0.00, £32.12
[BLANK ROW]
```

---

## 🏆 Top Customers by Record Count

| Rank | Customer Name | Records | Total Cost |
|------|--------------|---------|------------|
| 1 | Lawrence C Mclean | 9 | £212.94 |
| 2 | Mrs. Susan Igbinedion-Obadjere | 8 | £163.48 |
| 3 | Margaret Macleod | 8 | £242.96 |
| 4 | anthony Brian Clarke | 8 | £157.95 |
| 5 | Mr. Christopher Mccartney | 7 | £209.85 |
| 6 | Albert G Kear | 6 | £299.97 |
| 7 | Brian Wallace | 6 | £314.97 |
| 8 | Donald MacPherson | 6 | £290.97 |
| 9 | Anne Stevenson | 6 | £131.96 |
| 10 | Gillian Buchanan | 6 | £149.97 |

---

## 💡 Use Cases

### 1. Customer Portfolio View
- See all plans/transactions for each customer at a glance
- Understand customer value (total across all plans)
- Identify high-value customers

### 2. Reconciliation by Customer
- Compare customer's total expected cost vs total matched amounts
- Identify discrepancies for specific customers
- Review customers with multiple active plans

### 3. Duplicate Investigation
- 754 customers have multiple records
- May indicate:
  - Multiple active plans (appliances + boiler)
  - Plan changes/upgrades
  - Data duplication issues
  - Family members with same name

### 4. Easy Sorting & Filtering
- Customers are alphabetically sorted
- Total rows clearly marked with `>>>`
- Blank rows make visual scanning easier
- Can filter for "TOTAL" rows to see customer summaries only

---

## 📋 Column Details

All original 20 columns are preserved:

**Customer Info:**
1. Plan number
2. Phone Numbers
3. Name
4. Address
5. Area
6. Postcode
7. Email
8. Plan
9. **Total Cost** ← Summed in TOTAL row
10. Sort Code
11. Account number
12. DD Date
13. Notes
14. Agents
15. Source File

**Transaction Matching:**
16. Matched DD Reference
17. Matched Collection Date
18. **Matched Amount** ← Summed in TOTAL row
19. **Amount Difference** ← Summed in TOTAL row
20. Match Score

---

## 🔍 Analysis Examples

### Customer with Single Record
```
Customer: . Janice Black
- 1 record
- Total Cost: £32.12
- Matched Amount: £0.00
- Difference: £32.12
→ May have payment issue (no matching transaction found with amount)
```

### Customer with Multiple Records
```
Customer: . J A Farley
- 2 records
  - Record 1: £40 → Matched to £73.92 (Diff: -£33.92)
  - Record 2: £10.99 → Not matched
- Total Cost: £50.99
- Total Matched: £73.92
- Total Difference: -£33.92
→ Overpaid by £33.92 across all plans
```

### High-Value Customer
```
Customer: Lawrence C Mclean
- 9 records (most in database!)
- Total Cost: £212.94
- Likely has multiple appliances + boiler coverage
- High-value customer for retention focus
```

---

## 📊 Key Insights

### Distribution
- **749 customers** have only 1 record (49.8%)
- **754 customers** have 2+ records (50.2%)
- Average records per customer: **1.76**

### Multiple Records Analysis
Customers with multiple records could indicate:
- ✅ **Legitimate:** Multiple plans (e.g., Appliances + Boiler)
- ✅ **Legitimate:** Plan upgrades/changes over time
- ⚠️ **Review:** Possible data duplication
- ⚠️ **Review:** Multiple family members with same name

### Totals Benefits
- **Quick reconciliation:** See customer's full financial picture
- **Portfolio value:** Total monthly revenue per customer
- **Discrepancy detection:** Total difference shows net over/underpayment
- **Customer service:** Complete history in one place

---

## 🎯 Recommended Actions

### Immediate
1. ✅ Review customers with 5+ records (top 50)
2. ✅ Investigate negative total differences (overpayments)
3. ✅ Check customers with large positive differences (underpayments)
4. ✅ Validate high-value customers (£200+ total)

### Analysis
- Filter for `>>> TOTAL` rows to get customer summary view
- Sort by Total Cost to find highest-value customers
- Sort by Amount Difference to find largest discrepancies
- Group by Source File to see which data source has most duplicates

### Data Quality
- Consider adding unique customer ID
- Standardize name formats to reduce false grouping
- Review customers with 3+ records for possible duplicates
- Cross-check with original transaction system

---

## 🛠️ Technical Details

### Grouping Logic
```
1. Read all matched records
2. Group by exact customer name match
3. Sort customer names alphabetically
4. For each customer:
   - Output all their records
   - Calculate totals (Cost, Matched Amount, Difference)
   - Add TOTAL row
   - Add blank separator row
5. Write to new CSV file
```

### Totals Calculation
- **Total Cost:** Sum of all `Total Cost` values for customer
- **Matched Amount:** Sum of all `Matched Amount` values
- **Amount Difference:** Sum of all `Amount Difference` values
  - Negative = Customer overpaid
  - Positive = Customer underpaid
  - Zero = Perfect match

### Name Grouping
- Case-sensitive exact match
- `"Mr. John Smith"` ≠ `"John Smith"` (treated as different customers)
- Titles and formatting are preserved as-is
- Future improvement: Normalize names before grouping

---

## 📁 Files

### Input
**DDS_MATCHED.csv** (2,671 rows)
- Customer records with transaction matching
- 20 columns including matched transaction data

### Output
**DDS_GROUPED_BY_CUSTOMER.csv** (5,654 rows)
- Same 20 columns
- Records grouped by customer
- Total rows added for each customer
- Blank rows separate customer groups

### Scripts
- `match_transactions.py` - Initial matching
- `group_by_customer.py` - Grouping and totals ✅

---

## ✅ Benefits of Grouped View

### For Finance Team
- Quick reconciliation by customer
- Easy identification of over/underpayments
- Portfolio value calculation
- Audit trail by customer

### For Customer Service
- Complete customer history in one view
- All active plans visible together
- Easy to explain charges and payments
- Quick reference for customer inquiries

### For Management
- Identify high-value customers
- Understand customer engagement (multi-plan customers)
- Revenue analysis by customer
- Retention strategy targeting

---

**Grouping Date:** January 8, 2026  
**Status:** ✅ Complete  
**Unique Customers:** 1,503  
**Total Records:** 2,648  
**Output Rows:** 5,654 (including totals and separators)
