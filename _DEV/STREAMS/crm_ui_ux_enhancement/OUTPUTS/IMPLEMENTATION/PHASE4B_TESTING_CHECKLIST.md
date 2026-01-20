# Phase 4B Testing Checklist

## Testing Requirements

### 1. Lead Scoring
- [ ] Verify lead scores calculate correctly (0-100)
- [ ] Check grade assignment (A-F)
- [ ] Verify score breakdown display
- [ ] Test recommendations generation
- [ ] Verify top leads filtering

### 2. Churn Prediction
- [ ] Verify churn risk scores (0-100)
- [ ] Check risk level assignment (high/medium/low/minimal)
- [ ] Verify risk factors calculation
- [ ] Test high-risk lead filtering
- [ ] Check recommendations display

### 3. Automated Insights
- [ ] Verify insights generation from lead data
- [ ] Check insight prioritization
- [ ] Test actionable insights
- [ ] Verify auto-refresh functionality
- [ ] Check insights panel display

### 4. Workflow Automation
- [ ] Test field_change triggers
- [ ] Test time_based triggers
- [ ] Test score_threshold triggers
- [ ] Verify workflow actions execute
- [ ] Test workflow CRUD operations
- [ ] Check workflow persistence

### 5. Visual Workflow Designer
- [ ] Test workflow creation
- [ ] Test workflow editing
- [ ] Test workflow enable/disable
- [ ] Test workflow deletion
- [ ] Verify trigger configuration
- [ ] Verify action configuration

### 6. Advanced Reporting Dashboard
- [ ] Verify KPI cards display
- [ ] Check Chart.js visualizations render
- [ ] Test dashboard refresh
- [ ] Verify insights display
- [ ] Check predictions section

### 7. Table View Integration
- [ ] Verify score column displays
- [ ] Verify churn risk column displays
- [ ] Check color coding
- [ ] Test column sorting (if applicable)

### 8. Lead Detail View
- [ ] Verify score section displays
- [ ] Verify churn risk section displays
- [ ] Check breakdown details
- [ ] Verify recommendations display

### 9. Filtering
- [ ] Test score filter (high/medium-high/medium/low)
- [ ] Test risk filter (high/medium/low/minimal)
- [ ] Verify filters work in combination
- [ ] Check filter visibility based on service availability

### 10. Export with Analytics
- [ ] Verify CSV export includes scores
- [ ] Verify CSV export includes churn risk
- [ ] Test JSON export with analytics
- [ ] Verify includeAnalytics option

### 11. Integration
- [ ] Verify all services load correctly
- [ ] Check tab navigation works
- [ ] Verify workflow triggers fire on lead updates
- [ ] Check time-based triggers run hourly
- [ ] Verify insights panel updates on lead changes

## Known Issues / Notes
- Score and risk filters are hidden by default, shown when services available
- Workflow automation requires services to be loaded
- Export analytics enhancement is optional (includeAnalytics flag)
