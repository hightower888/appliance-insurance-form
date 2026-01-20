/**
 * Lazy Loader Utility (Phase 4A)
 * Dynamic imports and lazy loading for components
 */

class LazyLoader {
  constructor(options = {}) {
    this.options = {
      preloadOnHover: options.preloadOnHover !== false,
      preloadOnVisible: options.preloadOnVisible !== false,
      ...options
    };

    this.loadedModules = new Set();
    this.loadingPromises = new Map();
  }

  /**
   * Lazy load a module
   * @param {string} modulePath - Path to module
   * @param {string} exportName - Export name (optional)
   * @returns {Promise<*>} Loaded module
   */
  async loadModule(modulePath, exportName = null) {
    // Check if already loaded
    if (this.loadedModules.has(modulePath)) {
      return this.getCachedModule(modulePath, exportName);
    }

    // Check if currently loading
    if (this.loadingPromises.has(modulePath)) {
      return this.loadingPromises.get(modulePath);
    }

    // Start loading
    const loadPromise = this.doLoadModule(modulePath, exportName);
    this.loadingPromises.set(modulePath, loadPromise);

    try {
      const result = await loadPromise;
      this.loadedModules.add(modulePath);
      this.loadingPromises.delete(modulePath);
      return result;
    } catch (error) {
      this.loadingPromises.delete(modulePath);
      throw error;
    }
  }

  /**
   * Actually load the module
   * @param {string} modulePath - Path to module
   * @param {string} exportName - Export name
   * @returns {Promise<*>} Loaded module
   */
  async doLoadModule(modulePath, exportName) {
    // For now, use dynamic script loading
    // In a build system, this would use dynamic imports
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = modulePath;
      script.async = true;
      script.onload = () => {
        if (exportName && typeof window[exportName] !== 'undefined') {
          resolve(window[exportName]);
        } else {
          resolve(true);
        }
      };
      script.onerror = () => reject(new Error(`Failed to load module: ${modulePath}`));
      document.head.appendChild(script);
    });
  }

  /**
   * Get cached module
   * @param {string} modulePath - Path to module
   * @param {string} exportName - Export name
   * @returns {*} Cached module
   */
  getCachedModule(modulePath, exportName) {
    if (exportName && typeof window[exportName] !== 'undefined') {
      return window[exportName];
    }
    return true;
  }

  /**
   * Preload module on hover
   * @param {HTMLElement} element - Element to attach hover listener
   * @param {string} modulePath - Module to preload
   */
  preloadOnHover(element, modulePath) {
    if (!this.options.preloadOnHover) return;

    let preloadTimer;
    element.addEventListener('mouseenter', () => {
      preloadTimer = setTimeout(() => {
        this.loadModule(modulePath).catch(() => {
          // Silently fail preload
        });
      }, 100);
    });

    element.addEventListener('mouseleave', () => {
      if (preloadTimer) {
        clearTimeout(preloadTimer);
      }
    });
  }

  /**
   * Preload module when element becomes visible
   * @param {HTMLElement} element - Element to observe
   * @param {string} modulePath - Module to preload
   */
  preloadOnVisible(element, modulePath) {
    if (!this.options.preloadOnVisible || !('IntersectionObserver' in window)) {
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.loadModule(modulePath).catch(() => {
            // Silently fail preload
          });
          observer.unobserve(entry.target);
        }
      });
    }, { rootMargin: '50px' });

    observer.observe(element);
  }

  /**
   * Load component when needed
   * @param {string} componentName - Component name
   * @param {string} modulePath - Module path
   * @returns {Promise<*>} Component class
   */
  async loadComponent(componentName, modulePath) {
    return this.loadModule(modulePath, componentName);
  }
}

// Create singleton instance
const lazyLoader = new LazyLoader();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { LazyLoader, lazyLoader };
}

// Make available globally
if (typeof window !== 'undefined') {
  window.LazyLoader = LazyLoader;
  window.lazyLoader = lazyLoader;
}
