#!/usr/bin/env python3
"""
Analyze call statistics for extensions 1001 and 1002
Provides detailed breakdowns by hour, day, and comparison with other agents
"""

import csv
import os
from collections import defaultdict
from datetime import datetime, timedelta

def parse_duration_seconds(duration_str):
    """Parse duration in seconds"""
    try:
        return int(duration_str)
    except:
        return 0

def extract_extension(from_field):
    """Extract extension number from 'From' field"""
    if not from_field:
        return None
    if 'Ext' in from_field:
        parts = from_field.split()
        for part in parts:
            if part.isdigit():
                return part
    return None

def parse_time(time_str):
    """Parse time string to hour"""
    try:
        # Format: "13:19:41"
        hour = int(time_str.split(':')[0])
        return hour
    except:
        return None

def main():
    downloads_dir = os.path.expanduser('~/Downloads')
    output_dir = os.path.dirname(os.path.abspath(__file__))
    
    input_file = os.path.join(downloads_dir, 'Untitled spreadsheet - call-data (1) (2).csv')
    
    print("📊 Analyzing Call Statistics for Ext 1001 and 1002\n")
    print("="*80)
    
    # Data structures
    ext_1001_calls = []
    ext_1002_calls = []
    all_extensions = defaultdict(list)
    
    # Read call data
    with open(input_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        
        for row in reader:
            from_field = row.get('From', '')
            ext = extract_extension(from_field)
            
            if ext:
                call_data = {
                    'extension': ext,
                    'call_type': row.get('Call Type', ''),
                    'to': row.get('To', ''),
                    'answered_by': row.get('Answered By', ''),
                    'date': row.get('Date', ''),
                    'time': row.get('Time', ''),
                    'day_of_week': row.get('Day Of Week', ''),
                    'duration': row.get('Duration', ''),
                    'duration_seconds': parse_duration_seconds(row.get('Duration (Seconds)', '0')),
                    'call_result': row.get('Call Result', ''),
                    'has_recording': row.get('Has Recording', ''),
                    'hour': parse_time(row.get('Time', ''))
                }
                
                all_extensions[ext].append(call_data)
                
                if ext == '1001':
                    ext_1001_calls.append(call_data)
                elif ext == '1002':
                    ext_1002_calls.append(call_data)
    
    print(f"\n✅ Loaded call data")
    print(f"   📞 Ext 1001: {len(ext_1001_calls)} calls")
    print(f"   📞 Ext 1002: {len(ext_1002_calls)} calls")
    print(f"   👥 Total extensions found: {len(all_extensions)}")
    print("="*80)
    
    # Analysis for each extension
    for ext_num, ext_name in [('1001', 'Extension 1001'), ('1002', 'Extension 1002')]:
        calls = ext_1001_calls if ext_num == '1001' else ext_1002_calls
        
        if not calls:
            print(f"\n⚠️  No calls found for {ext_name}")
            continue
        
        print(f"\n\n{'='*80}")
        print(f"📊 DETAILED ANALYSIS: {ext_name}")
        print(f"{'='*80}\n")
        
        # Overall Statistics
        total_calls = len(calls)
        total_duration_sec = sum(c['duration_seconds'] for c in calls)
        total_duration_min = total_duration_sec / 60
        avg_duration_sec = total_duration_sec / total_calls if total_calls > 0 else 0
        
        # Call results breakdown
        call_results = defaultdict(int)
        for call in calls:
            result = call['call_result'] or 'Unknown'
            call_results[result] += 1
        
        # Call types breakdown
        call_types = defaultdict(int)
        for call in calls:
            call_types[call['call_type']] += 1
        
        print("📈 OVERALL STATISTICS")
        print("-" * 80)
        print(f"   Total Calls:        {total_calls}")
        print(f"   Total Duration:     {total_duration_min:.2f} minutes ({total_duration_sec} seconds)")
        print(f"   Average Duration:   {avg_duration_sec:.1f} seconds ({avg_duration_sec/60:.2f} minutes)")
        print(f"   Answered Calls:     {call_results.get('Answered', 0)}")
        print(f"   Missed Calls:       {call_results.get('Missed', 0) + call_results.get('No Answer', 0)}")
        
        print(f"\n📊 CALL TYPES")
        print("-" * 80)
        for call_type, count in sorted(call_types.items(), key=lambda x: x[1], reverse=True):
            pct = (count / total_calls * 100) if total_calls > 0 else 0
            print(f"   {call_type:15s}: {count:4d} calls ({pct:5.1f}%)")
        
        print(f"\n📊 CALL RESULTS")
        print("-" * 80)
        for result, count in sorted(call_results.items(), key=lambda x: x[1], reverse=True):
            pct = (count / total_calls * 100) if total_calls > 0 else 0
            print(f"   {result:15s}: {count:4d} calls ({pct:5.1f}%)")
        
        # By Hour Analysis
        by_hour = defaultdict(lambda: {'count': 0, 'duration': 0})
        for call in calls:
            hour = call['hour']
            if hour is not None:
                by_hour[hour]['count'] += 1
                by_hour[hour]['duration'] += call['duration_seconds']
        
        print(f"\n📅 CALLS BY HOUR")
        print("-" * 80)
        print(f"   {'Hour':<6} {'Calls':<8} {'Duration (min)':<15} {'Avg (sec)':<12}")
        print("-" * 80)
        for hour in sorted(by_hour.keys()):
            count = by_hour[hour]['count']
            duration = by_hour[hour]['duration']
            avg = duration / count if count > 0 else 0
            print(f"   {hour:02d}:00  {count:<8d} {duration/60:<15.2f} {avg:<12.1f}")
        
        # By Day Analysis
        by_day = defaultdict(lambda: {'count': 0, 'duration': 0})
        for call in calls:
            day = call['day_of_week']
            if day:
                by_day[day]['count'] += 1
                by_day[day]['duration'] += call['duration_seconds']
        
        print(f"\n📅 CALLS BY DAY OF WEEK")
        print("-" * 80)
        print(f"   {'Day':<12} {'Calls':<8} {'Duration (min)':<15} {'Avg (sec)':<12}")
        print("-" * 80)
        day_order = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        for day in day_order:
            if day in by_day:
                count = by_day[day]['count']
                duration = by_day[day]['duration']
                avg = duration / count if count > 0 else 0
                print(f"   {day:<12} {count:<8d} {duration/60:<15.2f} {avg:<12.1f}")
        
        # By Date Analysis
        by_date = defaultdict(lambda: {'count': 0, 'duration': 0})
        for call in calls:
            date = call['date']
            if date:
                by_date[date]['count'] += 1
                by_date[date]['duration'] += call['duration_seconds']
        
        print(f"\n📅 CALLS BY DATE")
        print("-" * 80)
        print(f"   {'Date':<20} {'Calls':<8} {'Duration (min)':<15} {'Avg (sec)':<12}")
        print("-" * 80)
        for date in sorted(by_date.keys()):
            count = by_date[date]['count']
            duration = by_date[date]['duration']
            avg = duration / count if count > 0 else 0
            print(f"   {date:<20} {count:<8d} {duration/60:<15.2f} {avg:<12.1f}")
    
    # Comparison with other agents
    print(f"\n\n{'='*80}")
    print("📊 COMPARISON WITH ALL AGENTS")
    print(f"{'='*80}\n")
    
    agent_stats = {}
    for ext, calls in all_extensions.items():
        total_calls = len(calls)
        total_duration = sum(c['duration_seconds'] for c in calls)
        answered = sum(1 for c in calls if c['call_result'] == 'Answered')
        
        agent_stats[ext] = {
            'calls': total_calls,
            'duration_min': total_duration / 60,
            'avg_duration': total_duration / total_calls if total_calls > 0 else 0,
            'answered': answered,
            'answer_rate': (answered / total_calls * 100) if total_calls > 0 else 0
        }
    
    # Sort by total calls
    sorted_agents = sorted(agent_stats.items(), key=lambda x: x[1]['calls'], reverse=True)
    
    print(f"{'Ext':<8} {'Calls':<8} {'Duration (min)':<15} {'Avg (sec)':<12} {'Answered':<10} {'Answer %':<10}")
    print("-" * 80)
    
    for ext, stats in sorted_agents:
        highlight = " ⭐" if ext in ['1001', '1002'] else ""
        print(f"{ext:<8} {stats['calls']:<8d} {stats['duration_min']:<15.2f} {stats['avg_duration']:<12.1f} {stats['answered']:<10d} {stats['answer_rate']:<10.1f}{highlight}")
    
    # Rankings
    print(f"\n📊 RANKINGS")
    print("-" * 80)
    
    # Rank by calls
    ranked_by_calls = sorted(agent_stats.items(), key=lambda x: x[1]['calls'], reverse=True)
    for rank, (ext, stats) in enumerate(ranked_by_calls, 1):
        if ext in ['1001', '1002']:
            print(f"   Ext {ext} - Rank #{rank} by Total Calls ({stats['calls']} calls)")
    
    # Rank by duration
    ranked_by_duration = sorted(agent_stats.items(), key=lambda x: x[1]['duration_min'], reverse=True)
    for rank, (ext, stats) in enumerate(ranked_by_duration, 1):
        if ext in ['1001', '1002']:
            print(f"   Ext {ext} - Rank #{rank} by Total Duration ({stats['duration_min']:.2f} minutes)")
    
    # Rank by average duration
    ranked_by_avg = sorted(agent_stats.items(), key=lambda x: x[1]['avg_duration'], reverse=True)
    for rank, (ext, stats) in enumerate(ranked_by_avg, 1):
        if ext in ['1001', '1002']:
            print(f"   Ext {ext} - Rank #{rank} by Average Duration ({stats['avg_duration']:.1f} seconds)")
    
    # Rank by answer rate
    ranked_by_answer = sorted(agent_stats.items(), key=lambda x: x[1]['answer_rate'], reverse=True)
    for rank, (ext, stats) in enumerate(ranked_by_answer, 1):
        if ext in ['1001', '1002']:
            print(f"   Ext {ext} - Rank #{rank} by Answer Rate ({stats['answer_rate']:.1f}%)")
    
    print("\n" + "="*80)
    print("✅ Analysis Complete!")
    print("="*80)

if __name__ == '__main__':
    main()
