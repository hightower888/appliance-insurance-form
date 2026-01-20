/**
 * Bundle Analyzer Utility (Phase 4A)
 * Analyze and optimize bundle size
 */

class BundleAnalyzer {
  constructor() {
    this.scripts = [];
    this.styles = [];
    this.analyze();
  }

  /**
   * Analyze current page resources
   */
  analyze() {
    // Analyze scripts
    const scriptTags = document.querySelectorAll('script[src]');
    scriptTags.forEach(script => {
      this.scripts.push({
        src: script.src,
        async: script.async,
        defer: script.defer,
        type: script.type
      });
    });

    // Analyze stylesheets
    const linkTags = document.querySelectorAll('link[rel="stylesheet"]');
    linkTags.forEach(link => {
      this.styles.push({
        href: link.href,
        media: link.media
      });
    });
  }

  /**
   * Get optimization recommendations
   * @returns {Array} Recommendations
   */
  getRecommendations() {
    const recommendations = [];

    // Check for scripts that could be lazy loaded
    const nonCriticalScripts = this.scripts.filter(s => 
      !s.src.includes('firebase') && 
      !s.src.includes('chart.js') &&
      !s.defer && 
      !s.async
    );

    if (nonCriticalScripts.length > 0) {
      recommendations.push({
        type: 'lazy-load',
        message: `Consider lazy loading ${nonCriticalScripts.length} non-critical scripts`,
        scripts: nonCriticalScripts.map(s => s.src)
      });
    }

    // Check for large external scripts
    const externalScripts = this.scripts.filter(s => 
      s.src.startsWith('http') && !s.src.includes(window.location.hostname)
    );

    if (externalScripts.length > 5) {
      recommendations.push({
        type: 'external-scripts',
        message: `Consider bundling or reducing ${externalScripts.length} external scripts`,
        count: externalScripts.length
      });
    }

    // Check for unused stylesheets
    const unusedStyles = this.styles.filter(s => s.media && s.media !== 'all' && s.media !== '');
    if (unusedStyles.length > 0) {
      recommendations.push({
        type: 'unused-styles',
        message: `Remove or optimize ${unusedStyles.length} media-specific stylesheets`,
        styles: unusedStyles.map(s => s.href)
      });
    }

    return recommendations;
  }

  /**
   * Get bundle statistics
   * @returns {Object} Statistics
   */
  getStats() {
    return {
      totalScripts: this.scripts.length,
      asyncScripts: this.scripts.filter(s => s.async).length,
      deferScripts: this.scripts.filter(s => s.defer).length,
      totalStyles: this.styles.length,
      externalScripts: this.scripts.filter(s => s.src.startsWith('http')).length,
      recommendations: this.getRecommendations()
    };
  }

  /**
   * Log analysis report
   */
  logReport() {
    const stats = this.getStats();
    console.group('Bundle Analyzer Report');
    console.log('Scripts:', stats.totalScripts);
    console.log('Stylesheets:', stats.totalStyles);
    console.log('External Scripts:', stats.externalScripts);
    
    if (stats.recommendations.length > 0) {
      console.group('Recommendations');
      stats.recommendations.forEach(rec => {
        console.log(`[${rec.type}] ${rec.message}`);
      });
      console.groupEnd();
    }
    console.groupEnd();
  }
}

// Create singleton instance
const bundleAnalyzer = new BundleAnalyzer();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { BundleAnalyzer, bundleAnalyzer };
}

// Make available globally
if (typeof window !== 'undefined') {
  window.BundleAnalyzer = BundleAnalyzer;
  window.bundleAnalyzer = bundleAnalyzer;
  
  // Log report in development
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    setTimeout(() => bundleAnalyzer.logReport(), 2000);
  }
}
