#!/usr/bin/env python3
"""
Generate comprehensive HTML report with tabs for each agent
Hour-by-hour and day-by-day breakdown with detailed analysis
"""

import pandas as pd
from datetime import datetime, timedelta
from collections import defaultdict
import json

# Load the data
csv_path = '/Users/danielyoung/Downloads/Untitled spreadsheet - call-data (1) (2).csv'
df = pd.read_csv(csv_path)

# Combine Date and Time columns
df['datetime'] = pd.to_datetime(df['Date'] + ' ' + df['Time'], format='%d %b %Y %H:%M:%S', errors='coerce')
df['date'] = df['datetime'].dt.date
df['hour'] = df['datetime'].dt.hour
df['day_of_week'] = df['Day Of Week']

# Get extension from 'From' column (e.g., "Ext 1001")
df['extension'] = df['From'].str.extract(r'Ext (\d+)').astype(float)

# Duration is already in seconds in 'Duration (Seconds)' column
df['duration_seconds'] = pd.to_numeric(df['Duration (Seconds)'], errors='coerce').fillna(0)

# Filter for extensions 1001 and 1002
df_1001 = df[df['extension'] == 1001].sort_values('datetime').reset_index(drop=True)
df_1002 = df[df['extension'] == 1002].sort_values('datetime').reset_index(drop=True)

def calculate_idle_times(agent_df):
    """Calculate idle time between consecutive calls on same day
    Includes 10 seconds ring time per call"""
    idle_data = []
    
    for i in range(len(agent_df) - 1):
        current = agent_df.iloc[i]
        next_call = agent_df.iloc[i + 1]
        
        # Skip if different days
        if current['date'] != next_call['date']:
            continue
        
        # End of current call + 10 seconds ring time
        end_time_with_ring = current['datetime'] + timedelta(seconds=current['duration_seconds'] + 10)
        # Start of next call
        start_next = next_call['datetime']
        
        # Idle time (only after call duration + ring time)
        idle_seconds = (start_next - end_time_with_ring).total_seconds()
        
        if idle_seconds > 0:
            idle_data.append({
                'datetime': current['datetime'],
                'date': current['date'],
                'hour': current['hour'],
                'idle_seconds': idle_seconds,
                'idle_minutes': idle_seconds / 60
            })
    
    return pd.DataFrame(idle_data)

# Calculate idle times
idle_1001 = calculate_idle_times(df_1001)
idle_1002 = calculate_idle_times(df_1002)

def analyze_by_hour(agent_df, idle_df, agent_name):
    """Detailed hour-by-hour analysis - per day"""
    hourly_stats = []
    
    # Group by date first, then analyze each hour within that day
    for date in sorted(agent_df['date'].unique()):
        day_calls = agent_df[agent_df['date'] == date].sort_values('datetime')
        
        # Analyze each hour of this specific day
        for hour in range(9, 18):  # 9am to 5pm
            hour_calls = day_calls[day_calls['hour'] == hour]
            
            if len(hour_calls) == 0:
                continue
            
            answered = len(hour_calls[hour_calls['Call Result'] == 'Answered'])
            unanswered = len(hour_calls[hour_calls['Call Result'] != 'Answered'])
            total_duration = hour_calls['duration_seconds'].sum()
            avg_duration = total_duration / len(hour_calls) if len(hour_calls) > 0 else 0
            
            # Calculate idle time between calls within this specific hour
            # Account for 10 seconds ring time per call
            total_idle = 0
            idle_periods = []
            
            for i in range(len(hour_calls) - 1):
                current = hour_calls.iloc[i]
                next_call = hour_calls.iloc[i + 1]
                
                # Call starts at current['datetime']
                # Add call duration + 10 seconds ring time
                call_end_with_ring = current['datetime'] + timedelta(seconds=current['duration_seconds'] + 10)
                # Start of next call
                next_start = next_call['datetime']
                
                # Only count if next call is still in the same hour
                if next_start.hour == hour:
                    idle_seconds = (next_start - call_end_with_ring).total_seconds()
                    if idle_seconds > 0:
                        total_idle += idle_seconds
                        idle_periods.append(idle_seconds)
            
            avg_idle = total_idle / len(idle_periods) if idle_periods else 0
            max_idle = max(idle_periods) if idle_periods else 0
            
            # Performance rating
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

def analyze_by_day(agent_df, idle_df, agent_name):
    """Detailed day-by-day analysis"""
    daily_stats = []
    
    for date in sorted(agent_df['date'].unique()):
        day_calls = agent_df[agent_df['date'] == date]
        day_idle = idle_df[idle_df['date'] == date]
        
        answered = len(day_calls[day_calls['Call Result'] == 'Answered'])
        unanswered = len(day_calls[day_calls['Call Result'] != 'Answered'])
        total_duration = day_calls['duration_seconds'].sum()
        avg_duration = total_duration / len(day_calls) if len(day_calls) > 0 else 0
        
        total_idle = day_idle['idle_seconds'].sum() if len(day_idle) > 0 else 0
        avg_idle = total_idle / len(day_idle) if len(day_idle) > 0 else 0
        max_idle = day_idle['idle_seconds'].max() if len(day_idle) > 0 else 0
        
        # Expected working hours: 9am-5pm (8 hours) minus 30 min lunch = 7.5 hours = 27000 seconds
        expected_working_seconds = 7.5 * 3600
        
        # Actual time on calls
        actual_call_time = total_duration
        
        # Calculate total unaccounted time (expected work time - call time)
        unaccounted_time = expected_working_seconds - actual_call_time
        
        # Working hours (actual span)
        first_call = day_calls['datetime'].min()
        last_call = day_calls['datetime'].max()
        last_call_end = last_call + timedelta(seconds=day_calls[day_calls['datetime'] == last_call]['duration_seconds'].iloc[0])
        actual_span = (last_call_end - first_call).total_seconds()
        
        # Productivity based on 7.5 hour work day
        productive_pct = (total_duration / expected_working_seconds * 100) if expected_working_seconds > 0 else 0
        idle_pct = (unaccounted_time / expected_working_seconds * 100) if expected_working_seconds > 0 else 0
        
        # Performance rating based on 7.5 hour day
        calls_per_hour = len(day_calls) / 7.5
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
        
        # Check if they started late or left early
        start_time = first_call.hour + first_call.minute/60
        end_time = last_call_end.hour + last_call_end.minute/60
        late_start = start_time > 9.25  # More than 15 mins late
        early_finish = end_time < 16.75  # Left more than 15 mins early
        
        daily_stats.append({
            'date': date.strftime('%Y-%m-%d'),
            'day_of_week': day_calls['day_of_week'].iloc[0],
            'total_calls': len(day_calls),
            'answered': answered,
            'unanswered': unanswered,
            'answer_rate': (answered / len(day_calls) * 100) if len(day_calls) > 0 else 0,
            'total_duration': total_duration,
            'avg_duration': avg_duration,
            'expected_working_seconds': expected_working_seconds,
            'unaccounted_time': unaccounted_time,
            'total_idle': total_idle,
            'avg_idle': avg_idle,
            'max_idle': max_idle,
            'actual_span': actual_span,
            'productive_pct': productive_pct,
            'idle_pct': idle_pct,
            'calls_per_hour': calls_per_hour,
            'first_call': first_call.strftime('%H:%M'),
            'last_call': last_call_end.strftime('%H:%M'),
            'late_start': late_start,
            'early_finish': early_finish,
            'performance': performance,
            'perf_class': perf_class
        })
    
    return daily_stats

# Generate analyses
hourly_1001 = analyze_by_hour(df_1001, idle_1001, '1001')
hourly_1002 = analyze_by_hour(df_1002, idle_1002, '1002')
daily_1001 = analyze_by_day(df_1001, idle_1001, '1001')
daily_1002 = analyze_by_day(df_1002, idle_1002, '1002')

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

def generate_hourly_table(hourly_stats, agent_name):
    """Generate HTML table for hourly breakdown"""
    rows = []
    current_date = None
    
    for stat in hourly_stats:
        # Add date separator row when date changes
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

def generate_daily_table(daily_stats, agent_name):
    """Generate HTML table for daily breakdown"""
    rows = []
    for stat in daily_stats:
        # Add warning flags
        time_warning = ''
        if stat['late_start']:
            time_warning += '⚠️ Late Start '
        if stat['early_finish']:
            time_warning += '⚠️ Early Finish'
        
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

def generate_comparison_section():
    """Generate side-by-side comparison"""
    total_1001 = len(df_1001)
    total_1002 = len(df_1002)
    
    avg_idle_1001 = idle_1001['idle_seconds'].mean() if len(idle_1001) > 0 else 0
    avg_idle_1002 = idle_1002['idle_seconds'].mean() if len(idle_1002) > 0 else 0
    
    avg_duration_1001 = df_1001['duration_seconds'].mean()
    avg_duration_1002 = df_1002['duration_seconds'].mean()
    
    # Calculate total time on calls
    total_call_time_1001 = df_1001['duration_seconds'].sum()
    total_call_time_1002 = df_1002['duration_seconds'].sum()
    
    # Calculate number of working days
    days_1001 = len(df_1001['date'].unique())
    days_1002 = len(df_1002['date'].unique())
    
    # Expected working time per day = 7.5 hours
    expected_per_day = 7.5 * 3600
    
    # Total expected vs actual
    expected_1001 = days_1001 * expected_per_day
    expected_1002 = days_1002 * expected_per_day
    
    productive_1001 = (total_call_time_1001 / expected_1001 * 100) if expected_1001 > 0 else 0
    productive_1002 = (total_call_time_1002 / expected_1002 * 100) if expected_1002 > 0 else 0
    
    return f"""
    <div class="warning">
        <strong>⏰ Working Hours:</strong> 9:00am - 5:00pm (7.5 hours per day, accounting for 30-min lunch break)<br>
        <strong>📊 Productivity:</strong> Time spent on calls / Expected working time (7.5 hrs/day)
    </div>
    
    <div class="comparison-grid">
        <div class="comparison-card">
            <h3>Ext 1001</h3>
            <div class="metric">
                <div class="metric-label">Total Calls</div>
                <div class="metric-value">{total_1001}</div>
            </div>
            <div class="metric">
                <div class="metric-label">Avg Call Duration</div>
                <div class="metric-value">{format_time(avg_duration_1001)}</div>
            </div>
            <div class="metric">
                <div class="metric-label">Calls Per Day</div>
                <div class="metric-value">{total_1001 / days_1001:.1f}</div>
            </div>
            <div class="metric">
                <div class="metric-label">Overall Productivity</div>
                <div class="metric-value {'poor' if productive_1001 < 25 else 'good'}">{productive_1001:.1f}%</div>
            </div>
            <div class="metric">
                <div class="metric-label">Avg Gap Between Calls</div>
                <div class="metric-value {'poor' if avg_idle_1001 > 600 else 'good'}">{format_time(avg_idle_1001)}</div>
            </div>
        </div>
        
        <div class="comparison-card">
            <h3>Ext 1002</h3>
            <div class="metric">
                <div class="metric-label">Total Calls</div>
                <div class="metric-value">{total_1002}</div>
            </div>
            <div class="metric">
                <div class="metric-label">Avg Call Duration</div>
                <div class="metric-value">{format_time(avg_duration_1002)}</div>
            </div>
            <div class="metric">
                <div class="metric-label">Calls Per Day</div>
                <div class="metric-value">{total_1002 / days_1002:.1f}</div>
            </div>
            <div class="metric">
                <div class="metric-label">Overall Productivity</div>
                <div class="metric-value {'poor' if productive_1002 < 25 else 'good'}">{productive_1002:.1f}%</div>
            </div>
            <div class="metric">
                <div class="metric-label">Avg Gap Between Calls</div>
                <div class="metric-value {'poor' if avg_idle_1002 > 600 else 'good'}">{format_time(avg_idle_1002)}</div>
            </div>
        </div>
    </div>
    
    <div class="insight-box">
        <h4>📊 Head-to-Head Analysis (Based on 9am-5pm Schedule)</h4>
        <ul>
            <li><strong>Call Volume:</strong> Ext {1002 if total_1002 > total_1001 else 1001} handled {abs(total_1002 - total_1001)} more calls ({max(total_1002, total_1001)} vs {min(total_1002, total_1001)})</li>
            <li><strong>Daily Average:</strong> Ext {1002 if total_1002/days_1002 > total_1001/days_1001 else 1001} averages {max(total_1002/days_1002, total_1001/days_1001):.1f} calls/day vs {min(total_1002/days_1002, total_1001/days_1001):.1f} calls/day</li>
            <li><strong>Productivity:</strong> Ext {1001 if productive_1001 > productive_1002 else 1002} is more productive ({max(productive_1001, productive_1002):.1f}% vs {min(productive_1001, productive_1002):.1f}% of work time on calls)</li>
            <li><strong>Efficiency:</strong> Ext {1001 if avg_idle_1001 < avg_idle_1002 else 1002} has shorter gaps between calls ({format_time(min(avg_idle_1001, avg_idle_1002))} vs {format_time(max(avg_idle_1001, avg_idle_1002))} avg)</li>
            <li><strong>Call Length:</strong> Ext {1001 if avg_duration_1001 > avg_duration_1002 else 1002} spends more time per call ({format_time(max(avg_duration_1001, avg_duration_1002))} vs {format_time(min(avg_duration_1001, avg_duration_1002))} avg)</li>
        </ul>
    </div>
    """

# Generate full HTML
html = f"""
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Comprehensive Agent Performance Report</title>
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
            background: #f8f9fa;
            border-bottom: 2px solid #e0e0e0;
        }}
        
        .tab {{
            flex: 1;
            padding: 20px;
            text-align: center;
            cursor: pointer;
            background: #f8f9fa;
            border: none;
            font-size: 18px;
            font-weight: 600;
            transition: all 0.3s;
            border-right: 1px solid #e0e0e0;
        }}
        
        .tab:last-child {{
            border-right: none;
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
        
        .comparison-grid {{
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 30px;
        }}
        
        .comparison-card {{
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 25px;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }}
        
        .comparison-card h3 {{
            font-size: 24px;
            margin-bottom: 20px;
            text-align: center;
        }}
        
        .metric {{
            background: rgba(255,255,255,0.15);
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 12px;
        }}
        
        .metric-label {{
            font-size: 12px;
            opacity: 0.9;
            margin-bottom: 5px;
        }}
        
        .metric-value {{
            font-size: 28px;
            font-weight: 700;
        }}
        
        .metric-value.poor {{
            color: #ff6b6b;
        }}
        
        .metric-value.good {{
            color: #51cf66;
        }}
        
        .insight-box {{
            background: #f8f9fa;
            border-left: 4px solid #667eea;
            padding: 20px;
            margin-top: 20px;
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
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📞 Comprehensive Agent Performance Report</h1>
            <p>Detailed hour-by-hour and day-by-day analysis for Extensions 1001 & 1002</p>
        </div>
        
        <div class="tabs">
            <button class="tab active" onclick="showTab('comparison')">📊 Comparison</button>
            <button class="tab" onclick="showTab('ext1001')">👤 Ext 1001</button>
            <button class="tab" onclick="showTab('ext1002')">👤 Ext 1002</button>
        </div>
        
        <div id="comparison" class="tab-content active">
            <div class="section">
                <h2>Head-to-Head Comparison</h2>
                {generate_comparison_section()}
            </div>
        </div>
        
        <div id="ext1001" class="tab-content">
            <div class="section">
                <h2>📈 Hour-by-Hour Breakdown - Ext 1001</h2>
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
                        {generate_hourly_table(hourly_1001, '1001')}
                    </tbody>
                </table>
            </div>
            
            <div class="section">
                <h2>📅 Day-by-Day Breakdown - Ext 1001</h2>
                <div class="warning">
                    <strong>⏰ Expected Working Hours:</strong> 9:00am - 5:00pm (7.5 hours with 30-min lunch break)<br>
                    <strong>Productive %:</strong> Call time / 7.5 hours | <strong>Idle %:</strong> Unaccounted time / 7.5 hours
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
                        {generate_daily_table(daily_1001, '1001')}
                    </tbody>
                </table>
            </div>
        </div>
        
        <div id="ext1002" class="tab-content">
            <div class="section">
                <h2>📈 Hour-by-Hour Breakdown - Ext 1002</h2>
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
                        {generate_hourly_table(hourly_1002, '1002')}
                    </tbody>
                </table>
            </div>
            
            <div class="section">
                <h2>📅 Day-by-Day Breakdown - Ext 1002</h2>
                <div class="warning">
                    <strong>⏰ Expected Working Hours:</strong> 9:00am - 5:00pm (7.5 hours with 30-min lunch break)<br>
                    <strong>Productive %:</strong> Call time / 7.5 hours | <strong>Idle %:</strong> Unaccounted time / 7.5 hours
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
                        {generate_daily_table(daily_1002, '1002')}
                    </tbody>
                </table>
            </div>
        </div>
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
    </script>
</body>
</html>
"""

# Save HTML
output_path = '/Users/danielyoung/Desktop/PRODUCTION_READY_ULTIMATE_AI_WORKFLOW_SYSTEM/projects/test_project/_DEV/STREAMS/appliance_insurance_form/OUTPUTS/AGENT_PERFORMANCE_REPORT.html'
downloads_path = '/Users/danielyoung/Downloads/AGENT_PERFORMANCE_REPORT.html'

with open(output_path, 'w') as f:
    f.write(html)

with open(downloads_path, 'w') as f:
    f.write(html)

print("📊 Comprehensive Agent Performance Report Generated!")
print(f"   📄 {output_path}")
print(f"   📄 {downloads_path}")
print("\n✅ Features:")
print("   - Tabbed interface (Comparison, Ext 1001, Ext 1002)")
print("   - Hour-by-hour breakdown with performance ratings")
print("   - Day-by-day breakdown with productivity metrics")
print("   - Idle time analysis (same day only)")
print("   - Visual performance indicators")
print("   - Head-to-head comparison")
