## File Structure Analysis

**Total Files:** 20
**Source Files:** 20
**Directory Depth:** 3 levels (src/, src/services/, src/utils/)
**Languages:** HTML, JavaScript, CSS
**Frameworks:** None (vanilla JS, Firebase SDK)

**File Score:** 22/60
- Base score: 12 (20 files in 1-50 range, minimal category)
- Adjustments: 
  - +5 for multiple languages (HTML, JS, CSS)
  - +5 for multiple distinct modules (services/, utils/)
  - 0 for directory depth (5 directories, not >5 levels deep)
  - 0 for config/doc (primarily source code, not documentation)

**File Type Distribution:**
- HTML: 6 files (admin.html, appliance_form.html, login.html, processor.html, setup-test-accounts.html, test-security-fixes.html)
- JavaScript: 13 files (admin.js, app.js, auth-db.js, auth.js, processor.js, plus 6 service files, 2 utils files)
- CSS: 1 file (styles.css)
- SVG: 1 file (favicon.svg)

**Directory Structure:**
```
src/
├── services/
│   ├── appliance-relationship-manager.js
│   ├── field-config.js
│   ├── form-renderer.js
│   ├── form-validator.js
│   ├── processor-profile.js
│   └── security-logger.js
├── utils/
│   ├── field-compat.js
│   └── sanitize.js
├── admin.html
├── admin.js
├── appliance_form.html
├── app.js
├── auth-db.js
├── auth.js
├── login.html
├── processor.html
├── processor.js
├── styles.css
└── favicon.svg
```

**Configuration Files:**
- Root level: package.json, vercel.json, firebase.json, database.rules.json, .firebaserc
- Standard configuration for Firebase, Vercel deployment, and Node.js

**Context Storage:**
- Context ID: ctx_assess2_2026-01-15T05:30:00.000Z
- Type: file_structure
- Relevance: high
- Stored: 2026-01-15T05:30:00.000Z
