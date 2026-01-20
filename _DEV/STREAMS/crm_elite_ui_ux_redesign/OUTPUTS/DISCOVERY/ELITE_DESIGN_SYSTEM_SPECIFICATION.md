# Elite Design System Specification

**Date:** 2026-01-20  
**Stream:** crm_elite_ui_ux_redesign  
**Workflow:** DISCOVERY_ASSESSMENT  
**Status:** ✅ Complete

## Design Philosophy

**Elite Feel Principles:**
1. **Premium & Professional** - Top-of-market appearance
2. **Radical Simplicity** - Less is more, reduce cognitive load
3. **Data Storytelling** - Visualize data, not just display it
4. **Predictive Workflows** - AI-powered suggestions and automation
5. **Frictionless Experience** - Minimize clicks, maximize efficiency
6. **Visual Hierarchy** - Clear information architecture

## Color System

### Base Palette (Slate/Gray Foundation)

```css
/* Slate Scale (Primary Neutral) */
--slate-50: #f8fafc;
--slate-100: #f1f5f9;
--slate-200: #e2e8f0;
--slate-300: #cbd5e1;
--slate-400: #94a3b8;
--slate-500: #64748b;
--slate-600: #475569;
--slate-700: #334155;
--slate-800: #1e293b;
--slate-900: #0f172a;
```

### Primary Colors (Blue - Trust, Professional)

```css
/* Blue Scale */
--blue-50: #eff6ff;
--blue-100: #dbeafe;
--blue-200: #bfdbfe;
--blue-300: #93c5fd;
--blue-400: #60a5fa;
--blue-500: #3b82f6;  /* Primary */
--blue-600: #2563eb;  /* Primary Dark */
--blue-700: #1d4ed8;
--blue-800: #1e40af;
--blue-900: #1e3a8a;
```

### Semantic Colors

```css
/* Success (Green) */
--success-50: #f0fdf4;
--success-100: #dcfce7;
--success-200: #bbf7d0;
--success-300: #86efac;
--success-400: #4ade80;
--success-500: #22c55e;  /* Success */
--success-600: #16a34a;
--success-700: #15803d;
--success-800: #166534;
--success-900: #14532d;

/* Warning (Amber) */
--warning-50: #fffbeb;
--warning-100: #fef3c7;
--warning-200: #fde68a;
--warning-300: #fcd34d;
--warning-400: #fbbf24;
--warning-500: #f59e0b;  /* Warning */
--warning-600: #d97706;
--warning-700: #b45309;
--warning-800: #92400e;
--warning-900: #78350f;

/* Danger (Red) */
--danger-50: #fef2f2;
--danger-100: #fee2e2;
--danger-200: #fecaca;
--danger-300: #fca5a5;
--danger-400: #f87171;
--danger-500: #ef4444;  /* Danger */
--danger-600: #dc2626;
--danger-700: #b91c1c;
--danger-800: #991b1b;
--danger-900: #7f1d1d;

/* Info (Cyan) */
--info-50: #ecfeff;
--info-100: #cffafe;
--info-200: #a5f3fc;
--info-300: #67e8f9;
--info-400: #22d3ee;
--info-500: #06b6d4;  /* Info */
--info-600: #0891b2;
--info-700: #0e7490;
--info-800: #155e75;
--info-900: #164e63;
```

### Status Colors (CRM-Specific)

```css
/* Lead Status Colors */
--status-new: var(--blue-500);           /* New leads */
--status-contacted: var(--warning-500);  /* Contacted */
--status-interested: var(--success-500); /* Interested */
--status-converted: var(--success-600);   /* Converted */
--status-lost: var(--danger-500);        /* Lost */

/* Lead Score Colors */
--score-high: var(--success-500);        /* 80-100 (A-B) */
--score-medium: var(--warning-500);      /* 50-79 (C-D) */
--score-low: var(--danger-500);          /* 0-49 (E-F) */

/* Risk Level Colors */
--risk-high: var(--danger-500);
--risk-medium: var(--warning-500);
--risk-low: var(--success-500);
--risk-minimal: var(--slate-400);
```

### Background Colors

```css
/* Light Mode */
--bg-base: var(--slate-50);           /* Page background */
--bg-surface: #ffffff;                /* Card/container background */
--bg-elevated: var(--slate-100);      /* Elevated surfaces */
--bg-subtle: var(--slate-50);         /* Subtle backgrounds */

/* Dark Mode */
[data-theme="dark"] {
  --bg-base: var(--slate-900);
  --bg-surface: var(--slate-800);
  --bg-elevated: var(--slate-700);
  --bg-subtle: var(--slate-800);
}
```

### Text Colors

```css
/* Light Mode */
--text-primary: var(--slate-900);     /* Main text */
--text-secondary: var(--slate-600);   /* Secondary text */
--text-tertiary: var(--slate-500);    /* Tertiary text */
--text-disabled: var(--slate-400);    /* Disabled text */
--text-inverse: #ffffff;              /* Text on dark backgrounds */

/* Dark Mode */
[data-theme="dark"] {
  --text-primary: var(--slate-50);
  --text-secondary: var(--slate-300);
  --text-tertiary: var(--slate-400);
  --text-disabled: var(--slate-600);
  --text-inverse: var(--slate-900);
}
```

### Border Colors

```css
--border-subtle: var(--slate-200);
--border-default: var(--slate-300);
--border-strong: var(--slate-400);
--border-focus: var(--blue-500);

/* Dark Mode */
[data-theme="dark"] {
  --border-subtle: var(--slate-700);
  --border-default: var(--slate-600);
  --border-strong: var(--slate-500);
  --border-focus: var(--blue-400);
}
```

## Typography System

### Font Family

```css
/* Primary Font - Inter (Professional, Modern) */
--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 
  'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 
  'Droid Sans', 'Helvetica Neue', sans-serif;

/* Monospace Font - For Code/Data */
--font-mono: 'JetBrains Mono', 'Fira Code', 'Consolas', 
  'Monaco', 'Courier New', monospace;
```

**Implementation:** Import Inter from Google Fonts or use system fallback

### Typography Scale

```css
/* Text Sizes */
--text-xs: 0.75rem;      /* 12px - Labels, captions */
--text-sm: 0.875rem;      /* 14px - Secondary text */
--text-base: 1rem;        /* 16px - Body text */
--text-lg: 1.125rem;      /* 18px - Large body */
--text-xl: 1.25rem;       /* 20px - Small headings */
--text-2xl: 1.5rem;       /* 24px - Section headings */
--text-3xl: 1.875rem;     /* 30px - Page headings */
--text-4xl: 2.25rem;      /* 36px - Hero headings */
--text-5xl: 3rem;         /* 48px - Display headings */
```

### Font Weights

```css
--font-light: 300;
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
--font-extrabold: 800;
```

### Line Heights

```css
--leading-none: 1;
--leading-tight: 1.25;
--leading-snug: 1.375;
--leading-normal: 1.5;
--leading-relaxed: 1.625;
--leading-loose: 2;
```

### Letter Spacing

```css
--tracking-tighter: -0.05em;
--tracking-tight: -0.025em;
--tracking-normal: 0;
--tracking-wide: 0.025em;
--tracking-wider: 0.05em;
--tracking-widest: 0.1em;
```

## Spacing System

### Base: 4px Grid

```css
--space-0: 0;
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-5: 1.25rem;   /* 20px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-10: 2.5rem;   /* 40px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
--space-20: 5rem;     /* 80px */
--space-24: 6rem;     /* 96px */
```

### Semantic Spacing

```css
--spacing-xs: var(--space-2);    /* 8px - Tight spacing */
--spacing-sm: var(--space-4);    /* 16px - Small spacing */
--spacing-md: var(--space-6);    /* 24px - Medium spacing */
--spacing-lg: var(--space-8);    /* 32px - Large spacing */
--spacing-xl: var(--space-12);   /* 48px - Extra large */
--spacing-2xl: var(--space-16);  /* 64px - 2x extra large */
```

## Border Radius

```css
--radius-none: 0;
--radius-sm: 0.25rem;   /* 4px */
--radius-base: 0.375rem; /* 6px */
--radius-md: 0.5rem;    /* 8px */
--radius-lg: 0.75rem;   /* 12px */
--radius-xl: 1rem;      /* 16px */
--radius-2xl: 1.5rem;   /* 24px */
--radius-full: 9999px;  /* Full circle */
```

## Shadows & Elevation

### Elevation System (Material Design Inspired)

```css
/* Elevation 0 - No shadow */
--elevation-0: none;

/* Elevation 1 - Subtle */
--elevation-1: 0 1px 2px 0 rgba(0, 0, 0, 0.05);

/* Elevation 2 - Default cards */
--elevation-2: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 
               0 1px 2px -1px rgba(0, 0, 0, 0.1);

/* Elevation 3 - Hovered cards */
--elevation-3: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 
               0 2px 4px -2px rgba(0, 0, 0, 0.1);

/* Elevation 4 - Elevated cards */
--elevation-4: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 
               0 4px 6px -4px rgba(0, 0, 0, 0.1);

/* Elevation 5 - Modals, dropdowns */
--elevation-5: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 
               0 8px 10px -6px rgba(0, 0, 0, 0.1);

/* Elevation 6 - Top-level modals */
--elevation-6: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
```

## Component System

### Buttons

```css
/* Button Sizes */
.btn-sm {
  padding: var(--space-2) var(--space-3);
  font-size: var(--text-sm);
  height: 32px;
}

.btn-md {
  padding: var(--space-2) var(--space-4);
  font-size: var(--text-base);
  height: 40px;
}

.btn-lg {
  padding: var(--space-3) var(--space-6);
  font-size: var(--text-lg);
  height: 48px;
}

/* Button Variants */
.btn-primary {
  background: var(--blue-600);
  color: var(--text-inverse);
  border: none;
  box-shadow: var(--elevation-2);
}

.btn-primary:hover {
  background: var(--blue-700);
  box-shadow: var(--elevation-3);
}

.btn-secondary {
  background: var(--bg-surface);
  color: var(--text-primary);
  border: 1px solid var(--border-default);
}

.btn-ghost {
  background: transparent;
  color: var(--text-primary);
  border: none;
}

.btn-ghost:hover {
  background: var(--bg-elevated);
}
```

### Cards

```css
.card {
  background: var(--bg-surface);
  border-radius: var(--radius-lg);
  box-shadow: var(--elevation-2);
  padding: var(--spacing-lg);
  border: 1px solid var(--border-subtle);
}

.card-elevated {
  box-shadow: var(--elevation-4);
}

.card-interactive {
  cursor: pointer;
  transition: all 200ms ease;
}

.card-interactive:hover {
  box-shadow: var(--elevation-4);
  transform: translateY(-2px);
}
```

### Inputs

```css
.input {
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  font-size: var(--text-base);
  background: var(--bg-surface);
  color: var(--text-primary);
  transition: all 200ms ease;
}

.input:focus {
  outline: none;
  border-color: var(--border-focus);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.input-error {
  border-color: var(--danger-500);
}

.input-success {
  border-color: var(--success-500);
}
```

### Tables

```css
.table {
  width: 100%;
  border-collapse: collapse;
}

.table thead {
  background: var(--bg-elevated);
  border-bottom: 2px solid var(--border-default);
}

.table th {
  padding: var(--space-4);
  text-align: left;
  font-weight: var(--font-semibold);
  color: var(--text-secondary);
  font-size: var(--text-sm);
  text-transform: uppercase;
  letter-spacing: var(--tracking-wide);
}

.table td {
  padding: var(--space-4);
  border-bottom: 1px solid var(--border-subtle);
}

.table tbody tr {
  transition: background 150ms ease;
}

.table tbody tr:hover {
  background: var(--bg-elevated);
}
```

## Layout System

### Grid System

```css
/* 12-Column Grid */
.grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: var(--spacing-lg);
}

.col-1 { grid-column: span 1; }
.col-2 { grid-column: span 2; }
.col-3 { grid-column: span 3; }
.col-4 { grid-column: span 4; }
.col-6 { grid-column: span 6; }
.col-12 { grid-column: span 12; }
```

### Container

```css
.container {
  max-width: 1600px;
  margin: 0 auto;
  padding: 0 var(--spacing-lg);
}

.container-sm {
  max-width: 640px;
}

.container-md {
  max-width: 1024px;
}

.container-lg {
  max-width: 1280px;
}

.container-xl {
  max-width: 1600px;
}
```

### Breakpoints

```css
/* Mobile First */
--breakpoint-sm: 640px;   /* Small devices */
--breakpoint-md: 768px;   /* Tablets */
--breakpoint-lg: 1024px;  /* Desktops */
--breakpoint-xl: 1280px;  /* Large desktops */
--breakpoint-2xl: 1536px; /* Extra large */
```

## Icons

**Replace Emoji Icons with Professional Icon Library:**

**Recommended:** Heroicons, Lucide, or Font Awesome

```css
/* Icon Sizes */
--icon-xs: 12px;
--icon-sm: 16px;
--icon-md: 20px;
--icon-lg: 24px;
--icon-xl: 32px;
```

**Icon Usage:**
- Navigation icons
- Action icons (edit, delete, view)
- Status icons
- Feature icons
- No emoji in production UI

## Animations & Transitions

### Transition Durations

```css
--duration-fast: 150ms;
--duration-base: 200ms;
--duration-slow: 300ms;
--duration-slower: 500ms;
```

### Easing Functions

```css
--ease-in: cubic-bezier(0.4, 0, 1, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
```

### Micro-Interactions

```css
/* Hover */
.hover-lift {
  transition: transform var(--duration-base) var(--ease-out);
}

.hover-lift:hover {
  transform: translateY(-2px);
}

/* Focus */
.focus-ring {
  transition: box-shadow var(--duration-fast) var(--ease-out);
}

.focus-ring:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
}
```

## Dark Mode

### Implementation

```css
[data-theme="dark"] {
  /* Override all color variables */
  --bg-base: var(--slate-900);
  --bg-surface: var(--slate-800);
  --text-primary: var(--slate-50);
  /* ... etc */
}
```

### Toggle

- User preference service integration
- System preference detection
- Manual toggle in settings
- Persist in localStorage

## Accessibility

### WCAG 2.1 AA Compliance

```css
/* Color Contrast */
/* All text meets 4.5:1 ratio */
/* Large text (18pt+) meets 3:1 ratio */

/* Focus Indicators */
*:focus-visible {
  outline: 2px solid var(--blue-500);
  outline-offset: 2px;
}

/* Touch Targets */
button, a {
  min-height: 44px;
  min-width: 44px;
}
```

## Implementation Priority

### Phase 1: Foundation
1. Color system (semantic scales)
2. Typography system
3. Spacing system
4. Remove gradient background
5. Replace emoji icons

### Phase 2: Components
1. Button variants
2. Card components
3. Input components
4. Table components
5. Modal/Panel components

### Phase 3: Layout
1. Grid system
2. Container system
3. Responsive breakpoints
4. Global navigation

### Phase 4: Polish
1. Dark mode
2. Animations
3. Micro-interactions
4. Loading states
5. Empty states

---

**Status:** Ready for implementation ✅
