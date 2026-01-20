#!/usr/bin/env python3
"""
Generate detailed HTML call statistics report with idle time analysis
"""

import csv
import os
from datetime import datetime, timedelta
from collections import defaultdict

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

def parse_datetime(date_str, time_str):
    """Parse date and time into datetime object"""
    try:
        # Format: "08 Jan 2026" and "13:19:41"
        dt_str = f"{date_str} {time_str}"
        return datetime.strptime(dt_str, "%d %b %Y %H:%M:%S")
    except:
        return None

def format_seconds(seconds):
    """Format seconds into readable format"""
    if seconds < 60:
        return f"{seconds}s"
    elif seconds < 3600:
        return f"{seconds//60}m {seconds%60}s"
    else:
        hours = seconds // 3600
        mins = (seconds % 3600) // 60
        return f"{hours}h {mins}m"

def calculate_idle_time(calls):
    """Calculate idle time between calls (same day only)"""
    if len(calls) < 2:
        return []
    
    idle_times = []
    for i in range(len(calls) - 1):
        current_call = calls[i]
        next_call = calls[i + 1]
        
        # Skip if different days
        if current_call['date'] != next_call['date']:
            continue
        
        # End of current call
        end_time = current_call['datetime'] + timedelta(seconds=current_call['duration_seconds'])
        # Start of next call
        start_next = next_call['datetime']
        
        # Idle time
        idle_seconds = (start_next - end_time).total_seconds()
        
        # Only count positive idle time (skip negative or zero)
        if idle_seconds > 0:
            idle_times.append({
                'after_call': i,
                'idle_seconds': idle_seconds,
                'current_time': current_call['datetime'],
                'next_time': next_call['datetime']
            })
    
    return idle_times

def main():
    downloads_dir = os.path.expanduser('~/Downloads')
    output_dir = os.path.dirname(os.path.abspath(__file__))
    
    input_file = os.path.join(downloads_dir, 'Untitled spreadsheet - call-data (1) (2).csv')
    output_file = os.path.join(output_dir, 'CALL_STATS_REPORT.html')
    
    print("📊 Generating HTML Call Statistics Report...\n")
    
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
                dt = parse_datetime(row.get('Date', ''), row.get('Time', ''))
                
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
                    'datetime': dt
                }
                
                all_extensions[ext].append(call_data)
                
                if ext == '1001':
                    ext_1001_calls.append(call_data)
                elif ext == '1002':
                    ext_1002_calls.append(call_data)
    
    # Sort calls by datetime
    ext_1001_calls.sort(key=lambda x: x['datetime'] if x['datetime'] else datetime.min)
    ext_1002_calls.sort(key=lambda x: x['datetime'] if x['datetime'] else datetime.min)
    
    # Calculate idle times
    idle_1001 = calculate_idle_time(ext_1001_calls)
    idle_1002 = calculate_idle_time(ext_1002_calls)
    
    print(f"✅ Processed data")
    print(f"   Ext 1001: {len(ext_1001_calls)} calls, {len(idle_1001)} idle periods")
    print(f"   Ext 1002: {len(ext_1002_calls)} calls, {len(idle_1002)} idle periods\n")
    
    # Generate HTML
    html = generate_html(ext_1001_calls, ext_1002_calls, idle_1001, idle_1002, all_extensions)
    
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(html)
    
    # Copy to Downloads
    downloads_output = os.path.join(downloads_dir, 'CALL_STATS_REPORT.html')
    with open(downloads_output, 'w', encoding='utf-8') as f:
        f.write(html)
    
    print(f"✅ HTML report generated!")
    print(f"   📄 {output_file}")
    print(f"   📄 {downloads_output}")

def generate_html(calls_1001, calls_1002, idle_1001, idle_1002, all_extensions):
    """Generate HTML report"""
    
    # Calculate stats for both extensions
    def calc_stats(calls, idle_times):
        total_calls = len(calls)
        if total_calls == 0:
            return {}
        
        total_duration = sum(c['duration_seconds'] for c in calls)
        answered = sum(1 for c in calls if c['call_result'] == 'Answered')
        unanswered = total_calls - answered
        
        # Time analysis - calculate per day to avoid counting overnight as idle
        by_date = defaultdict(list)
        for call in calls:
            by_date[call['date']].append(call)
        
        total_working_time = 0
        for date, day_calls in by_date.items():
            day_calls.sort(key=lambda x: x['datetime'])
            first_call = day_calls[0]['datetime']
            last_call = day_calls[-1]['datetime']
            last_call_end = last_call + timedelta(seconds=day_calls[-1]['duration_seconds'])
            day_working_time = (last_call_end - first_call).total_seconds()
            total_working_time += day_working_time
        
        total_idle_time = sum(i['idle_seconds'] for i in idle_times if i['idle_seconds'] > 0)
        total_active_time = total_duration
        
        # Productivity metrics
        productive_pct = (total_active_time / total_working_time * 100) if total_working_time > 0 else 0
        idle_pct = (total_idle_time / total_working_time * 100) if total_working_time > 0 else 0
        
        # Average idle time
        avg_idle = total_idle_time / len(idle_times) if idle_times else 0
        max_idle = max((i['idle_seconds'] for i in idle_times), default=0)
        min_idle = min((i['idle_seconds'] for i in idle_times if i['idle_seconds'] > 0), default=0)
        
        return {
            'total_calls': total_calls,
            'answered': answered,
            'unanswered': unanswered,
            'answer_rate': (answered / total_calls * 100) if total_calls > 0 else 0,
            'total_duration': total_duration,
            'avg_duration': total_duration / total_calls if total_calls > 0 else 0,
            'total_working_time': total_working_time,
            'total_idle_time': total_idle_time,
            'total_active_time': total_active_time,
            'productive_pct': productive_pct,
            'idle_pct': idle_pct,
            'avg_idle': avg_idle,
            'max_idle': max_idle,
            'min_idle': min_idle
        }
    
    stats_1001 = calc_stats(calls_1001, idle_1001)
    stats_1002 = calc_stats(calls_1002, idle_1002)
    
    # Generate comparison stats
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
    
    html = f"""
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Call Statistics Report - Ext 1001 & 1002</title>
    <style>
        * {{
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }}
        
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #f5f5f5;
            padding: 20px;
            color: #333;
        }}
        
        .container {{
            max-width: 1400px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            padding: 40px;
        }}
        
        h1 {{
            font-size: 32px;
            margin-bottom: 10px;
            color: #1a1a1a;
        }}
        
        .subtitle {{
            color: #666;
            font-size: 16px;
            margin-bottom: 30px;
        }}
        
        .warning {{
            background: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px 20px;
            margin-bottom: 30px;
            border-radius: 4px;
        }}
        
        .warning-title {{
            font-weight: 700;
            color: #856404;
            margin-bottom: 8px;
            font-size: 16px;
        }}
        
        .warning-text {{
            color: #856404;
            font-size: 14px;
            line-height: 1.6;
        }}
        
        .grid {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-bottom: 40px;
        }}
        
        .card {{
            background: #f8f9fa;
            border-radius: 8px;
            padding: 20px;
            border: 1px solid #dee2e6;
        }}
        
        .card-title {{
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 15px;
            color: #495057;
        }}
        
        .stat {{
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px 0;
            border-bottom: 1px solid #e9ecef;
        }}
        
        .stat:last-child {{
            border-bottom: none;
        }}
        
        .stat-label {{
            font-size: 14px;
            color: #666;
        }}
        
        .stat-value {{
            font-size: 18px;
            font-weight: 700;
            color: #1a1a1a;
        }}
        
        .stat-value.bad {{
            color: #dc3545;
        }}
        
        .stat-value.warning {{
            color: #fd7e14;
        }}
        
        .stat-value.good {{
            color: #28a745;
        }}
        
        .comparison {{
            background: white;
            border: 2px solid #dee2e6;
            border-radius: 8px;
            padding: 30px;
            margin-bottom: 40px;
        }}
        
        .comparison-title {{
            font-size: 24px;
            font-weight: 700;
            margin-bottom: 20px;
            text-align: center;
        }}
        
        .vs {{
            display: grid;
            grid-template-columns: 1fr auto 1fr;
            gap: 30px;
            align-items: center;
        }}
        
        .ext-box {{
            background: #f8f9fa;
            padding: 25px;
            border-radius: 8px;
            text-align: center;
        }}
        
        .ext-box.ext-1001 {{
            border-left: 4px solid #007bff;
        }}
        
        .ext-box.ext-1002 {{
            border-left: 4px solid #6610f2;
        }}
        
        .ext-number {{
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 15px;
        }}
        
        .ext-stat {{
            margin: 8px 0;
            font-size: 14px;
        }}
        
        .vs-divider {{
            font-size: 32px;
            font-weight: 700;
            color: #ccc;
        }}
        
        table {{
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            background: white;
        }}
        
        th {{
            background: #343a40;
            color: white;
            padding: 12px;
            text-align: left;
            font-weight: 600;
            font-size: 14px;
        }}
        
        td {{
            padding: 12px;
            border-bottom: 1px solid #dee2e6;
            font-size: 14px;
        }}
        
        tr:hover {{
            background: #f8f9fa;
        }}
        
        .badge {{
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 600;
        }}
        
        .badge-danger {{
            background: #dc3545;
            color: white;
        }}
        
        .badge-warning {{
            background: #ffc107;
            color: #000;
        }}
        
        .badge-success {{
            background: #28a745;
            color: white;
        }}
        
        .badge-info {{
            background: #17a2b8;
            color: white;
        }}
        
        .section {{
            margin: 40px 0;
        }}
        
        .section-title {{
            font-size: 24px;
            font-weight: 700;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 3px solid #007bff;
        }}
        
        .alert {{
            padding: 15px 20px;
            border-radius: 8px;
            margin-bottom: 20px;
            font-size: 14px;
            line-height: 1.6;
        }}
        
        .alert-danger {{
            background: #f8d7da;
            border-left: 4px solid #dc3545;
            color: #721c24;
        }}
        
        .idle-summary {{
            background: #fff3cd;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
        }}
        
        .idle-title {{
            font-size: 18px;
            font-weight: 700;
            color: #856404;
            margin-bottom: 15px;
        }}
        
        .progress {{
            background: #e9ecef;
            border-radius: 4px;
            height: 30px;
            position: relative;
            margin: 10px 0;
            overflow: hidden;
        }}
        
        .progress-bar {{
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: 600;
            font-size: 14px;
        }}
        
        .progress-bar.active {{
            background: #28a745;
        }}
        
        .progress-bar.idle {{
            background: #dc3545;
        }}
    </style>
</head>
<body>
    <div class="container">
        <h1>📊 Call Statistics Report</h1>
        <p class="subtitle">Extensions 1001 & 1002 - Performance Analysis</p>
        <p class="subtitle">Period: January 5-8, 2026 | Total Agents: {len(all_extensions)}</p>
        
        <div class="warning">
            <div class="warning-title">⚠️ Performance Alert</div>
            <div class="warning-text">
                This report shows significant inefficiencies. Low answer rates, excessive idle time, and poor productivity metrics indicate 
                serious issues that need immediate attention. The data reveals wasted time, poor targeting, and suboptimal work patterns.
            </div>
        </div>
"""

    # Extension 1001 Details
    if stats_1001:
        s = stats_1001
        html += f"""
        <div class="section">
            <div class="section-title">Extension 1001 - Critical Analysis</div>
            
            <div class="alert alert-danger">
                <strong>Key Issues:</strong> While {s['answer_rate']:.1f}% answer rate is the best of the two, it's still unacceptable. 
                Spending {s['idle_pct']:.1f}% of work time idle between calls is wasteful. With only {s['total_calls']} calls over 
                {s['total_working_time']/3600:.1f} hours, productivity is far below acceptable standards.
            </div>
            
            <div class="grid">
                <div class="card">
                    <div class="card-title">Call Volume (Poor)</div>
                    <div class="stat">
                        <span class="stat-label">Total Calls</span>
                        <span class="stat-value bad">{s['total_calls']}</span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">Answered</span>
                        <span class="stat-value warning">{s['answered']} ({s['answer_rate']:.1f}%)</span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">Unanswered (Wasted)</span>
                        <span class="stat-value bad">{s['unanswered']} ({100-s['answer_rate']:.1f}%)</span>
                    </div>
                </div>
                
                <div class="card">
                    <div class="card-title">Time Usage (Inefficient)</div>
                    <div class="stat">
                        <span class="stat-label">Total Working Time</span>
                        <span class="stat-value">{format_seconds(int(s['total_working_time']))}</span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">Active Call Time</span>
                        <span class="stat-value warning">{format_seconds(int(s['total_active_time']))}</span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">Idle Time (Wasted)</span>
                        <span class="stat-value bad">{format_seconds(int(s['total_idle_time']))}</span>
                    </div>
                </div>
                
                <div class="card">
                    <div class="card-title">Productivity (Unacceptable)</div>
                    <div class="stat">
                        <span class="stat-label">Productive %</span>
                        <span class="stat-value bad">{s['productive_pct']:.1f}%</span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">Idle %</span>
                        <span class="stat-value bad">{s['idle_pct']:.1f}%</span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">Avg Duration</span>
                        <span class="stat-value">{s['avg_duration']:.1f}s</span>
                    </div>
                </div>
            </div>
            
            <div class="idle-summary">
                <div class="idle-title">⏱️ Idle Time Analysis - Extension 1001</div>
                <div class="stat">
                    <span class="stat-label">Average Idle Between Calls</span>
                    <span class="stat-value bad">{format_seconds(int(s['avg_idle']))}</span>
                </div>
                <div class="stat">
                    <span class="stat-label">Longest Idle Period</span>
                    <span class="stat-value bad">{format_seconds(int(s['max_idle']))}</span>
                </div>
                <div class="stat">
                    <span class="stat-label">Shortest Idle Period</span>
                    <span class="stat-value">{format_seconds(int(s['min_idle']))}</span>
                </div>
                
                <div style="margin-top: 20px;">
                    <strong>Time Distribution:</strong>
                    <div class="progress">
                        <div class="progress-bar active" style="width: {s['productive_pct']:.1f}%">
                            Active: {s['productive_pct']:.1f}%
                        </div>
                        <div class="progress-bar idle" style="width: {s['idle_pct']:.1f}%">
                            Idle: {s['idle_pct']:.1f}%
                        </div>
                    </div>
                </div>
                
                <p style="margin-top: 15px; color: #856404; font-size: 13px;">
                    <strong>Reality Check:</strong> Spending {format_seconds(int(s['total_idle_time']))} idle out of {format_seconds(int(s['total_working_time']))} working time 
                    means you're only actively working {s['productive_pct']:.1f}% of the time. This is unacceptable efficiency.
                </p>
            </div>
        </div>
"""

    # Extension 1002 Details
    if stats_1002:
        s = stats_1002
        html += f"""
        <div class="section">
            <div class="section-title">Extension 1002 - Critical Analysis</div>
            
            <div class="alert alert-danger">
                <strong>Major Concerns:</strong> A {s['answer_rate']:.1f}% answer rate means over half your calls are going nowhere. 
                {s['idle_pct']:.1f}% idle time combined with {s['avg_duration']:.1f} second average calls suggests poor list quality and 
                wasted effort. {s['total_calls']} calls may seem high, but the quality is severely lacking.
            </div>
            
            <div class="grid">
                <div class="card">
                    <div class="card-title">Call Volume (Low Quality)</div>
                    <div class="stat">
                        <span class="stat-label">Total Calls</span>
                        <span class="stat-value warning">{s['total_calls']}</span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">Answered</span>
                        <span class="stat-value bad">{s['answered']} ({s['answer_rate']:.1f}%)</span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">Unanswered (Wasted)</span>
                        <span class="stat-value bad">{s['unanswered']} ({100-s['answer_rate']:.1f}%)</span>
                    </div>
                </div>
                
                <div class="card">
                    <div class="card-title">Time Usage (Wasteful)</div>
                    <div class="stat">
                        <span class="stat-label">Total Working Time</span>
                        <span class="stat-value">{format_seconds(int(s['total_working_time']))}</span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">Active Call Time</span>
                        <span class="stat-value bad">{format_seconds(int(s['total_active_time']))}</span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">Idle Time (Wasted)</span>
                        <span class="stat-value bad">{format_seconds(int(s['total_idle_time']))}</span>
                    </div>
                </div>
                
                <div class="card">
                    <div class="card-title">Productivity (Very Poor)</div>
                    <div class="stat">
                        <span class="stat-label">Productive %</span>
                        <span class="stat-value bad">{s['productive_pct']:.1f}%</span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">Idle %</span>
                        <span class="stat-value bad">{s['idle_pct']:.1f}%</span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">Avg Duration</span>
                        <span class="stat-value bad">{s['avg_duration']:.1f}s</span>
                    </div>
                </div>
            </div>
            
            <div class="idle-summary">
                <div class="idle-title">⏱️ Idle Time Analysis - Extension 1002</div>
                <div class="stat">
                    <span class="stat-label">Average Idle Between Calls</span>
                    <span class="stat-value bad">{format_seconds(int(s['avg_idle']))}</span>
                </div>
                <div class="stat">
                    <span class="stat-label">Longest Idle Period</span>
                    <span class="stat-value bad">{format_seconds(int(s['max_idle']))}</span>
                </div>
                <div class="stat">
                    <span class="stat-label">Shortest Idle Period</span>
                    <span class="stat-value">{format_seconds(int(s['min_idle']))}</span>
                </div>
                
                <div style="margin-top: 20px;">
                    <strong>Time Distribution:</strong>
                    <div class="progress">
                        <div class="progress-bar active" style="width: {s['productive_pct']:.1f}%">
                            Active: {s['productive_pct']:.1f}%
                        </div>
                        <div class="progress-bar idle" style="width: {s['idle_pct']:.1f}%">
                            Idle: {s['idle_pct']:.1f}%
                        </div>
                    </div>
                </div>
                
                <p style="margin-top: 15px; color: #856404; font-size: 13px;">
                    <strong>Reality Check:</strong> Only {s['productive_pct']:.1f}% of your time is spent on actual calls. The rest is wasted. 
                    With such short call durations ({s['avg_duration']:.1f}s average), most calls aren't even being answered.
                </p>
            </div>
        </div>
"""

    # Comparison Section
    html += f"""
        <div class="section">
            <div class="comparison">
                <div class="comparison-title">Head-to-Head Comparison</div>
                <div class="vs">
                    <div class="ext-box ext-1001">
                        <div class="ext-number" style="color: #007bff;">Ext 1001</div>
                        <div class="ext-stat"><strong>{stats_1001['total_calls']}</strong> calls</div>
                        <div class="ext-stat"><strong>{stats_1001['answer_rate']:.1f}%</strong> answer rate</div>
                        <div class="ext-stat"><strong>{stats_1001['productive_pct']:.1f}%</strong> productive</div>
                        <div class="ext-stat"><strong>{stats_1001['idle_pct']:.1f}%</strong> idle</div>
                        <div class="ext-stat"><strong>{format_seconds(int(stats_1001['avg_idle']))}</strong> avg idle</div>
                    </div>
                    <div class="vs-divider">VS</div>
                    <div class="ext-box ext-1002">
                        <div class="ext-number" style="color: #6610f2;">Ext 1002</div>
                        <div class="ext-stat"><strong>{stats_1002['total_calls']}</strong> calls</div>
                        <div class="ext-stat"><strong>{stats_1002['answer_rate']:.1f}%</strong> answer rate</div>
                        <div class="ext-stat"><strong>{stats_1002['productive_pct']:.1f}%</strong> productive</div>
                        <div class="ext-stat"><strong>{stats_1002['idle_pct']:.1f}%</strong> idle</div>
                        <div class="ext-stat"><strong>{format_seconds(int(stats_1002['avg_idle']))}</strong> avg idle</div>
                    </div>
                </div>
                
                <div style="margin-top: 30px; padding: 20px; background: #f8d7da; border-radius: 8px;">
                    <strong style="color: #721c24;">The Harsh Truth:</strong>
                    <ul style="margin: 10px 0 0 20px; color: #721c24; line-height: 1.8;">
                        <li><strong>1001:</strong> Better answer rate but still losing 21% of calls. Spending {stats_1001['idle_pct']:.1f}% idle is unacceptable.</li>
                        <li><strong>1002:</strong> High volume means nothing when 45% go unanswered. {stats_1002['productive_pct']:.1f}% productivity is terrible.</li>
                        <li><strong>Both:</strong> Need to double productivity, reduce idle time by 50%, and improve answer rates to 85%+.</li>
                    </ul>
                </div>
            </div>
        </div>
"""

    # All Agents Comparison
    sorted_agents = sorted(agent_stats.items(), key=lambda x: x[1]['calls'], reverse=True)
    
    html += """
        <div class="section">
            <div class="section-title">All Agents Comparison</div>
            <table>
                <thead>
                    <tr>
                        <th>Extension</th>
                        <th>Total Calls</th>
                        <th>Answered</th>
                        <th>Answer Rate</th>
                        <th>Duration (min)</th>
                        <th>Avg (sec)</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
"""
    
    for ext, stats in sorted_agents:
        highlight = "font-weight: 700;" if ext in ['1001', '1002'] else ""
        answer_badge = "badge-success" if stats['answer_rate'] >= 80 else "badge-warning" if stats['answer_rate'] >= 60 else "badge-danger"
        status_badge = "badge-success" if ext not in ['1001', '1002'] and stats['answer_rate'] >= 80 else "badge-danger"
        status_text = "Acceptable" if stats['answer_rate'] >= 80 else "Needs Improvement" if stats['answer_rate'] >= 60 else "Poor"
        
        html += f"""
                    <tr style="{highlight}">
                        <td>Ext {ext} {'⭐' if ext in ['1001', '1002'] else ''}</td>
                        <td>{stats['calls']}</td>
                        <td>{stats['answered']}</td>
                        <td><span class="badge {answer_badge}">{stats['answer_rate']:.1f}%</span></td>
                        <td>{stats['duration_min']:.2f}</td>
                        <td>{stats['avg_duration']:.1f}</td>
                        <td><span class="badge {status_badge}">{status_text}</span></td>
                    </tr>
"""
    
    html += """
                </tbody>
            </table>
            
            <div class="alert alert-danger">
                <strong>Benchmarking Reality:</strong> Extensions 1001 and 1002 are underperforming compared to industry standards:
                <ul style="margin: 10px 0 0 20px; line-height: 1.8;">
                    <li><strong>Industry Standard:</strong> 85-90% answer rate, 70-80% productive time, <30s idle between calls</li>
                    <li><strong>1001 Performance:</strong> 79.3% answer (below standard), {:.1f}% productive (well below), {:.0f}s avg idle (excessive)</li>
                    <li><strong>1002 Performance:</strong> 55% answer (far below), {:.1f}% productive (critically low), {:.0f}s avg idle (excessive)</li>
                </ul>
            </div>
        </div>
""".format(stats_1001['productive_pct'], stats_1001['avg_idle'], stats_1002['productive_pct'], stats_1002['avg_idle'])
    
    html += """
        <div class="section">
            <div class="section-title">Required Improvements</div>
            <div class="grid">
                <div class="card">
                    <div class="card-title">Extension 1001 - Action Items</div>
                    <ul style="margin: 0; padding-left: 20px; line-height: 1.8;">
                        <li>Increase answer rate from 79% to 85%+</li>
                        <li>Reduce idle time by 50% (target <30s between calls)</li>
                        <li>Increase call volume to 120+ per day</li>
                        <li>Improve productivity from current % to 70%+</li>
                        <li>Better time management and dialing discipline</li>
                    </ul>
                </div>
                
                <div class="card">
                    <div class="card-title">Extension 1002 - Action Items</div>
                    <ul style="margin: 0; padding-left: 20px; line-height: 1.8;">
                        <li>CRITICAL: Fix answer rate from 55% to 70%+ minimum</li>
                        <li>Improve list quality - too many bad numbers</li>
                        <li>Reduce idle time dramatically (currently excessive)</li>
                        <li>Focus on quality over quantity</li>
                        <li>Increase productive time from current % to 50%+ as first step</li>
                    </ul>
                </div>
            </div>
        </div>
        
        <div style="margin-top: 40px; padding: 25px; background: #343a40; color: white; border-radius: 8px; text-align: center;">
            <p style="font-size: 16px; margin: 0;">
                <strong>Report Generated:</strong> {datetime.now().strftime("%B %d, %Y at %I:%M %p")}<br>
                <strong>Data Period:</strong> January 5-8, 2026 | <strong>Total Extensions:</strong> {len(all_extensions)}
            </p>
        </div>
    </div>
</body>
</html>
"""
    
    return html

if __name__ == '__main__':
    main()
