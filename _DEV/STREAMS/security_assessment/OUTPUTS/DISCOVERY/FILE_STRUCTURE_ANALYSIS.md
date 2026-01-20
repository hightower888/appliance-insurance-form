## File Structure Analysis

**Total Files:** 57 (excluding node_modules)
**Source Files:** 18
**Directory Depth:** 3 levels (src/, src/services/, src/utils/)
**Languages:** JavaScript, HTML, CSS, JSON
**Frameworks:** Firebase, Vercel

**File Score:** 20/60
- Base score: 10 (18 source files, minimal range 0-15)
- Adjustments: 
  - +5 for multiple languages (JS, HTML, CSS, JSON)
  - +5 for multiple distinct modules (services/, utils/, scripts/)
- Final: 20/60

**Directory Structure:**
```
src/
├── admin.html, admin.js
├── appliance_form.html, app.js
├── login.html, processor.html
├── auth.js, auth-db.js
├── processor.js
├── styles.css, favicon.svg
├── services/
│   ├── field-config.js
│   ├── form-renderer.js
│   ├── form-validator.js
│   ├── processor-profile.js
│   └── security-logger.js
└── utils/
    └── field-compat.js
```

**Configuration Files:**
- vercel.json (security headers, CSP)
- database.rules.json (Firebase security rules)
- firebase.json
- package.json

**Scripts Directory:**
- 13 Node.js scripts for admin operations, migrations, testing

**Context Storage:**
- Context ID: ctx_assess2_2025-01-09T00:00:00Z
- Type: file_structure
- Relevance: high
- Stored: 2025-01-09T00:00:00Z
