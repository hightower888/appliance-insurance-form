#!/usr/bin/env python3
"""
Match DDS customers with transactions using fuzzy name matching
"""

import csv
import os
from difflib import SequenceMatcher
from collections import defaultdict

def normalize_name(name):
    """Normalize name for matching: lowercase, remove extra spaces, punctuation"""
    if not name:
        return ""
    # Remove common titles
    titles = ['mr', 'mrs', 'ms', 'miss', 'dr', 'mr.', 'mrs.', 'ms.', 'miss.', 'dr.']
    name = name.lower().strip()
    
    # Remove punctuation
    name = name.replace('.', ' ').replace(',', ' ')
    
    # Remove titles
    words = name.split()
    words = [w for w in words if w not in titles]
    
    return ' '.join(words)

def extract_first_last(name):
    """Extract first and last name from full name"""
    name = normalize_name(name)
    if not name:
        return ('', '')
    
    parts = name.split()
    if len(parts) == 0:
        return ('', '')
    elif len(parts) == 1:
        return (parts[0], '')
    else:
        # First word is first name, last word is last name
        return (parts[0], parts[-1])

def fuzzy_match_score(name1, name2):
    """Calculate fuzzy match score between two names (0-1)"""
    first1, last1 = extract_first_last(name1)
    first2, last2 = extract_first_last(name2)
    
    # Match on first name and last name separately
    first_score = SequenceMatcher(None, first1, first2).ratio()
    last_score = SequenceMatcher(None, last1, last2).ratio()
    
    # Weight last name more heavily (60% last, 40% first)
    return (last_score * 0.6) + (first_score * 0.4)

def parse_amount(amount_str):
    """Parse amount string to float"""
    if not amount_str:
        return 0.0
    try:
        # Remove currency symbols and clean
        amount_str = str(amount_str).replace('£', '').replace(',', '').strip()
        return float(amount_str)
    except:
        return 0.0

def main():
    downloads_dir = os.path.expanduser('~/Downloads')
    output_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Input files
    customers_file = os.path.join(output_dir, 'DDS_COMBINED.csv')
    transactions_file = os.path.join(downloads_dir, 'DEBIT DIRECT TRANSACTIONS - Transactions (1) (1).csv')
    output_file = os.path.join(output_dir, 'DDS_MATCHED.csv')
    
    print("🔄 Matching customers with transactions...\n")
    
    # Load transactions
    print("📂 Loading transactions...")
    transactions = []
    excluded_count = 0
    with open(transactions_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            bacs_code = row.get('Bacs Code', '').strip().upper()
            amount = parse_amount(row.get('Amount', '0'))
            
            # Exclude "New Instruction" transactions (Bacs Code = "0N" and Amount = 0)
            if bacs_code == '0N' or (bacs_code == '0N' and amount == 0):
                excluded_count += 1
                continue
            
            transactions.append(row)
    
    print(f"   ✅ Loaded {len(transactions)} transactions")
    print(f"   ❌ Excluded {excluded_count} new instruction records (Bacs Code: 0N)\n")
    
    # Load customers
    print("📂 Loading customers...")
    customers = []
    with open(customers_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames
        for row in reader:
            customers.append(row)
    
    print(f"   ✅ Loaded {len(customers)} customers\n")
    
    # New fieldnames with transaction columns
    new_fieldnames = list(fieldnames) + [
        'Matched DD Reference',
        'Matched Collection Date',
        'Matched Amount',
        'Amount Difference',
        'Match Score'
    ]
    
    # Track which DD References have been used (not transaction index)
    used_dd_references = set()
    
    print("🔍 Matching customers to transactions...\n")
    print("⚠️  Each DD Reference will be matched to only ONE customer\n")
    matched_count = 0
    
    # Match each customer
    for customer in customers:
        customer_name = customer.get('Name', '')
        customer_amount = parse_amount(customer.get('Total Cost', '0'))
        
        if not customer_name.strip():
            # No name, can't match
            customer['Matched DD Reference'] = ''
            customer['Matched Collection Date'] = ''
            customer['Matched Amount'] = ''
            customer['Amount Difference'] = ''
            customer['Match Score'] = ''
            continue
        
        # Find all potential matches
        matches = []
        for idx, transaction in enumerate(transactions):
            dd_ref = transaction.get('DD Reference', '').strip()
            
            # Skip if this DD Reference has already been matched
            if dd_ref and dd_ref in used_dd_references:
                continue
            
            transaction_name = transaction.get('Account Name', '')
            transaction_amount = parse_amount(transaction.get('Amount', '0'))
            
            # Calculate name match score
            name_score = fuzzy_match_score(customer_name, transaction_name)
            
            # Only consider if name similarity is reasonable (>0.6)
            if name_score >= 0.6:
                # Calculate amount difference
                amount_diff = abs(customer_amount - transaction_amount)
                
                matches.append({
                    'index': idx,
                    'dd_ref': dd_ref,
                    'name_score': name_score,
                    'amount_diff': amount_diff,
                    'transaction': transaction
                })
        
        # Find best match (highest name score, then closest amount)
        if matches:
            # Sort by name score (desc), then amount difference (asc)
            matches.sort(key=lambda x: (-x['name_score'], x['amount_diff']))
            best_match = matches[0]
            
            # Mark DD Reference as used (if it exists)
            if best_match['dd_ref']:
                used_dd_references.add(best_match['dd_ref'])
            
            # Add matched transaction data
            trans = best_match['transaction']
            customer['Matched DD Reference'] = trans.get('DD Reference', '')
            customer['Matched Collection Date'] = trans.get('Collection Date', '')
            customer['Matched Amount'] = trans.get('Amount', '')
            
            # Calculate difference
            matched_amount = parse_amount(trans.get('Amount', '0'))
            diff = customer_amount - matched_amount
            customer['Amount Difference'] = f"{diff:.2f}"
            customer['Match Score'] = f"{best_match['name_score']:.2f}"
            
            matched_count += 1
        else:
            # No match found
            customer['Matched DD Reference'] = ''
            customer['Matched Collection Date'] = ''
            customer['Matched Amount'] = ''
            customer['Amount Difference'] = ''
            customer['Match Score'] = ''
    
    # Write output
    print(f"💾 Writing matched data...\n")
    with open(output_file, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=new_fieldnames)
        writer.writeheader()
        writer.writerows(customers)
    
    print(f"✅ Matching complete!")
    print(f"   📊 Customers: {len(customers)}")
    print(f"   💳 Transactions: {len(transactions)}")
    print(f"   ✓ Matched: {matched_count}")
    print(f"   ✗ Unmatched: {len(customers) - matched_count}")
    print(f"\n📄 Output: {output_file}")
    
    # Copy to Downloads
    import shutil
    downloads_output = os.path.join(downloads_dir, 'DDS_MATCHED.csv')
    shutil.copy(output_file, downloads_output)
    print(f"📄 Also saved to: {downloads_output}")

if __name__ == '__main__':
    main()
