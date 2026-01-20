/**
 * Performance Monitor Service (Phase 4A)
 * Track and report performance metrics
 */

class PerformanceMonitor {
  constructor(options = {}) {
    this.options = {
      trackMetrics: options.trackMetrics !== false,
      reportToServer: options.reportToServer || false,
      reportInterval: options.reportInterval || 60000, // 1 minute
      ...options
    };

    this.metrics = {
      pageLoad: null,
      firstContentfulPaint: null,
      largestContentfulPaint: null,
      timeToInteractive: null,
      cumulativeLayoutShift: null,
      firstInputDelay: null,
      longTasks: []
    };

    this.init();
  }

  /**
   * Initialize performance monitoring
   */
  init() {
    if (!this.options.trackMetrics) return;

    // Wait for page load
    if (document.readyState === 'complete') {
      this.collectMetrics();
    } else {
      window.addEventListener('load', () => {
        this.collectMetrics();
      });
    }

    // Monitor long tasks
    if ('PerformanceObserver' in window) {
      this.observeLongTasks();
      this.observeLayoutShift();
      this.observeFirstInput();
    }

    // Report metrics periodically
    if (this.options.reportToServer) {
      setInterval(() => this.reportMetrics(), this.options.reportInterval);
    }
  }

  /**
   * Collect performance metrics
   */
  collectMetrics() {
    if (!window.performance || !window.performance.timing) return;

    const timing = window.performance.timing;
    const navigation = window.performance.navigation;

    // Page load time
    this.metrics.pageLoad = timing.loadEventEnd - timing.navigationStart;

    // Collect Web Vitals
    this.collectWebVitals();
  }

  /**
   * Collect Web Vitals metrics
   */
  collectWebVitals() {
    if (!window.performance || !window.performance.getEntriesByType) return;

    // First Contentful Paint
    const fcpEntry = window.performance.getEntriesByType('paint').find(
      entry => entry.name === 'first-contentful-paint'
    );
    if (fcpEntry) {
      this.metrics.firstContentfulPaint = fcpEntry.startTime;
    }

    // Largest Contentful Paint
    const lcpEntries = window.performance.getEntriesByType('largest-contentful-paint');
    if (lcpEntries.length > 0) {
      this.metrics.largestContentfulPaint = lcpEntries[lcpEntries.length - 1].renderTime;
    }
  }

  /**
   * Observe long tasks
   */
  observeLongTasks() {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 50) { // Tasks longer than 50ms
            this.metrics.longTasks.push({
              duration: entry.duration,
              startTime: entry.startTime,
              name: entry.name
            });
          }
        }
      });
      observer.observe({ entryTypes: ['longtask'] });
    } catch (error) {
      // Long task observer not supported
    }
  }

  /**
   * Observe layout shift
   */
  observeLayoutShift() {
    try {
      let clsValue = 0;
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        }
        this.metrics.cumulativeLayoutShift = clsValue;
      });
      observer.observe({ entryTypes: ['layout-shift'] });
    } catch (error) {
      // Layout shift observer not supported
    }
  }

  /**
   * Observe first input delay
   */
  observeFirstInput() {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.metrics.firstInputDelay = entry.processingStart - entry.startTime;
          observer.disconnect();
        }
      });
      observer.observe({ entryTypes: ['first-input'] });
    } catch (error) {
      // First input observer not supported
    }
  }

  /**
   * Get current metrics
   * @returns {Object} Performance metrics
   */
  getMetrics() {
    return { ...this.metrics };
  }

  /**
   * Report metrics to server
   */
  async reportMetrics() {
    if (!this.options.reportToServer) return;

    try {
      // This would send to analytics endpoint
      console.log('PerformanceMonitor: Metrics', this.getMetrics());
      // await fetch('/api/analytics/performance', {
      //   method: 'POST',
      //   body: JSON.stringify(this.getMetrics())
      // });
    } catch (error) {
      console.error('PerformanceMonitor: Failed to report metrics:', error);
    }
  }

  /**
   * Measure function execution time
   * @param {string} name - Function name
   * @param {Function} fn - Function to measure
   * @returns {Promise<*>} Function result
   */
  async measure(name, fn) {
    const start = performance.now();
    try {
      const result = await fn();
      const duration = performance.now() - start;
      console.log(`PerformanceMonitor: ${name} took ${duration.toFixed(2)}ms`);
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      console.error(`PerformanceMonitor: ${name} failed after ${duration.toFixed(2)}ms:`, error);
      throw error;
    }
  }
}

// Create singleton instance
const performanceMonitor = new PerformanceMonitor({
  reportToServer: false // Set to true to enable server reporting
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { PerformanceMonitor, performanceMonitor };
}

// Make available globally
if (typeof window !== 'undefined') {
  window.PerformanceMonitor = PerformanceMonitor;
  window.performanceMonitor = performanceMonitor;
}
