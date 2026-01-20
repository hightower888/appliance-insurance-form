/**
 * Image Optimizer Service (Phase 4A)
 * Lazy loading, responsive images, and optimization
 */

class ImageOptimizer {
  constructor(options = {}) {
    this.options = {
      lazyLoad: options.lazyLoad !== false,
      useWebP: options.useWebP !== false && this.supportsWebP(),
      useAvif: options.useAvif !== false && this.supportsAvif(),
      placeholder: options.placeholder || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"%3E%3C/svg%3E',
      ...options
    };

    this.observer = null;
    this.init();
  }

  /**
   * Check WebP support
   * @returns {boolean} True if supported
   */
  supportsWebP() {
    const canvas = document.createElement('canvas');
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  }

  /**
   * Check AVIF support
   * @returns {boolean} True if supported
   */
  supportsAvif() {
    const canvas = document.createElement('canvas');
    return canvas.toDataURL('image/avif').indexOf('data:image/avif') === 0;
  }

  /**
   * Initialize image optimizer
   */
  init() {
    if (this.options.lazyLoad && 'IntersectionObserver' in window) {
      this.observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.loadImage(entry.target);
            this.observer.unobserve(entry.target);
          }
        });
      }, {
        rootMargin: '50px'
      });
    }

    // Process existing images
    this.processImages();
  }

  /**
   * Process all images on page
   */
  processImages() {
    const images = document.querySelectorAll('img[data-src], img[data-lazy]');
    images.forEach(img => {
      if (this.observer) {
        this.observer.observe(img);
      } else {
        // Fallback: load immediately
        this.loadImage(img);
      }
    });
  }

  /**
   * Load lazy image
   * @param {HTMLImageElement} img - Image element
   */
  loadImage(img) {
    const src = img.dataset.src || img.dataset.lazy;
    if (!src) return;

    // Use optimized format if available
    const optimizedSrc = this.getOptimizedSrc(src);
    
    img.src = optimizedSrc;
    img.classList.add('loaded');
    
    // Remove data attributes
    delete img.dataset.src;
    delete img.dataset.lazy;
  }

  /**
   * Get optimized image source
   * @param {string} src - Original source
   * @returns {string} Optimized source
   */
  getOptimizedSrc(src) {
    if (this.options.useAvif) {
      const avifSrc = src.replace(/\.(jpg|jpeg|png)$/i, '.avif');
      return avifSrc;
    } else if (this.options.useWebP) {
      const webpSrc = src.replace(/\.(jpg|jpeg|png)$/i, '.webp');
      return webpSrc;
    }
    return src;
  }

  /**
   * Create responsive image element
   * @param {Object} options - Image options
   * @returns {HTMLImageElement} Image element
   */
  createResponsiveImage(options = {}) {
    const img = document.createElement('img');
    
    // Set attributes
    if (options.src) {
      img.src = this.options.placeholder;
      img.dataset.src = options.src;
    }
    
    if (options.alt) img.alt = options.alt;
    if (options.className) img.className = options.className;
    if (options.loading === 'lazy') {
      img.dataset.lazy = options.src;
      img.src = this.options.placeholder;
    }

    // Add srcset for responsive images
    if (options.srcset) {
      img.srcset = options.srcset;
      img.sizes = options.sizes || '100vw';
    }

    // Observe if lazy loading
    if (this.observer && (img.dataset.src || img.dataset.lazy)) {
      this.observer.observe(img);
    }

    return img;
  }

  /**
   * Optimize existing image
   * @param {HTMLImageElement} img - Image element
   */
  optimizeImage(img) {
    // Add loading attribute
    if (!img.hasAttribute('loading')) {
      img.loading = 'lazy';
    }

    // Convert to lazy load if not already loaded
    if (!img.complete && !img.dataset.src) {
      img.dataset.src = img.src;
      img.src = this.options.placeholder;
      if (this.observer) {
        this.observer.observe(img);
      }
    }
  }
}

// Create singleton instance
const imageOptimizer = new ImageOptimizer();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ImageOptimizer, imageOptimizer };
}

// Make available globally
if (typeof window !== 'undefined') {
  window.ImageOptimizer = ImageOptimizer;
  window.imageOptimizer = imageOptimizer;
}

// Auto-initialize on load
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      imageOptimizer.init();
    });
  } else {
    imageOptimizer.init();
  }
}
