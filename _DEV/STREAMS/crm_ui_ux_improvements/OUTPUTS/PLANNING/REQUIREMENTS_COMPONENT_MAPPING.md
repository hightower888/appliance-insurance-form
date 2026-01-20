---
title: "Requirements to Component Mapping"
created: 2026-01-19
workflow: PLANNING_STANDARD_AI
step: planning-step-1
status: Complete
---

# Requirements to Component Mapping

**Stream:** crm_ui_ux_improvements  
**Date:** 2026-01-19  
**Purpose:** Map 10 requirements to components, services, and modules

---

## Mapping Overview

### Existing Architecture
- **Components:** 11 components (sidebar, filter-component, bulk-selection, etc.)
- **Services:** 8 services (export-service, import-service, enhanced-logger, etc.)
- **Modules:** 2 modules (crm-state, view-controller)
- **Base:** Firebase Realtime Database, Chart.js

---

## Component Mapping by Requirement

### REQ-DASH-001: Advanced Dashboard with Customizable Widgets

**New Components:**
- `components/dashboard-widget.js` - Base widget class
- `components/widget-metric.js` - Metric/KPI widget
- `components/widget-chart.js` - Chart widget wrapper
- `components/widget-list.js` - List widget
- `components/widget-activity.js` - Activity feed widget
- `components/dashboard-builder.js` - Drag-and-drop dashboard builder
- `components/widget-library.js` - Widget library/selector

**New Services:**
- `services/dashboard-service.js` - Dashboard CRUD, configuration management
- `services/widget-service.js` - Widget data fetching, real-time updates

**Modified Components:**
- `components/sidebar.js` - Add dashboard management

**Dependencies:**
- Chart.js (existing)
- Drag-and-drop library (new: SortableJS or similar)

---

### REQ-VIZ-001: Interactive Data Visualizations

**New Components:**
- `components/chart-interactive.js` - Interactive chart wrapper
- `components/chart-drilldown.js` - Drill-down functionality
- `components/chart-filter.js` - Chart filtering UI
- `components/chart-comparison.js` - Comparison mode UI

**New Services:**
- `services/chart-service.js` - Chart data processing, drill-down logic
- `services/visualization-service.js` - Advanced chart types (heatmap, funnel, etc.)

**Modified Components:**
- `src/crm-reports.js` - Enhance existing chart functions

**Dependencies:**
- Chart.js (existing, enhance)
- Additional chart libraries for advanced types (new)

---

### REQ-FILT-001: Advanced Filtering & Search System

**New Components:**
- `components/filter-builder.js` - Visual filter builder UI
- `components/filter-presets.js` - Saved filter presets manager
- `components/natural-language-search.js` - NLP search interface

**New Services:**
- `services/filter-service.js` - Advanced filter logic, AND/OR processing
- `services/search-service.js` - Natural language parsing, global search

**Modified Components:**
- `components/filter-component.js` - Enhance existing (add advanced features)

**Dependencies:**
- Existing filter-component.js (enhance)
- NLP library (new: optional, for natural language)

---

### REQ-REALTIME-001: Real-Time Updates & Live Data

**New Services:**
- `services/realtime-service.js` - WebSocket/Firebase listener management
- `services/notification-service.js` - Push notifications
- `services/activity-feed-service.js` - Activity stream management

**New Components:**
- `components/activity-feed.js` - Activity feed UI
- `components/notification-center.js` - Notification UI
- `components/live-indicator.js` - Real-time status indicator

**Modified Files:**
- `src/crm.js` - Add real-time listeners
- `src/crm-reports.js` - Real-time dashboard updates

**Dependencies:**
- Firebase Realtime Database (existing, enhance usage)

---

### REQ-VIEWS-001: Advanced View Types

**New Components:**
- `components/kanban-board.js` - Kanban board view
- `components/timeline-view.js` - Timeline view
- `components/card-view.js` - Card view
- `components/calendar-view.js` - Calendar view
- `components/map-view.js` - Map view
- `components/view-switcher.js` - View type selector

**New Services:**
- `services/view-service.js` - View configuration, view data transformation

**Modified Modules:**
- `modules/view-controller.js` - Enhance base class, add view implementations

**Dependencies:**
- view-controller.js (existing base class)
- Map library (new: Leaflet or Google Maps)

---

### REQ-AI-001: Predictive Analytics & AI Insights

**New Services:**
- `services/analytics-service.js` - Predictive analytics calculations
- `services/ai-service.js` - AI/ML integration, lead scoring
- `services/forecasting-service.js` - Revenue forecasting

**New Components:**
- `components/ai-insights-panel.js` - AI insights display
- `components/lead-scoring.js` - Lead score display
- `components/prediction-card.js` - Prediction widgets

**Dependencies:**
- AI/ML service (new: external API or built-in)

---

### REQ-AUTO-001: Workflow Automation & Task Management

**New Components:**
- `components/workflow-builder.js` - Visual workflow builder
- `components/task-manager.js` - Task list and management
- `components/rule-editor.js` - Rule creation UI

**New Services:**
- `services/workflow-service.js` - Workflow execution engine
- `services/task-service.js` - Task CRUD, reminders
- `services/automation-service.js` - Automation rule processing

**Dependencies:**
- None (new feature)

---

### REQ-REPORT-001: Advanced Reporting & Custom Report Builder

**New Components:**
- `components/report-builder.js` - Drag-and-drop report builder
- `components/report-templates.js` - Template library
- `components/report-scheduler.js` - Report scheduling UI

**New Services:**
- `services/report-service.js` - Report CRUD, template management
- `services/report-scheduler-service.js` - Scheduled report execution

**Modified Services:**
- `services/export-service.js` - Enhance for report formats (PDF, Excel, PPT)

**Dependencies:**
- export-service.js (existing, enhance)
- PDF generation library (new)
- Excel generation library (new)

---

### REQ-MOBILE-001: Mobile-First Responsive Design

**New Components:**
- `components/mobile-navigation.js` - Bottom navigation bar
- `components/mobile-fab.js` - Floating action button
- `components/mobile-sheet.js` - Bottom sheet modal

**New Services:**
- `services/pwa-service.js` - PWA features, service worker management

**Modified Files:**
- `src/styles.css` - Mobile-first responsive styles
- All components - Mobile optimization

**Dependencies:**
- Service Worker API (browser)
- PWA manifest

---

### REQ-AI-ASSIST-001: AI Assistant & Natural Language Interface

**New Components:**
- `components/ai-assistant.js` - Chat assistant UI
- `components/nlp-query.js` - Natural language query interface

**New Services:**
- `services/ai-assistant-service.js` - AI chat, query processing
- `services/nlp-service.js` - Natural language parsing

**Dependencies:**
- AI/NLP service (new: external API or built-in)

---

## Summary

### New Components: 35+
### New Services: 15+
### Modified Components: 5+
### Modified Services: 2+

### Total New Files: ~50+
### Total Modified Files: ~10+

---

**Mapping Complete**  
**Ready for Task Breakdown**
