#!/usr/bin/env python3
"""
Merge DDS NEED CSV files into one unified spreadsheet
Maps similar columns together and preserves unique columns
"""

import csv
import os
from collections import OrderedDict
from datetime import datetime

# Define the unified column structure (in order)
UNIFIED_COLUMNS = [
    'Plan number',
    'Phone Numbers',
    'Name',
    'Address',  # Standardized spelling
    'Area',
    'Postcode',
    'Email',
    'Plan',
    'Total Cost',
    'Sort Code',
    'Account number',
    'DD Date',
    'Notes',
    'Agents',
    'Source File'  # Track which file the data came from
]

# Column mapping for each file
FILE_MAPPINGS = {
    'Active Swap': {
        0: 'Phone Numbers',  # First column is phone data
        'Name': 'Name',
        'Address': 'Address',
        'Area': 'Area',
        'Postcode': 'Postcode',
        'Email': 'Email',
        'Plan': 'Plan',
        'TMP': 'Total Cost',
        'Sort Code': 'Sort Code',
        'Account number': 'Account number',
        'First DD Date': 'DD Date',
        'Notes': 'Notes'
    },
    'Tuesday 11th': {
        # No headers, so map by position
        0: 'Plan number',
        1: 'Name',
        2: 'Address',
        3: 'Postcode',
        4: 'Email',
        5: 'Plan',
        6: 'Total Cost',
        7: 'Sort Code',
        8: 'Account number',
        9: 'DD Date',
        10: 'Notes',
        11: 'Agents'
    },
    'Sales': {
        'Plan number': 'Plan number',
        'Phone Numbers': 'Phone Numbers',
        'Name': 'Name',
        'Adress': 'Address',  # Fix spelling
        'Postcode': 'Postcode',
        'Email': 'Email',
        'Plan': 'Plan',
        'Total Cost': 'Total Cost',
        'Sort Code': 'Sort Code',
        'Account number': 'Account number',
        'DD Date': 'DD Date',
        'Notes - e.g. whats covered': 'Notes',
        'Agents': 'Agents'
    }
}

def read_csv_with_mapping(filepath, file_type, mapping):
    """Read CSV and map columns to unified structure"""
    rows = []
    
    with open(filepath, 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        
        if file_type == 'Tuesday 11th':
            # No headers, skip first empty row if exists
            first_row = next(reader, None)
            if first_row and all(cell.strip() == '' for cell in first_row):
                # Skip empty header row
                pass
            else:
                # Process first row as data
                if first_row:
                    row_data = OrderedDict.fromkeys(UNIFIED_COLUMNS, '')
                    for col_idx, value in enumerate(first_row):
                        if col_idx in mapping:
                            unified_col = mapping[col_idx]
                            row_data[unified_col] = value.strip()
                    row_data['Source File'] = file_type
                    rows.append(row_data)
            
            # Process remaining rows
            for row in reader:
                if not any(row):  # Skip empty rows
                    continue
                row_data = OrderedDict.fromkeys(UNIFIED_COLUMNS, '')
                for col_idx, value in enumerate(row):
                    if col_idx in mapping:
                        unified_col = mapping[col_idx]
                        row_data[unified_col] = value.strip()
                row_data['Source File'] = file_type
                rows.append(row_data)
                
        else:
            # Has headers
            headers = next(reader)
            
            for row in reader:
                if not any(row):  # Skip empty rows
                    continue
                    
                row_data = OrderedDict.fromkeys(UNIFIED_COLUMNS, '')
                
                for col_idx, value in enumerate(row):
                    # Try to map by header name first
                    if col_idx < len(headers):
                        header = headers[col_idx].strip()
                        if header in mapping:
                            unified_col = mapping[header]
                            row_data[unified_col] = value.strip()
                    
                    # Also check positional mapping (for first column in Active Swap)
                    if col_idx in mapping:
                        unified_col = mapping[col_idx]
                        if not row_data[unified_col]:  # Don't overwrite if already set
                            row_data[unified_col] = value.strip()
                
                row_data['Source File'] = file_type
                rows.append(row_data)
    
    return rows

def main():
    downloads_dir = os.path.expanduser('~/Downloads')
    output_dir = os.path.dirname(os.path.abspath(__file__))
    
    files = [
        (os.path.join(downloads_dir, 'DDS NEED ! - Active Swap.csv'), 'Active Swap'),
        (os.path.join(downloads_dir, 'DDS NEED ! - Tuesday 11th.csv'), 'Tuesday 11th'),
        (os.path.join(downloads_dir, 'DDS NEED ! - Sales (1).csv'), 'Sales')
    ]
    
    all_rows = []
    
    print("🔄 Merging DDS NEED files...\n")
    
    for filepath, file_type in files:
        if os.path.exists(filepath):
            print(f"📂 Processing: {file_type}")
            mapping = FILE_MAPPINGS[file_type]
            rows = read_csv_with_mapping(filepath, file_type, mapping)
            all_rows.extend(rows)
            print(f"   ✅ Added {len(rows)} rows\n")
        else:
            print(f"   ⚠️  File not found: {filepath}\n")
    
    # Write combined CSV
    output_file = os.path.join(output_dir, 'DDS_COMBINED.csv')
    
    with open(output_file, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=UNIFIED_COLUMNS)
        writer.writeheader()
        writer.writerows(all_rows)
    
    print(f"\n✅ Combined {len(all_rows)} total rows")
    print(f"📄 Output file: {output_file}")
    print(f"\n📊 Unified columns ({len(UNIFIED_COLUMNS)}):")
    for i, col in enumerate(UNIFIED_COLUMNS, 1):
        print(f"   {i:2d}. {col}")

if __name__ == '__main__':
    main()
