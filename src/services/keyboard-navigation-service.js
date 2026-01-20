/**
 * Keyboard Navigation Service (Phase 4C)
 * WCAG 2.1 AA compliant keyboard navigation
 */

class KeyboardNavigationService {
  constructor(options = {}) {
    this.options = {
      trapFocus: options.trapFocus !== false,
      restoreFocus: options.restoreFocus !== false,
      ...options
    };

    this.focusHistory = [];
    this.init();
  }

  /**
   * Initialize keyboard navigation
   */
  init() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        this.initializeNavigation();
      });
    } else {
      this.initializeNavigation();
    }
  }

  /**
   * Initialize navigation handlers (called after DOM is ready)
   */
  initializeNavigation() {
    // Setup global keyboard handlers
    document.addEventListener('keydown', (e) => this.handleKeyDown(e));
    
    // Track focus for restoration
    document.addEventListener('focusin', (e) => {
      if (e.target && !e.target.closest('.modal')) {
        this.focusHistory.push(e.target);
        // Keep only last 10 focus positions
        if (this.focusHistory.length > 10) {
          this.focusHistory.shift();
        }
      }
    });

    // Setup tab navigation
    this.setupTabNavigation();
    
    // Setup modal focus trapping
    this.setupModalFocusTrap();
  }

  /**
   * Handle keydown events
   * @param {KeyboardEvent} e - Keyboard event
   */
  handleKeyDown(e) {
    // Escape key - close modals
    if (e.key === 'Escape') {
      const openModal = document.querySelector('.modal[style*="block"], .modal[aria-hidden="false"]');
      if (openModal) {
        const closeBtn = openModal.querySelector('[aria-label*="Close"], [aria-label*="close"]');
        if (closeBtn) {
          closeBtn.click();
        } else if (typeof closeLeadDetailModal === 'function' && openModal.id === 'leadDetailModal') {
          closeLeadDetailModal();
        }
      }
    }

    // Tab navigation in tabs
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      const activeTab = document.querySelector('[role="tab"][aria-selected="true"]');
      if (activeTab && activeTab.closest('[role="tablist"]')) {
        e.preventDefault();
        this.navigateTabs(activeTab, e.key === 'ArrowRight' ? 1 : -1);
      }
    }

    // Enter/Space on tabs
    if ((e.key === 'Enter' || e.key === ' ') && e.target.getAttribute('role') === 'tab') {
      e.preventDefault();
      e.target.click();
    }
  }

  /**
   * Setup tab navigation
   */
  setupTabNavigation() {
    const tabLists = document.querySelectorAll('[role="tablist"]');
    
    tabLists.forEach(tabList => {
      const tabs = Array.from(tabList.querySelectorAll('[role="tab"]'));
      
      tabs.forEach((tab, index) => {
        tab.addEventListener('keydown', (e) => {
          if (e.key === 'ArrowRight') {
            e.preventDefault();
            const nextIndex = (index + 1) % tabs.length;
            tabs[nextIndex].focus();
            tabs[nextIndex].click();
          } else if (e.key === 'ArrowLeft') {
            e.preventDefault();
            const prevIndex = (index - 1 + tabs.length) % tabs.length;
            tabs[prevIndex].focus();
            tabs[prevIndex].click();
          } else if (e.key === 'Home') {
            e.preventDefault();
            tabs[0].focus();
            tabs[0].click();
          } else if (e.key === 'End') {
            e.preventDefault();
            tabs[tabs.length - 1].focus();
            tabs[tabs.length - 1].click();
          }
        });
      });
    });
  }

  /**
   * Navigate tabs
   * @param {HTMLElement} currentTab - Current tab
   * @param {number} direction - Direction (1 for next, -1 for previous)
   */
  navigateTabs(currentTab, direction) {
    const tabList = currentTab.closest('[role="tablist"]');
    if (!tabList) return;

    const tabs = Array.from(tabList.querySelectorAll('[role="tab"]'));
    const currentIndex = tabs.indexOf(currentTab);
    const nextIndex = (currentIndex + direction + tabs.length) % tabs.length;
    
    tabs[nextIndex].focus();
    tabs[nextIndex].click();
  }

  /**
   * Setup modal focus trap
   */
  setupModalFocusTrap() {
    // Check if DOM is ready
    if (!document.body) {
      // Wait for DOM to be ready
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.setupModalFocusTrap());
      }
      return;
    }
    
    // Observe modals
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1 && node.classList && node.classList.contains('modal')) {
            this.trapFocusInModal(node);
          }
        });
      });
    });

    observer.observe(document.body, { childList: true, subtree: true });

    // Setup for existing modals
    document.querySelectorAll('.modal').forEach(modal => {
      this.trapFocusInModal(modal);
    });
  }

  /**
   * Trap focus within modal
   * @param {HTMLElement} modal - Modal element
   */
  trapFocusInModal(modal) {
    if (!this.options.trapFocus) return;

    const focusableElements = modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    modal.addEventListener('keydown', (e) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    });

    // Focus first element when modal opens
    const observer = new MutationObserver(() => {
      if (modal.style.display !== 'none' && modal.getAttribute('aria-hidden') !== 'true') {
        firstElement.focus();
      }
    });

    observer.observe(modal, {
      attributes: true,
      attributeFilter: ['style', 'aria-hidden']
    });
  }

  /**
   * Restore focus to previous element
   */
  restoreFocus() {
    if (!this.options.restoreFocus || this.focusHistory.length === 0) return;
    
    const previousElement = this.focusHistory.pop();
    if (previousElement && document.body.contains(previousElement)) {
      previousElement.focus();
    }
  }

  /**
   * Make element keyboard accessible
   * @param {HTMLElement} element - Element to make accessible
   * @param {Object} options - Options
   */
  makeKeyboardAccessible(element, options = {}) {
    if (!element) return;

    // Add tabindex if not interactive
    if (!element.hasAttribute('tabindex') && 
        !['button', 'a', 'input', 'select', 'textarea'].includes(element.tagName.toLowerCase())) {
      element.setAttribute('tabindex', '0');
    }

    // Add keyboard handler
    if (options.onActivate) {
      element.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          options.onActivate(e);
        }
      });
    }

    // Add role if needed
    if (options.role && !element.hasAttribute('role')) {
      element.setAttribute('role', options.role);
    }
  }
}

// Create singleton instance
const keyboardNavigationService = new KeyboardNavigationService();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { KeyboardNavigationService, keyboardNavigationService };
}

// Make available globally
if (typeof window !== 'undefined') {
  window.KeyboardNavigationService = KeyboardNavigationService;
  window.keyboardNavigationService = keyboardNavigationService;
}

// Auto-initialize on load
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      keyboardNavigationService.init();
    });
  } else {
    keyboardNavigationService.init();
  }
}
