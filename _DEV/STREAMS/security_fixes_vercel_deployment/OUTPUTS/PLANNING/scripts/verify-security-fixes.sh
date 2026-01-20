#!/bin/bash

###############################################################################
# Security Fixes Verification Script
# Verifies all security fixes are properly deployed
# Usage: ./verify-security-fixes.sh [base-url]
###############################################################################

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BASE_URL="${1:-https://sales-form-chi.vercel.app}"
LOGIN_URL="${BASE_URL}/auth/login"
API_URL="${BASE_URL}/api/auth/login"

# Counters
PASSED=0
FAILED=0
WARNINGS=0

###############################################################################
# Helper Functions
###############################################################################

print_header() {
    echo ""
    echo -e "${BLUE}=================================================="
    echo -e "$1"
    echo -e "==================================================${NC}"
}

print_test() {
    echo -e "${BLUE}Testing:${NC} $1"
}

print_pass() {
    echo -e "${GREEN}✅ PASS:${NC} $1"
    PASSED=$((PASSED + 1))
}

print_fail() {
    echo -e "${RED}❌ FAIL:${NC} $1"
    FAILED=$((FAILED + 1))
}

print_warn() {
    echo -e "${YELLOW}⚠️  WARN:${NC} $1"
    WARNINGS=$((WARNINGS + 1))
}

###############################################################################
# Test Functions
###############################################################################

test_csp() {
    print_test "Content Security Policy"
    
    local response
    response=$(curl -s -I "$LOGIN_URL" 2>&1)
    local csp
    csp=$(echo "$response" | grep -i "content-security-policy" | head -1 || echo "")
    
    if [ -z "$csp" ]; then
        print_fail "CSP header not found"
        return 1
    fi
    
    if echo "$csp" | grep -qi "unsafe-inline"; then
        print_fail "CSP contains 'unsafe-inline'"
        return 1
    fi
    
    if echo "$csp" | grep -qi "unsafe-eval"; then
        print_fail "CSP contains 'unsafe-eval'"
        return 1
    fi
    
    print_pass "CSP is secure (no unsafe directives)"
    echo "   CSP: ${csp:0:100}..."
    return 0
}

test_cors() {
    print_test "CORS Configuration"
    
    local response
    response=$(curl -s -I "$API_URL" 2>&1)
    local cors
    cors=$(echo "$response" | grep -i "access-control-allow-origin" | head -1 || echo "")
    
    if [ -z "$cors" ]; then
        print_warn "CORS header not found (may be OK if no API endpoints)"
        return 0
    fi
    
    if echo "$cors" | grep -q "\*"; then
        print_fail "CORS allows all origins (*)"
        return 1
    fi
    
    print_pass "CORS is restricted to specific origins"
    echo "   CORS: $cors"
    return 0
}

test_framework_headers() {
    print_test "Framework Headers (Information Disclosure)"
    
    local response
    response=$(curl -s -I "$LOGIN_URL" 2>&1)
    local headers
    headers=$(echo "$response" | grep -iE "nextjs|vercel-id|vercel-cache" || echo "")
    
    if [ -n "$headers" ]; then
        print_fail "Framework headers still visible"
        echo "   Found: $headers"
        return 1
    fi
    
    print_pass "Framework headers are hidden"
    return 0
}

test_security_headers() {
    print_test "Security Headers"
    
    local response
    response=$(curl -s -I "$LOGIN_URL" 2>&1)
    
    local missing=0
    local required_headers=(
        "Strict-Transport-Security"
        "X-Frame-Options"
        "X-XSS-Protection"
        "X-Content-Type-Options"
    )
    
    for header in "${required_headers[@]}"; do
        if echo "$response" | grep -qi "$header"; then
            echo "   ✅ $header present"
        else
            print_fail "$header missing"
            missing=$((missing + 1))
        fi
    done
    
    if [ $missing -eq 0 ]; then
        print_pass "All required security headers present"
        return 0
    else
        return 1
    fi
}

test_rate_limiting() {
    print_test "Rate Limiting (Manual Test Required)"
    
    echo "   This test requires manual verification:"
    echo "   1. Attempt 6 consecutive failed logins"
    echo "   2. 6th attempt should be blocked"
    echo "   3. Error message should be generic"
    echo ""
    echo "   Run manually:"
    echo "   for i in {1..6}; do"
    echo "     curl -X POST $API_URL \\"
    echo "       -H 'Content-Type: application/json' \\"
    echo "       -d '{\"email\":\"test@test.com\",\"password\":\"wrong\"}'"
    echo "   done"
    
    print_warn "Rate limiting test requires manual verification"
    return 0
}

test_error_messages() {
    print_test "Error Messages (Generic)"
    
    local response
    response=$(curl -s -X POST "$API_URL" \
        -H "Content-Type: application/json" \
        -d '{"email":"wrong@test.com","password":"wrong"}' 2>&1 || echo "")
    
    if echo "$response" | grep -qiE "nextauth|next\.js|framework"; then
        print_fail "Error message reveals framework details"
        echo "   Response: ${response:0:200}..."
        return 1
    fi
    
    print_pass "Error messages are generic (no framework details)"
    return 0
}

test_https() {
    print_test "HTTPS Enforcement"
    
    local http_url="${LOGIN_URL/https/http}"
    local response
    response=$(curl -s -I "$http_url" 2>&1 | head -1 || echo "")
    
    if echo "$response" | grep -q "301\|302\|307\|308"; then
        print_pass "HTTP redirects to HTTPS"
        return 0
    fi
    
    print_warn "HTTP to HTTPS redirect not verified (may be handled by Vercel)"
    return 0
}

###############################################################################
# Main Execution
###############################################################################

main() {
    print_header "🔍 Security Fixes Verification"
    echo "Target: $BASE_URL"
    echo "Date: $(date)"
    echo ""
    
    # Run tests
    test_csp || true
    test_cors || true
    test_framework_headers || true
    test_security_headers || true
    test_rate_limiting || true
    test_error_messages || true
    test_https || true
    
    # Summary
    print_header "📊 Test Summary"
    echo -e "${GREEN}✅ Passed:${NC} $PASSED"
    echo -e "${RED}❌ Failed:${NC} $FAILED"
    echo -e "${YELLOW}⚠️  Warnings:${NC} $WARNINGS"
    echo ""
    
    if [ $FAILED -eq 0 ]; then
        echo -e "${GREEN}🎉 All automated tests passed!${NC}"
        echo ""
        echo "Note: Rate limiting requires manual verification."
        exit 0
    else
        echo -e "${RED}⚠️  Some tests failed. Please review.${NC}"
        exit 1
    fi
}

# Run main function
main "$@"
