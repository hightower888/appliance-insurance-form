# Page Map and Navigation Flow

**Date:** 2026-01-20  
**Stream:** crm_elite_ui_ux_redesign  
**Workflow:** DISCOVERY_ASSESSMENT  
**Status:** ✅ Complete

## System Pages

### 1. Login Page (`login.html`)
- **Route:** `/` (root)
- **Purpose:** Authentication entry point
- **Navigation:** None (redirects by role after login)
- **Redirects:**
  - Admin → `/admin`
  - Processor → `/processor`
  - User → `/form`

### 2. CRM System (`crm.html`)
- **Route:** `/crm`
- **Purpose:** Lead and customer management
- **Navigation:**
  - Sidebar navigation (unique to CRM)
  - Header links: Form, Admin, Processor, Home
- **Tabs:** 13 tabs (Leads, Customers, Reports, Kanban, Timeline, Cards, Report Builder, Saved Views, Scheduled Reports, Workflows, Analytics, Audit Log)
- **Features:** Lead management, customer tracking, analytics, workflows

### 3. Admin Panel (`admin.html`)
- **Route:** `/admin`
- **Purpose:** User management, system configuration
- **Navigation:**
  - Header links: CRM, Form, Processor, Home
  - No sidebar
- **Tabs:** 7 tabs (Users, Sales, Form Fields, Brands, SMS, Documents, Security Logs)
- **Features:** User CRUD, sales viewing, form field management, brand management

### 4. Appliance Form (`appliance_form.html`)
- **Route:** `/form`
- **Purpose:** Customer application form
- **Navigation:**
  - Header links: CRM, Admin, Processor, Home
  - No sidebar
- **Features:** Dynamic form fields, appliance entry, submission

### 5. Processor Dashboard (`processor.html`)
- **Route:** `/processor`
- **Purpose:** Sales data processing and export
- **Navigation:**
  - Header links: CRM, Form, Admin, Home
  - No sidebar
- **Features:** Sales viewing, CSV export, field mapping, profile management

## Navigation Flow Diagram

```
┌─────────────┐
│   Login     │
│   (/)       │
└──────┬──────┘
       │
       ├─── Admin Role ────┐
       │                    │
       ├─── Processor ──────┤
       │                    │
       └─── User ───────────┤
                            │
        ┌───────────────────┴───────────────────┐
        │                                         │
┌───────▼────────┐                    ┌─────────▼──────────┐
│  Admin Panel   │                    │  Processor Dashboard│
│  (/admin)      │                    │  (/processor)       │
│                │                    │                     │
│  ┌──────────┐  │                    │  ┌──────────────┐  │
│  │ Users    │  │                    │  │ Sales View  │  │
│  │ Sales    │  │                    │  │ CSV Export  │  │
│  │ Fields   │  │                    │  │ Mappings    │  │
│  │ Brands   │  │                    │  └──────────────┘  │
│  │ SMS      │  │                    └────────────────────┘
│  │ Docs     │  │
│  │ Security │  │
│  └──────────┘  │
└───────┬────────┘
        │
        │ (All roles can navigate)
        │
┌───────▼──────────────────────────────────────────┐
│  CRM System                                      │
│  (/crm)                                          │
│                                                  │
│  ┌──────────────────────────────────────────┐   │
│  │ Sidebar Navigation                      │   │
│  │ - Dashboard                             │   │
│  │ - Leads                                 │   │
│  │ - Customers                             │   │
│  │ - Reports                               │   │
│  │ - Views (Table/Kanban/Timeline/Card)    │   │
│  │ - Workflows                             │   │
│  │ - Analytics                             │   │
│  │ - Audit                                 │   │
│  └──────────────────────────────────────────┘   │
│                                                  │
│  ┌──────────────────────────────────────────┐   │
│  │ Main Content Area                        │   │
│  │ - Tab Navigation (13 tabs)               │   │
│  │ - Content Panels                         │   │
│  └──────────────────────────────────────────┘   │
└───────┬──────────────────────────────────────────┘
        │
        │ (Can navigate to form for interested leads)
        │
┌───────▼────────┐
│  Appliance Form│
│  (/form)       │
│                │
│  ┌──────────┐  │
│  │ Dynamic  │  │
│  │ Fields   │  │
│  │ Appliances│ │
│  │ Submit   │  │
│  └──────────┘  │
└────────────────┘
```

## Navigation Issues

### Issue 1: Inconsistent Navigation Patterns
- **CRM:** Sidebar + header links
- **Admin/Form/Processor:** Header links only
- **Problem:** Users experience different navigation on each page
- **Impact:** Confusion, learning curve, inconsistent UX

### Issue 2: Navigation Link Placement
- **Current:** Links in header, styled as buttons
- **Problem:** Not integrated into design, feel like afterthought
- **Impact:** Poor visual hierarchy, doesn't feel cohesive

### Issue 3: Tab Overload
- **CRM:** 13 tabs (too many)
- **Problem:** Cognitive overload, hard to find features
- **Impact:** Poor discoverability, overwhelming interface

### Issue 4: No Global Navigation
- **Problem:** Each page has different nav structure
- **Impact:** No consistent way to navigate between pages

### Issue 5: No Breadcrumbs or Hierarchy
- **Problem:** Users can't see where they are in system
- **Impact:** Disorientation, can't understand system structure

## Recommended Navigation Structure

### Global Navigation (All Pages)
```
┌─────────────────────────────────────────────────┐
│ [Logo] Appliance Cover                          │
│                                                 │
│ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐      │
│ │ CRM │ │Form │ │Admin│ │Proc │ │Home │      │
│ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘      │
│                                                 │
│ [User Menu] [Notifications] [Settings]         │
└─────────────────────────────────────────────────┘
```

### CRM-Specific Navigation
- **Sidebar:** Collapsible, context-aware navigation
- **Breadcrumbs:** Show current location
- **Quick Actions:** Floating action button for common tasks
- **Command Palette:** Cmd+K for quick navigation

## User Flow Improvements Needed

1. **Clear Entry Points:** Better landing after login
2. **Progressive Disclosure:** Show relevant features based on context
3. **Visual Hierarchy:** Clear information architecture
4. **Flow Indicators:** Show progress through workflows
5. **Contextual Help:** Guide users through complex tasks

---

**Status:** Ready for wireframe creation ✅
