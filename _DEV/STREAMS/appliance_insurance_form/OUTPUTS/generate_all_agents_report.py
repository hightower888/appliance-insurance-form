#!/usr/bin/env python3
"""
Generate comprehensive HTML report for ALL agents
Hour-by-hour per day and day-by-day breakdown
Working hours: 9am to their last call time (not fixed 5pm)
"""

import pandas as pd
from datetime import datetime, timedelta
from collections import defaultdict
import json

# Load the most recent data
csv_path = '/Users/danielyoung/Downloads/call-data (1).csv'
df = pd.read_csv(csv_path)

# Combine Date and Time columns
df['datetime'] = pd.to_datetime(df['Date'] + ' ' + df['Time'], format='%d %b %Y %H:%M:%S', errors='coerce')
df['date'] = df['datetime'].dt.date
df['hour'] = df['datetime'].dt.hour
df['day_of_week'] = df['Day Of Week']

# Get extension from 'From' column (e.g., "Ext 1001")
df['extension'] = df['From'].str.extract(r'Ext (\d+)').astype(float)

# Duration is already in seconds
df['duration_seconds'] = pd.to_numeric(df['Duration (Seconds)'], errors='coerce').fillna(0)

# Filter out rows without extension
df = df[df['extension'].notna()]

# Get all unique extensions and sort them
all_extensions = sorted(df['extension'].unique())

print(f"📊 Found {len(all_extensions)} agents: {', '.join([str(int(x)) for x in all_extensions])}")

def format_time(seconds):
    """Format seconds to HH:MM:SS or MM:SS"""
    if seconds >= 3600:
        hours = int(seconds // 3600)
        minutes = int((seconds % 3600) // 60)
        secs = int(seconds % 60)
        return f"{hours}h {minutes:02d}m {secs:02d}s"
    elif seconds >= 60:
        minutes = int(seconds // 60)
        secs = int(seconds % 60)
        return f"{minutes}m {secs:02d}s"
    else:
        return f"{int(seconds)}s"

def analyze_by_hour_per_day(agent_df):
    """Hour-by-hour analysis per day"""
    hourly_stats = []
    
    for date in sorted(agent_df['date'].unique()):
        day_calls = agent_df[agent_df['date'] == date].sort_values('datetime')
        
        for hour in range(9, 18):  # 9am to 5pm
            hour_calls = day_calls[day_calls['hour'] == hour]
            
            if len(hour_calls) == 0:
                continue
            
            answered = len(hour_calls[hour_calls['Call Result'] == 'Answered'])
            unanswered = len(hour_calls[hour_calls['Call Result'] != 'Answered'])
            total_duration = hour_calls['duration_seconds'].sum()
            avg_duration = total_duration / len(hour_calls) if len(hour_calls) > 0 else 0
            
            # Calculate idle time within this specific hour
            # Account for 10 seconds ring time per call
            total_idle = 0
            idle_periods = []
            
            for i in range(len(hour_calls) - 1):
                current = hour_calls.iloc[i]
                next_call = hour_calls.iloc[i + 1]
                
                # Call duration + 10 seconds ring time
                call_end_with_ring = current['datetime'] + timedelta(seconds=int(current['duration_seconds']) + 10)
                next_start = next_call['datetime']
                
                if next_start.hour == hour:
                    idle_seconds = (next_start - call_end_with_ring).total_seconds()
                    if idle_seconds > 0:
                        total_idle += idle_seconds
                        idle_periods.append(idle_seconds)
            
            avg_idle = total_idle / len(idle_periods) if idle_periods else 0
            max_idle = max(idle_periods) if idle_periods else 0
            
            calls_count = len(hour_calls)
            if calls_count >= 10 and avg_idle < 300:
                performance = 'Excellent'
                perf_class = 'excellent'
            elif calls_count >= 7 and avg_idle < 600:
                performance = 'Good'
                perf_class = 'good'
            elif calls_count >= 4:
                performance = 'Average'
                perf_class = 'average'
            else:
                performance = 'Poor'
                perf_class = 'poor'
            
            hourly_stats.append({
                'date': date.strftime('%Y-%m-%d'),
                'day_of_week': hour_calls.iloc[0]['day_of_week'],
                'hour': f"{hour:02d}:00-{hour:02d}:59",
                'hour_num': hour,
                'total_calls': len(hour_calls),
                'answered': answered,
                'unanswered': unanswered,
                'answer_rate': (answered / len(hour_calls) * 100) if len(hour_calls) > 0 else 0,
                'total_duration': total_duration,
                'avg_duration': avg_duration,
                'total_idle': total_idle,
                'avg_idle': avg_idle,
                'max_idle': max_idle,
                'idle_count': len(idle_periods),
                'performance': performance,
                'perf_class': perf_class
            })
    
    return hourly_stats

def analyze_by_day(agent_df):
    """Day-by-day analysis with dynamic end time"""
    daily_stats = []
    
    for date in sorted(agent_df['date'].unique()):
        day_calls = agent_df[agent_df['date'] == date]
        
        answered = len(day_calls[day_calls['Call Result'] == 'Answered'])
        unanswered = len(day_calls[day_calls['Call Result'] != 'Answered'])
        total_duration = day_calls['duration_seconds'].sum()
        avg_duration = total_duration / len(day_calls) if len(day_calls) > 0 else 0
        
        # Working hours: 9am to last call end time
        first_call = day_calls['datetime'].min()
        last_call = day_calls['datetime'].max()
        last_call_duration = int(day_calls[day_calls['datetime'] == last_call]['duration_seconds'].iloc[0])
        last_call_end = last_call + timedelta(seconds=last_call_duration)
        
        # Calculate expected working time from 9am to last call
        date_9am = pd.Timestamp(date) + pd.Timedelta(hours=9)
        working_seconds = (last_call_end - date_9am).total_seconds()
        
        # Calculate idle time (same-day gaps only)
        day_calls_sorted = day_calls.sort_values('datetime')
        total_idle = 0
        idle_periods = []
        
        for i in range(len(day_calls_sorted) - 1):
            current = day_calls_sorted.iloc[i]
            next_call = day_calls_sorted.iloc[i + 1]
            
            # Call duration + 10 seconds ring time
            call_end_with_ring = current['datetime'] + timedelta(seconds=int(current['duration_seconds']) + 10)
            next_start = next_call['datetime']
            
            idle_seconds = (next_start - call_end_with_ring).total_seconds()
            if idle_seconds > 0:
                total_idle += idle_seconds
                idle_periods.append(idle_seconds)
        
        avg_idle = total_idle / len(idle_periods) if idle_periods else 0
        max_idle = max(idle_periods) if idle_periods else 0
        
        # Unaccounted time = working time - call time
        unaccounted_time = working_seconds - total_duration
        
        # Productivity metrics
        productive_pct = (total_duration / working_seconds * 100) if working_seconds > 0 else 0
        idle_pct = (unaccounted_time / working_seconds * 100) if working_seconds > 0 else 0
        
        # Calls per hour based on actual working hours
        working_hours = working_seconds / 3600
        calls_per_hour = len(day_calls) / working_hours if working_hours > 0 else 0
        
        # Performance rating
        if calls_per_hour >= 8 and productive_pct >= 30:
            performance = 'Excellent'
            perf_class = 'excellent'
        elif calls_per_hour >= 6 and productive_pct >= 20:
            performance = 'Good'
            perf_class = 'good'
        elif calls_per_hour >= 4:
            performance = 'Average'
            perf_class = 'average'
        else:
            performance = 'Poor'
            perf_class = 'poor'
        
        # Check if started late
        start_time = first_call.hour + first_call.minute/60
        late_start = start_time > 9.25
        
        daily_stats.append({
            'date': date.strftime('%Y-%m-%d'),
            'day_of_week': day_calls['day_of_week'].iloc[0],
            'total_calls': len(day_calls),
            'answered': answered,
            'unanswered': unanswered,
            'answer_rate': (answered / len(day_calls) * 100) if len(day_calls) > 0 else 0,
            'total_duration': total_duration,
            'avg_duration': avg_duration,
            'working_seconds': working_seconds,
            'unaccounted_time': unaccounted_time,
            'total_idle': total_idle,
            'avg_idle': avg_idle,
            'max_idle': max_idle,
            'productive_pct': productive_pct,
            'idle_pct': idle_pct,
            'calls_per_hour': calls_per_hour,
            'first_call': first_call.strftime('%H:%M'),
            'last_call': last_call_end.strftime('%H:%M'),
            'late_start': late_start,
            'performance': performance,
            'perf_class': perf_class
        })
    
    return daily_stats

def generate_hourly_table(hourly_stats):
    """Generate HTML table for hourly breakdown"""
    rows = []
    current_date = None
    
    for stat in hourly_stats:
        if current_date != stat['date']:
            current_date = stat['date']
            rows.append(f"""
            <tr style="background: #667eea; color: white;">
                <td colspan="12"><strong>📅 {stat['date']} ({stat['day_of_week']})</strong></td>
            </tr>
            """)
        
        rows.append(f"""
        <tr class="{stat['perf_class']}">
            <td><strong>{stat['hour']}</strong></td>
            <td>{stat['total_calls']}</td>
            <td>{stat['answered']}</td>
            <td>{stat['unanswered']}</td>
            <td>{stat['answer_rate']:.1f}%</td>
            <td>{format_time(stat['total_duration'])}</td>
            <td>{format_time(stat['avg_duration'])}</td>
            <td>{format_time(stat['total_idle'])}</td>
            <td>{format_time(stat['avg_idle'])}</td>
            <td>{format_time(stat['max_idle'])}</td>
            <td>{stat['idle_count']}</td>
            <td><span class="badge {stat['perf_class']}">{stat['performance']}</span></td>
        </tr>
        """)
    
    return ''.join(rows)

def generate_daily_table(daily_stats):
    """Generate HTML table for daily breakdown"""
    rows = []
    for stat in daily_stats:
        time_warning = ''
        if stat['late_start']:
            time_warning += '⚠️ Late Start'
        
        rows.append(f"""
        <tr class="{stat['perf_class']}">
            <td><strong>{stat['date']}</strong></td>
            <td>{stat['day_of_week']}</td>
            <td>{stat['first_call']}-{stat['last_call']} {time_warning}</td>
            <td>{stat['total_calls']}</td>
            <td>{stat['answered']}</td>
            <td>{stat['unanswered']}</td>
            <td>{stat['answer_rate']:.1f}%</td>
            <td>{format_time(stat['total_duration'])}</td>
            <td>{format_time(stat['avg_duration'])}</td>
            <td><strong>{format_time(stat['unaccounted_time'])}</strong></td>
            <td>{format_time(stat['avg_idle'])}</td>
            <td>{format_time(stat['max_idle'])}</td>
            <td>{stat['productive_pct']:.1f}%</td>
            <td>{stat['idle_pct']:.1f}%</td>
            <td>{stat['calls_per_hour']:.1f}</td>
            <td><span class="badge {stat['perf_class']}">{stat['performance']}</span></td>
        </tr>
        """)
    
    return ''.join(rows)

# Generate analyses for all agents
agent_data = {}
for ext in all_extensions:
    ext_int = int(ext)
    agent_df = df[df['extension'] == ext].sort_values('datetime').reset_index(drop=True)
    
    if len(agent_df) == 0:
        continue
    
    agent_data[ext_int] = {
        'df': agent_df,
        'hourly': analyze_by_hour_per_day(agent_df),
        'daily': analyze_by_day(agent_df)
    }
    
    print(f"   ✓ Processed Ext {ext_int}: {len(agent_df)} calls")

# Generate comparison data
comparison_stats = []
for ext in sorted(agent_data.keys()):
    data = agent_data[ext]
    df_agent = data['df']
    
    total_calls = len(df_agent)
    answered = len(df_agent[df_agent['Call Result'] == 'Answered'])
    answer_rate = (answered / total_calls * 100) if total_calls > 0 else 0
    
    total_duration = df_agent['duration_seconds'].sum()
    avg_duration = total_duration / total_calls if total_calls > 0 else 0
    
    # Calculate overall idle time
    total_idle = 0
    for i in range(len(df_agent) - 1):
        current = df_agent.iloc[i]
        next_call = df_agent.iloc[i + 1]
        if current['date'] == next_call['date']:
            call_end = current['datetime'] + timedelta(seconds=int(current['duration_seconds']) + 10)
            idle_seconds = (next_call['datetime'] - call_end).total_seconds()
            if idle_seconds > 0:
                total_idle += idle_seconds
    
    avg_idle = total_idle / (total_calls - 1) if total_calls > 1 else 0
    
    # Working days
    days = len(df_agent['date'].unique())
    calls_per_day = total_calls / days if days > 0 else 0
    
    comparison_stats.append({
        'ext': ext,
        'total_calls': total_calls,
        'answered': answered,
        'answer_rate': answer_rate,
        'total_duration': total_duration,
        'avg_duration': avg_duration,
        'avg_idle': avg_idle,
        'days': days,
        'calls_per_day': calls_per_day
    })

# Sort by total calls descending
comparison_stats.sort(key=lambda x: x['total_calls'], reverse=True)

# Generate tabs HTML
tabs_html = ['<button class="tab active" onclick="showTab(\'comparison\')">📊 Comparison</button>']
for ext in sorted(agent_data.keys()):
    tabs_html.append(f'<button class="tab" onclick="showTab(\'ext{ext}\')">👤 Ext {ext}</button>')

# Generate comparison table HTML
def generate_comparison_table():
    rows = []
    rank = 1
    for stat in comparison_stats:
        # Performance class based on calls per day
        if stat['calls_per_day'] >= 50:
            perf_class = 'excellent'
        elif stat['calls_per_day'] >= 35:
            perf_class = 'good'
        elif stat['calls_per_day'] >= 20:
            perf_class = 'average'
        else:
            perf_class = 'poor'
        
        rows.append(f"""
        <tr class="{perf_class}">
            <td><strong>#{rank}</strong></td>
            <td><strong>Ext {stat['ext']}</strong></td>
            <td>{stat['total_calls']}</td>
            <td>{stat['calls_per_day']:.1f}</td>
            <td>{stat['answered']}</td>
            <td>{stat['answer_rate']:.1f}%</td>
            <td>{format_time(stat['total_duration'])}</td>
            <td>{format_time(stat['avg_duration'])}</td>
            <td>{format_time(stat['avg_idle'])}</td>
            <td>{stat['days']}</td>
        </tr>
        """)
        rank += 1
    return ''.join(rows)

comparison_html = f"""
<div id="comparison" class="tab-content active">
    <div class="section">
        <h2>📊 All Agents Performance Comparison</h2>
        <div class="warning">
            <strong>📈 Ranked by Total Calls</strong><br>
            Comparing all 16 agents across all metrics
        </div>
        
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-label">Total Calls (All Agents)</div>
                <div class="stat-value">{sum(s['total_calls'] for s in comparison_stats):,}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Average Calls Per Agent</div>
                <div class="stat-value">{sum(s['total_calls'] for s in comparison_stats) / len(comparison_stats):.0f}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Top Performer</div>
                <div class="stat-value">Ext {comparison_stats[0]['ext']}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Overall Answer Rate</div>
                <div class="stat-value">{sum(s['answered'] for s in comparison_stats) / sum(s['total_calls'] for s in comparison_stats) * 100:.1f}%</div>
            </div>
        </div>
        
        <table>
            <thead>
                <tr>
                    <th>Rank</th>
                    <th>Agent</th>
                    <th>Total Calls</th>
                    <th>Calls/Day</th>
                    <th>Answered</th>
                    <th>Answer %</th>
                    <th>Total Talk Time</th>
                    <th>Avg Talk Time</th>
                    <th>Avg Idle Gap</th>
                    <th>Days Worked</th>
                </tr>
            </thead>
            <tbody>
                {generate_comparison_table()}
            </tbody>
        </table>
        
        <div class="insight-box">
            <h4>🏆 Performance Insights</h4>
            <ul>
                <li><strong>Highest Volume:</strong> Ext {comparison_stats[0]['ext']} with {comparison_stats[0]['total_calls']} calls ({comparison_stats[0]['calls_per_day']:.1f}/day)</li>
                <li><strong>Lowest Volume:</strong> Ext {comparison_stats[-1]['ext']} with {comparison_stats[-1]['total_calls']} calls ({comparison_stats[-1]['calls_per_day']:.1f}/day)</li>
                <li><strong>Best Answer Rate:</strong> Ext {max(comparison_stats, key=lambda x: x['answer_rate'])['ext']} at {max(comparison_stats, key=lambda x: x['answer_rate'])['answer_rate']:.1f}%</li>
                <li><strong>Longest Avg Call:</strong> Ext {max(comparison_stats, key=lambda x: x['avg_duration'])['ext']} at {format_time(max(comparison_stats, key=lambda x: x['avg_duration'])['avg_duration'])}</li>
                <li><strong>Shortest Avg Idle:</strong> Ext {min(comparison_stats, key=lambda x: x['avg_idle'])['ext']} at {format_time(min(comparison_stats, key=lambda x: x['avg_idle'])['avg_idle'])}</li>
            </ul>
        </div>
    </div>
</div>
"""

# Generate tab content HTML
tab_content_html = [comparison_html]
for ext in sorted(agent_data.keys()):
    data = agent_data[ext]
    
    tab_content_html.append(f"""
    <div id="ext{ext}" class="tab-content">
        <div class="section">
            <h2>📈 Hour-by-Hour Breakdown - Ext {ext}</h2>
            <div class="warning">
                <strong>📊 View:</strong> Each day shown separately with hour-by-hour breakdown (9am-5pm)<br>
                <strong>Idle Time:</strong> Gaps between consecutive calls within the same hour
            </div>
            <table>
                <thead>
                    <tr>
                        <th>Hour</th>
                        <th>Calls</th>
                        <th>Answered</th>
                        <th>Missed</th>
                        <th>Answer %</th>
                        <th>Total Talk</th>
                        <th>Avg Talk</th>
                        <th>Total Idle</th>
                        <th>Avg Idle</th>
                        <th>Max Idle</th>
                        <th>Gaps</th>
                        <th>Rating</th>
                    </tr>
                </thead>
                <tbody>
                    {generate_hourly_table(data['hourly'])}
                </tbody>
            </table>
        </div>
        
        <div class="section">
            <h2>📅 Day-by-Day Breakdown - Ext {ext}</h2>
            <div class="warning">
                <strong>⏰ Working Hours:</strong> 9:00am to last call time (dynamic per day)<br>
                <strong>Productive %:</strong> Call time / Working time | <strong>Idle %:</strong> Unaccounted time / Working time
            </div>
            <table>
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Day</th>
                        <th>Hours</th>
                        <th>Calls</th>
                        <th>Answered</th>
                        <th>Missed</th>
                        <th>Answer %</th>
                        <th>Total Talk</th>
                        <th>Avg Talk</th>
                        <th>Unaccounted Time</th>
                        <th>Avg Gap</th>
                        <th>Max Gap</th>
                        <th>Productive %</th>
                        <th>Idle %</th>
                        <th>Calls/Hr</th>
                        <th>Rating</th>
                    </tr>
                </thead>
                <tbody>
                    {generate_daily_table(data['daily'])}
                </tbody>
            </table>
        </div>
    </div>
    """)

# Generate full HTML
html = f"""
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>All Agents Performance Report</title>
    <style>
        * {{
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }}
        
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: #f5f5f5;
            padding: 20px;
        }}
        
        .container {{
            max-width: 1400px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            overflow: hidden;
        }}
        
        .header {{
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }}
        
        .header h1 {{
            font-size: 32px;
            margin-bottom: 10px;
        }}
        
        .header p {{
            font-size: 16px;
            opacity: 0.9;
        }}
        
        .tabs {{
            display: flex;
            flex-wrap: wrap;
            background: #f8f9fa;
            border-bottom: 2px solid #e0e0e0;
        }}
        
        .tab {{
            padding: 15px 20px;
            text-align: center;
            cursor: pointer;
            background: #f8f9fa;
            border: none;
            font-size: 16px;
            font-weight: 600;
            transition: all 0.3s;
            border-right: 1px solid #e0e0e0;
        }}
        
        .tab.active {{
            background: white;
            color: #667eea;
            border-bottom: 3px solid #667eea;
        }}
        
        .tab:hover:not(.active) {{
            background: #e9ecef;
        }}
        
        .tab-content {{
            display: none;
            padding: 30px;
        }}
        
        .tab-content.active {{
            display: block;
        }}
        
        .section {{
            margin-bottom: 40px;
        }}
        
        .section h2 {{
            font-size: 24px;
            margin-bottom: 20px;
            color: #333;
            border-bottom: 2px solid #667eea;
            padding-bottom: 10px;
        }}
        
        table {{
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
            font-size: 14px;
        }}
        
        th {{
            background: #667eea;
            color: white;
            padding: 12px 8px;
            text-align: left;
            font-weight: 600;
            position: sticky;
            top: 0;
            z-index: 10;
        }}
        
        td {{
            padding: 10px 8px;
            border-bottom: 1px solid #e0e0e0;
        }}
        
        tr:hover {{
            background: #f8f9fa;
        }}
        
        tr.excellent {{
            background: #d4edda;
        }}
        
        tr.good {{
            background: #fff3cd;
        }}
        
        tr.average {{
            background: #fff;
        }}
        
        tr.poor {{
            background: #f8d7da;
        }}
        
        .badge {{
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 600;
        }}
        
        .badge.excellent {{
            background: #28a745;
            color: white;
        }}
        
        .badge.good {{
            background: #ffc107;
            color: #333;
        }}
        
        .badge.average {{
            background: #6c757d;
            color: white;
        }}
        
        .badge.poor {{
            background: #dc3545;
            color: white;
        }}
        
        .warning {{
            background: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
        }}
        
        .warning strong {{
            color: #856404;
        }}
        
        .stats-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin: 30px 0;
        }}
        
        .stat-card {{
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 25px;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            text-align: center;
        }}
        
        .stat-label {{
            font-size: 12px;
            opacity: 0.9;
            margin-bottom: 10px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }}
        
        .stat-value {{
            font-size: 32px;
            font-weight: 700;
        }}
        
        .insight-box {{
            background: #f8f9fa;
            border-left: 4px solid #667eea;
            padding: 20px;
            margin-top: 30px;
            border-radius: 8px;
        }}
        
        .insight-box h4 {{
            margin-bottom: 15px;
            color: #667eea;
        }}
        
        .insight-box ul {{
            list-style: none;
        }}
        
        .insight-box li {{
            padding: 8px 0;
            border-bottom: 1px solid #e0e0e0;
        }}
        
        .insight-box li:last-child {{
            border-bottom: none;
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📞 All Agents Performance Report</h1>
            <p>Detailed hour-by-hour and day-by-day analysis for all extensions</p>
            <p style="font-size: 14px; margin-top: 10px;">Working hours: 9am to last call time (dynamic)</p>
        </div>
        
        <div class="tabs">
            {''.join(tabs_html)}
        </div>
        
        {''.join(tab_content_html)}
    </div>
    
    <script>
        function showTab(tabName) {{
            // Hide all tab contents
            const contents = document.querySelectorAll('.tab-content');
            contents.forEach(content => content.classList.remove('active'));
            
            // Remove active class from all tabs
            const tabs = document.querySelectorAll('.tab');
            tabs.forEach(tab => tab.classList.remove('active'));
            
            // Show selected tab content
            document.getElementById(tabName).classList.add('active');
            
            // Add active class to clicked tab
            event.target.classList.add('active');
        }}
        
        // Comparison tab is already active by default
    </script>
</body>
</html>
"""

# Save HTML
output_path = '/Users/danielyoung/Desktop/PRODUCTION_READY_ULTIMATE_AI_WORKFLOW_SYSTEM/projects/test_project/_DEV/STREAMS/appliance_insurance_form/OUTPUTS/ALL_AGENTS_REPORT.html'
downloads_path = '/Users/danielyoung/Downloads/ALL_AGENTS_REPORT.html'

with open(output_path, 'w') as f:
    f.write(html)

with open(downloads_path, 'w') as f:
    f.write(html)

print("\n✅ All Agents Performance Report Generated!")
print(f"   📄 {output_path}")
print(f"   📄 {downloads_path}")
print(f"\n📊 Report includes {len(agent_data)} agents with tabs for each")
print("   - Hour-by-hour breakdown per day")
print("   - Day-by-day summary")
print("   - Dynamic end time based on last call")
print("   - Start time fixed at 9am")
