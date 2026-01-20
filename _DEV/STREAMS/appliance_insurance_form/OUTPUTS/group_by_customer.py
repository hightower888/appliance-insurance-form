#!/usr/bin/env python3
"""
Group matched records by customer with totals
"""

import csv
import os
from collections import defaultdict

def parse_amount(amount_str):
    """Parse amount string to float"""
    if not amount_str:
        return 0.0
    try:
        amount_str = str(amount_str).replace('£', '').replace(',', '').strip()
        return float(amount_str)
    except:
        return 0.0

def main():
    output_dir = os.path.dirname(os.path.abspath(__file__))
    downloads_dir = os.path.expanduser('~/Downloads')
    
    input_file = os.path.join(output_dir, 'DDS_MATCHED.csv')
    output_file = os.path.join(output_dir, 'DDS_GROUPED_BY_CUSTOMER.csv')
    
    print("🔄 Grouping customers and calculating totals...\n")
    
    # Read all records
    with open(input_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames
        
        # Group by customer name
        customers = defaultdict(list)
        for row in reader:
            customer_name = row.get('Name', '').strip()
            if customer_name:
                customers[customer_name].append(row)
    
    print(f"📊 Found {len(customers)} unique customers")
    print(f"📝 Total records: {sum(len(records) for records in customers.values())}\n")
    
    # Sort customers by name
    sorted_customers = sorted(customers.keys())
    
    # Prepare output
    output_rows = []
    customers_with_multiple = 0
    
    for customer_name in sorted_customers:
        records = customers[customer_name]
        
        if len(records) > 1:
            customers_with_multiple += 1
        
        # Add all records for this customer
        for record in records:
            output_rows.append(record)
        
        # Calculate totals
        total_cost = sum(parse_amount(r.get('Total Cost', '0')) for r in records)
        total_matched_amount = sum(parse_amount(r.get('Matched Amount', '0')) for r in records)
        total_difference = sum(parse_amount(r.get('Amount Difference', '0')) for r in records)
        
        # Create totals row
        totals_row = {field: '' for field in fieldnames}
        totals_row['Name'] = f">>> TOTAL FOR {customer_name} ({len(records)} record{'s' if len(records) > 1 else ''})"
        totals_row['Total Cost'] = f"{total_cost:.2f}"
        totals_row['Matched Amount'] = f"{total_matched_amount:.2f}"
        totals_row['Amount Difference'] = f"{total_difference:.2f}"
        
        output_rows.append(totals_row)
        
        # Add blank row separator
        blank_row = {field: '' for field in fieldnames}
        output_rows.append(blank_row)
    
    # Write output
    print(f"💾 Writing grouped data...\n")
    with open(output_file, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(output_rows)
    
    print(f"✅ Grouping complete!")
    print(f"   👥 Unique customers: {len(customers)}")
    print(f"   📋 Customers with multiple records: {customers_with_multiple}")
    print(f"   📊 Total rows (including totals & blanks): {len(output_rows)}")
    print(f"\n📄 Output: {output_file}")
    
    # Copy to Downloads
    import shutil
    downloads_output = os.path.join(downloads_dir, 'DDS_GROUPED_BY_CUSTOMER.csv')
    shutil.copy(output_file, downloads_output)
    print(f"📄 Also saved to: {downloads_output}")
    
    # Show some examples of customers with multiple records
    print(f"\n📝 Sample customers with multiple records:")
    multi_customers = [(name, len(records)) for name, records in customers.items() if len(records) > 1]
    multi_customers.sort(key=lambda x: x[1], reverse=True)
    
    for i, (name, count) in enumerate(multi_customers[:10], 1):
        total = sum(parse_amount(r.get('Total Cost', '0')) for r in customers[name])
        print(f"   {i:2d}. {name}: {count} records, Total: £{total:.2f}")

if __name__ == '__main__':
    main()
