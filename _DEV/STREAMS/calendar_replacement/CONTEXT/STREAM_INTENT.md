# Calendar Replacement Stream Intent

## Primary Goal
Replace the Flatpickr calendar library with a simple, custom calendar popup solution that:
1. Works without external dependencies (no CDN, no CSP issues)
2. Allows selection of any date in the current month for DD Date field
3. Is lightweight and easy to maintain
4. Doesn't cause security issues

## Scope

### Current Problem
- Flatpickr library causing CSP (Content Security Policy) violations
- External CDN dependency creates security concerns
- User doesn't want to host libraries locally
- Need a simple, native solution

### Solution Approach
- Build a custom calendar popup component using vanilla JavaScript
- Use native HTML/CSS (no external dependencies)
- Simple date selection for current month only
- Lightweight and maintainable

## Requirements

### Functional Requirements
1. **REQ-1:** Calendar popup must appear when DD Date input is clicked
2. **REQ-2:** User can select any date in the current month (1-31)
3. **REQ-3:** Selected date displays in the input field (day number only)
4. **REQ-4:** Calendar closes after date selection
5. **REQ-5:** Calendar is accessible (keyboard navigation, screen readers)
6. **REQ-6:** Calendar works on mobile devices

### Technical Requirements
1. **REQ-7:** No external dependencies (no CDN, no npm packages)
2. **REQ-8:** Pure vanilla JavaScript, HTML, CSS
3. **REQ-9:** Must comply with existing CSP policy
4. **REQ-10:** Lightweight (< 10KB total)
5. **REQ-11:** Works with existing form structure

## Success Criteria
- [ ] Calendar popup appears when DD Date input is clicked
- [ ] User can select any date in current month
- [ ] Selected date displays correctly in input field
- [ ] No CSP violations or security warnings
- [ ] No external dependencies
- [ ] Works on desktop and mobile
- [ ] Accessible (keyboard navigation, ARIA labels)

## Priority
HIGH - Calendar is blocking form functionality and causing security issues

## Constraints
- Cannot use external CDN libraries
- Cannot host libraries locally
- Must work with existing CSP policy
- Must be simple and maintainable

## Context
- **Current Issue:** Flatpickr causing CSP violations
- **Requirement:** Simple calendar popup without external dependencies
- **MCP Workflow:** Using discovery assessment AI workflow with MCP enforcement
