#!/bin/bash

###############################################################################
# Security Fixes Deployment Script
# Automates deployment of security fixes to Vercel
# Usage: ./deploy-security-fixes.sh [phase] [environment]
#   phase: 1, 2, 3, or 'all' (default: all)
#   environment: staging, production (default: production)
###############################################################################

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
PHASE="${1:-all}"
ENVIRONMENT="${2:-production}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VERIFY_SCRIPT="${SCRIPT_DIR}/verify-security-fixes.sh"

###############################################################################
# Helper Functions
###############################################################################

print_header() {
    echo ""
    echo -e "${BLUE}=================================================="
    echo -e "$1"
    echo -e "==================================================${NC}"
}

print_step() {
    echo -e "${BLUE}→${NC} $1"
}

print_success() {
    echo -e "${GREEN}✅${NC} $1"
}

print_error() {
    echo -e "${RED}❌${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠️${NC} $1"
}

###############################################################################
# Validation Functions
###############################################################################

check_vercel_cli() {
    print_step "Checking Vercel CLI..."
    
    if ! command -v vercel &> /dev/null; then
        print_error "Vercel CLI not found. Install with: npm i -g vercel"
        exit 1
    fi
    
    print_success "Vercel CLI found"
}

check_vercel_auth() {
    print_step "Checking Vercel authentication..."
    
    if ! vercel whoami &> /dev/null; then
        print_error "Not authenticated with Vercel. Run: vercel login"
        exit 1
    fi
    
    print_success "Authenticated with Vercel"
}

check_git_status() {
    print_step "Checking Git status..."
    
    if [ -d .git ]; then
        if [ -n "$(git status --porcelain)" ]; then
            print_warning "Uncommitted changes detected"
            read -p "Continue anyway? (y/N) " -n 1 -r
            echo
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                exit 1
            fi
        fi
        print_success "Git status OK"
    else
        print_warning "Not a Git repository (continuing anyway)"
    fi
}

check_files() {
    print_step "Checking required files..."
    
    local missing=0
    
    case "$PHASE" in
        1|all)
            if [ ! -f "middleware.ts" ]; then
                print_error "middleware.ts not found"
                missing=$((missing + 1))
            fi
            ;;
        2|all)
            if [ ! -f "lib/rate-limit.ts" ]; then
                print_error "lib/rate-limit.ts not found"
                missing=$((missing + 1))
            fi
            if [ ! -f "app/api/auth/[...nextauth]/route.ts" ] && [ ! -f "pages/api/auth/[...nextauth].ts" ]; then
                print_error "NextAuth configuration not found"
                missing=$((missing + 1))
            fi
            ;;
        3|all)
            if [ ! -f "app/auth/error/page.tsx" ]; then
                print_error "Error page not found"
                missing=$((missing + 1))
            fi
            ;;
    esac
    
    if [ $missing -eq 0 ]; then
        print_success "All required files present"
        return 0
    else
        print_error "$missing required file(s) missing"
        return 1
    fi
}

###############################################################################
# Deployment Functions
###############################################################################

deploy_phase_1() {
    print_header "Phase 1: Critical Security Fixes (CSP + CORS)"
    
    print_step "Deploying middleware with CSP and CORS fixes..."
    
    if [ "$ENVIRONMENT" = "staging" ]; then
        vercel --env=staging
    else
        vercel --prod
    fi
    
    print_success "Phase 1 deployed"
    
    print_step "Waiting for deployment to propagate (10 seconds)..."
    sleep 10
    
    if [ -f "$VERIFY_SCRIPT" ]; then
        print_step "Running verification..."
        bash "$VERIFY_SCRIPT" || print_warning "Some verification tests failed"
    fi
}

deploy_phase_2() {
    print_header "Phase 2: Rate Limiting"
    
    print_step "Deploying rate limiting..."
    
    if [ "$ENVIRONMENT" = "staging" ]; then
        vercel --env=staging
    else
        vercel --prod
    fi
    
    print_success "Phase 2 deployed"
    
    print_step "Waiting for deployment to propagate (10 seconds)..."
    sleep 10
    
    if [ -f "$VERIFY_SCRIPT" ]; then
        print_step "Running verification..."
        bash "$VERIFY_SCRIPT" || print_warning "Some verification tests failed"
    fi
}

deploy_phase_3() {
    print_header "Phase 3: Error Handling"
    
    print_step "Deploying error page..."
    
    if [ "$ENVIRONMENT" = "staging" ]; then
        vercel --env=staging
    else
        vercel --prod
    fi
    
    print_success "Phase 3 deployed"
    
    print_step "Waiting for deployment to propagate (10 seconds)..."
    sleep 10
    
    if [ -f "$VERIFY_SCRIPT" ]; then
        print_step "Running final verification..."
        bash "$VERIFY_SCRIPT" || print_warning "Some verification tests failed"
    fi
}

###############################################################################
# Main Execution
###############################################################################

main() {
    print_header "🚀 Security Fixes Deployment"
    echo "Phase: $PHASE"
    echo "Environment: $ENVIRONMENT"
    echo "Date: $(date)"
    
    # Pre-deployment checks
    check_vercel_cli
    check_vercel_auth
    check_git_status
    check_files
    
    # Confirm deployment
    echo ""
    print_warning "About to deploy to: $ENVIRONMENT"
    read -p "Continue? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Deployment cancelled"
        exit 0
    fi
    
    # Deploy based on phase
    case "$PHASE" in
        1)
            deploy_phase_1
            ;;
        2)
            deploy_phase_2
            ;;
        3)
            deploy_phase_3
            ;;
        all)
            deploy_phase_1
            echo ""
            read -p "Phase 1 complete. Continue to Phase 2? (y/N) " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                deploy_phase_2
                echo ""
                read -p "Phase 2 complete. Continue to Phase 3? (y/N) " -n 1 -r
                echo
                if [[ $REPLY =~ ^[Yy]$ ]]; then
                    deploy_phase_3
                fi
            fi
            ;;
        *)
            print_error "Invalid phase: $PHASE (use 1, 2, 3, or 'all')"
            exit 1
            ;;
    esac
    
    print_header "✅ Deployment Complete"
    echo "Environment: $ENVIRONMENT"
    echo "Phase: $PHASE"
    echo ""
    echo "Next steps:"
    echo "1. Monitor Vercel logs for errors"
    echo "2. Test functionality manually"
    echo "3. Run verification script: $VERIFY_SCRIPT"
    echo "4. Monitor for 24 hours"
}

# Run main function
main "$@"
