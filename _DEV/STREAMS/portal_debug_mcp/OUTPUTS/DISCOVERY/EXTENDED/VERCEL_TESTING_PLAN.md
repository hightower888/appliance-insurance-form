# Vercel Live Testing Plan - Portal Debug MCP

**Stream:** portal_debug_mcp
**Testing Target:** Live Vercel Deployment
**URLs:**
- **Vercel URL:** https://customer-web-from-flash.vercel.app
- **Custom Domain:** https://customer.web.from.flash (if configured)

## 🎯 Testing Strategy Shift

**From:** Local development testing
**To:** Live Vercel deployment testing

**Rationale:** User reports bugs on the live portal, so testing must focus on production environment where issues occur.

## 🧪 Vercel-Specific Testing Considerations

### Environment Differences
- **CSP Headers:** Strict Content Security Policy enforced
- **HTTPS Only:** All requests must be secure
- **Firebase CORS:** Domain restrictions apply
- **Caching:** Vercel CDN and browser caching effects
- **Network Latency:** Real-world network conditions

### Security Headers (from vercel.json)
```json
{
  "Strict-Transport-Security": "max-age=31536000",
  "Content-Security-Policy": "complex CSP rules",
  "X-Frame-Options": "SAMEORIGIN",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin"
}
```

### Firebase Domain Restrictions
- **Allowed Domains:** customer-web-from-flash.vercel.app, customer.web.from.flash
- **CORS Configuration:** Must be properly set in Firebase
- **Security Rules:** Domain-based access control

## 📋 Live Vercel Testing Checklist

### Phase 1: Basic Connectivity & Loading
**Objective:** Verify site loads and basic functionality works

#### Static File Loading Tests
- [ ] **Vercel URL Loads:** https://customer-web-from-flash.vercel.app
- [ ] **Custom Domain Loads:** https://customer.web.from.flash (if configured)
- [ ] **Default Redirect:** Root URL redirects to /login.html
- [ ] **All HTML Pages Load:** login.html, appliance_form.html, admin.html, processor.html
- [ ] **CSS Loads:** styles.css loads without CORS errors
- [ ] **JavaScript Loads:** All .js files load without CSP violations
- [ ] **Assets Load:** favicon.svg and other assets load

#### Console Error Monitoring
- [ ] **No JavaScript Errors:** Check browser console for runtime errors
- [ ] **No CSP Violations:** Content Security Policy warnings/errors
- [ ] **No CORS Errors:** Cross-origin request issues
- [ ] **No Network Errors:** Failed resource loads (4xx/5xx)

### Phase 2: Authentication Testing
**Objective:** Test login/logout workflows on live site

#### Login Page Tests
- [ ] **Login Page Loads:** /login.html displays correctly
- [ ] **Form Elements Present:** Email/password fields, login button
- [ ] **UI Responsive:** Mobile and desktop layouts work
- [ ] **Error Display:** Error messages show properly

#### Authentication Flow Tests
- [ ] **Valid Login Works:** Correct credentials allow login
- [ ] **Invalid Login Fails:** Wrong credentials show error
- [ ] **Session Persistence:** Login state maintained across page refreshes
- [ ] **Role-Based Redirect:** Admin → admin.html, Agent → appliance_form.html
- [ ] **Logout Works:** Logout button clears session and redirects

#### Firebase Auth Integration
- [ ] **Auth State Sync:** Firebase auth state changes trigger UI updates
- [ ] **Token Management:** Auth tokens handled properly
- [ ] **Network Requests:** Auth API calls succeed (check Network tab)
- [ ] **Error Handling:** Network failures handled gracefully

### Phase 3: Form Functionality Testing
**Objective:** Test form rendering and submission on live site

#### Form Loading Tests
- [ ] **Form Page Loads:** /appliance_form.html displays
- [ ] **Authentication Required:** Redirects to login if not authenticated
- [ ] **Dynamic Fields Load:** Form fields render from database
- [ ] **Validation Rules Apply:** Required field indicators show

#### Form Interaction Tests
- [ ] **Field Input Works:** Text inputs, dropdowns, checkboxes functional
- [ ] **Add/Remove Appliances:** Dynamic appliance management works
- [ ] **Boiler Options Toggle:** Conditional fields show/hide properly
- [ ] **Cost Calculation:** Real-time cost updates work
- [ ] **Form Validation:** Client-side validation prevents invalid submission

#### Firebase Integration Tests
- [ ] **Data Submission:** Form data saves to Firebase successfully
- [ ] **Real-time Sync:** Database changes reflect immediately
- [ ] **Security Rules:** Write operations succeed/fail appropriately
- [ ] **Error Recovery:** Failed submissions show user-friendly errors

### Phase 4: Admin Panel Testing
**Objective:** Test admin functionality on live site

#### Admin Access Tests
- [ ] **Admin Login Works:** Admin user can access /admin.html
- [ ] **Non-Admin Blocked:** Regular users redirected appropriately
- [ ] **Role Verification:** Admin role properly validated

#### User Management Tests
- [ ] **User List Loads:** Users display from Firebase
- [ ] **User Creation:** Add new users functionality works
- [ ] **User Editing:** Modify user details works
- [ ] **User Deletion:** Remove users works safely
- [ ] **Role Assignment:** Admin/agent role changes work

#### Sales Data Tests
- [ ] **Sales Data Loads:** Form submissions display in admin table
- [ ] **Table Features:** Sorting, filtering, pagination work
- [ ] **Search Functionality:** Global search finds records
- [ ] **CSV Export:** Download functionality works
- [ ] **Column Visibility:** Toggle columns on/off works

#### Field Management Tests
- [ ] **Field Configuration:** Dynamic field management loads
- [ ] **Add/Edit Fields:** CRUD operations work
- [ ] **Field Ordering:** Drag-and-drop reordering works
- [ ] **Required Toggle:** Field validation settings work

### Phase 5: Processor Panel Testing
**Objective:** Test processor functionality on live site

#### Processor Access Tests
- [ ] **Processor Login:** Processor role can access /processor.html
- [ ] **Role Validation:** Processor permissions enforced

#### Profile Management Tests
- [ ] **Profile Creation:** Processor profiles can be created
- [ ] **Mapping Configuration:** CSV field mappings work
- [ ] **Default Profiles:** Profile selection works

#### Data Access Tests
- [ ] **Sales Viewing:** Appropriate sales data visible to processors
- [ ] **Export Functionality:** CSV export with mappings works
- [ ] **Permission Filtering:** Data access respects role permissions

### Phase 6: Cross-Browser Compatibility
**Objective:** Test across different browsers on live site

#### Chrome Testing
- [ ] All functionality works
- [ ] No console errors
- [ ] CSP compliance maintained

#### Firefox Testing
- [ ] All functionality works
- [ ] No console errors
- [ ] Firefox-specific issues identified

#### Safari Testing
- [ ] All functionality works
- [ ] No console errors
- [ ] Safari-specific issues identified

### Phase 7: Mobile Responsiveness
**Objective:** Test mobile experience on live site

#### Mobile View Tests
- [ ] Login page responsive on mobile
- [ ] Form displays correctly on small screens
- [ ] Touch interactions work (buttons, form fields)
- [ ] Admin table readable on mobile

#### Tablet Testing
- [ ] Intermediate screen sizes work
- [ ] Layout adapts appropriately
- [ ] Touch targets appropriately sized

### Phase 8: Performance & Network Testing
**Objective:** Test performance characteristics on live site

#### Loading Performance
- [ ] Initial page load times acceptable (<3 seconds)
- [ ] Large admin tables load within reasonable time
- [ ] Firebase queries perform well
- [ ] CDN caching working properly

#### Network Analysis
- [ ] All Firebase requests succeed
- [ ] No unnecessary network requests
- [ ] Proper caching headers applied
- [ ] Error handling for network failures

## 🔧 Testing Tools & Setup

### Browser Developer Tools Configuration
```javascript
// Console Commands for Testing
// Check Firebase auth state
console.log('Auth state:', firebase.auth().currentUser);

// Check database connection
firebase.database().ref('.info/connected').once('value', snap => {
  console.log('Firebase connected:', snap.val());
});

// Monitor network requests
// Use Network tab to verify:
// - Firebase auth calls
// - Database read/write operations
// - Static asset loading
// - CSP compliance
```

### Test User Accounts
- **Admin User:** [Credentials needed]
- **Agent User:** [Credentials needed]
- **Processor User:** [Credentials needed]

### Firebase Console Monitoring
- **Authentication Tab:** Login/logout events
- **Database Tab:** Data read/write operations
- **Functions Tab:** Any cloud functions (if applicable)
- **Hosting Tab:** Deployment status and errors

## 📊 Expected Bug Categories

### High Probability Issues (Based on Pattern Analysis)
1. **CSP Violations:** Strict CSP may block legitimate Firebase requests
2. **CORS Issues:** Firebase domain restrictions may cause problems
3. **Authentication Race Conditions:** Live network may expose timing issues
4. **Firebase Security Rules:** Domain-based rules may be misconfigured
5. **Mobile Responsiveness:** Live testing may reveal layout issues

### Medium Probability Issues
1. **Browser Compatibility:** Different browser behaviors on live site
2. **Network Latency:** Slow connections may cause timeouts
3. **Caching Issues:** CDN caching may serve stale content
4. **Session Management:** Auth persistence across browser sessions

## 🎯 Testing Execution Plan

### Day 1: Basic Functionality
1. Site loading and static resources
2. Console error monitoring
3. Basic authentication testing
4. Form rendering verification

### Day 2: Core Workflows
1. Complete form submission testing
2. Admin panel functionality
3. Processor panel testing
4. Firebase integration verification

### Day 3: Edge Cases & Compatibility
1. Cross-browser testing
2. Mobile responsiveness
3. Error scenarios
4. Performance analysis

## 📝 Bug Reporting Format

Each bug identified will be documented with:

```markdown
### Bug Title
**Severity:** Critical/High/Medium/Low
**Location:** URL and specific component
**Browser:** Chrome/Firefox/Safari + Version
**Steps to Reproduce:**
1. Step 1
2. Step 2
3. Expected vs Actual

**Evidence:**
- Screenshot URL
- Console error messages
- Network request details
- Firebase error codes

**Impact:** User experience impact description
**Root Cause:** Technical analysis (if determined)
**Fix Priority:** Immediate/Workaround/Planned
```

## 🚀 Ready for Live Testing

**Testing Environment:** Live Vercel deployment
**Primary URL:** https://customer-web-from-flash.vercel.app
**Backup URL:** https://customer.web.from.flash (if configured)
**Testing Tools:** Browser dev tools, Firebase console
**Documentation:** All findings will be tracked in bug reports

**Status:** Ready to begin systematic testing of the live portal deployment.