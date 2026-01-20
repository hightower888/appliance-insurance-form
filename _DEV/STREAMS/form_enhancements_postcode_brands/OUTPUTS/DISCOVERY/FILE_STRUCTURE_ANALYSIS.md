## File Structure Analysis

**Total Files:** 21 (including SVG)  
**Source Files:** 20 (HTML + JS + CSS)  
**Directory Depth:** 2 levels (src/ -> services/|utils/)  
**Languages:** JavaScript (primary), HTML, CSS  
**Frameworks:** Firebase (Realtime Database, Auth), Vercel (deployment)

### File Breakdown
- **HTML Files:** 5 (appliance_form.html, admin.html, processor.html, login.html, setup-test-accounts.html)
- **JavaScript Files:** 13 (app.js, admin.js, processor.js, auth.js, auth-db.js, 6 services, 2 utils)
- **CSS Files:** 1 (styles.css)
- **Other:** 1 (favicon.svg)

### Directory Structure
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
├── appliance_form.html
├── admin.html
├── processor.html
├── login.html
├── app.js
├── admin.js
├── processor.js
├── auth.js
├── auth-db.js
├── styles.css
└── favicon.svg
```

### Configuration Files
- `package.json` - Node.js dependencies (firebase, firebase-admin)
- `vercel.json` - Deployment configuration (rewrites, headers, CSP)
- `database.rules.json` - Firebase Realtime Database security rules
- `firebase.json` - Firebase project configuration
- `.firebaserc` - Firebase project reference

**File Score:** 8/60
- Base score: 8 (20 files, minimal range 0-15)
- Adjustments: None
  - Single language (JavaScript/HTML/CSS): No adjustment
  - Directory depth 2 levels: No adjustment (not >5 levels)
  - Single module structure: No adjustment
  - Not primarily config/docs: No adjustment

**Context Storage:**
- Context ID: ctx_assess2_2026-01-15T06:15:00.000Z
- Type: file_structure
- Relevance: high
- Stored: 2026-01-15T06:15:00.000Z
