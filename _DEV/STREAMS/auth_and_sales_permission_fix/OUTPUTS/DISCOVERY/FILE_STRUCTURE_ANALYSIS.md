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
- HTML: 6 files
- JavaScript: 13 files
- CSS: 1 file

**Key Files for This Issue:**
- `src/auth.js` - Line 22: `const firebaseConfig = window.firebaseConfig;`
- `src/auth-db.js` - Line 21: `const firebaseConfig = window.firebaseConfig;`
- `src/admin.html` - Loads auth-db.js, has anonymous auth setup
- `src/admin.js` - Line 612: `const salesRef = db.ref('sales');` (loadSales function)
- `database.rules.json` - Line 45: `"sales": { ".read": "auth != null" }`

**Context Storage:**
- Context ID: ctx_assess2_2026-01-15T06:45:00.000Z
- Type: file_structure
- Relevance: high
- Stored: 2026-01-15T06:45:00.000Z
