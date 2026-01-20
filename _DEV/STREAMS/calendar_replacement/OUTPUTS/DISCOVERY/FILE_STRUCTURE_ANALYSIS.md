# File Structure Analysis - Calendar Replacement

**Generated:** 2026-01-14  
**Stream:** calendar_replacement  
**Workflow:** DISCOVERY_ASSESSMENT  
**Step:** assess-2

---

## File Count Analysis

### Source Files
- **HTML Files:** 4 files (admin.html, appliance_form.html, login.html, processor.html)
- **JavaScript Files:** ~15 files (main scripts + services + utils)
- **CSS Files:** 1 file (styles.css)
- **Total Source Files:** ~20 files

### Directory Structure
```
src/
  ├── *.html (4 files)
  ├── *.js (6 main files: admin.js, app.js, auth.js, auth-db.js, processor.js)
  ├── services/ (6 files)
  │   ├── appliance-relationship-manager.js
  │   ├── field-config.js
  │   ├── form-renderer.js
  │   ├── form-validator.js
  │   ├── processor-profile.js
  │   └── security-logger.js
  ├── utils/ (2 files)
  │   ├── field-compat.js
  │   └── sanitize.js
  └── lib/ (1 directory - flatpickr, to be removed)
      └── flatpickr/
          ├── flatpickr.min.css
          └── flatpickr.min.js
```

**Directory Depth:** 2-3 levels (minimal nesting)

---

## Languages & Frameworks

### Languages
- **JavaScript** (ES6+) - Primary language
- **HTML** - Markup
- **CSS** - Styling

### Frameworks/Libraries
- **Firebase** (Auth, Realtime Database, Functions)
- **No external UI libraries** (removing Flatpickr)

---

## File Score Calculation

### Base Score
- **File Count:** ~20 files
- **Category:** Small (51-200 files range)
- **Base Score:** 16/60

### Adjustments
- **Multiple Languages:** +5 (JavaScript, HTML, CSS)
- **Directory Structure:** 0 (simple 2-3 level structure)
- **Multiple Modules:** +3 (src/ has services/ and utils/ subdirectories)
- **Configuration Files:** -4 (minimal config, mostly source code)

### Final File Score
**Score: 20/60**

**Calculation:**
- Base: 16
- +5 (multiple languages)
- +3 (multiple modules)
- -4 (minimal config)
- **Total: 20/60**

---

## Context Storage

**Context ID:** ctx_assess2_2026-01-14T11:00:00Z  
**Type:** file_structure  
**Relevance:** high  
**Stored:** 2026-01-14T11:00:00Z

---

## Key Findings

### Calendar Component Location
- **Primary File:** `src/appliance_form.html`
  - DD Date input: lines 144-154
  - Current Flatpickr CDN links: lines 301-303
  - Current Flatpickr initialization: lines 380-590 (~210 lines)
  - Needs replacement: ~210 lines of Flatpickr code

### Integration Points
- **Form Field:** `#ddDate` input element (line 147)
- **Styling:** `src/styles.css` (Flatpickr styles lines 1348-1594, ~246 lines)
- **Form Logic:** `src/app.js` (may reference calendar, needs verification)

### Files to Modify
1. **Remove from `appliance_form.html`:**
   - Flatpickr CDN links (lines 301-303)
   - Flatpickr initialization script (lines 380-590)

2. **Remove from `styles.css`:**
   - Flatpickr calendar styles (lines 1348-1594)

3. **Add to `appliance_form.html`:**
   - Custom calendar popup HTML structure
   - Custom calendar initialization JavaScript

4. **Add to `styles.css`:**
   - Custom calendar popup styles

5. **Remove directory:**
   - `src/lib/flatpickr/` (no longer needed)

### Replacement Scope
- **Remove:** Flatpickr CDN links, initialization script, styles, local library files
- **Add:** Custom calendar popup component (HTML/CSS/JS)
- **Estimated Size:** < 10KB total (much smaller than Flatpickr's ~65KB)

---

## Assessment Summary

**File Structure Complexity:** Low (20/60)
- Small codebase (~20 files)
- Clear separation of concerns
- Simple component replacement
- Minimal file changes required (2 files to modify, 1 directory to remove)
