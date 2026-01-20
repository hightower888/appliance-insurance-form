/**
 * PDF Generator
 * Generate PDF documents from HTML templates
 * 
 * Note: Requires jsPDF library or similar
 * Include in HTML: <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
 */

class PDFGenerator {
  constructor() {
    this.jsPDF = null;
    this.initialized = false;
  }

  /**
   * Initialize PDF generator
   * @param {Object} jsPDFLib - jsPDF library instance (optional, will use window.jspdf if available)
   * @returns {Promise<void>}
   */
  async initialize(jsPDFLib = null) {
    if (this.initialized) return;
    
    // Try to get jsPDF from parameter, window, or load from CDN
    if (jsPDFLib) {
      this.jsPDF = jsPDFLib;
    } else if (typeof window !== 'undefined' && window.jspdf) {
      this.jsPDF = window.jspdf.jsPDF;
    } else if (typeof window !== 'undefined' && window.jsPDF) {
      this.jsPDF = window.jsPDF;
    } else {
      // Try to load from CDN
      await this.loadJsPDF();
    }
    
    if (!this.jsPDF) {
      console.warn('jsPDF library not found. PDF generation will not work.');
      console.warn('Include: <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>');
    }
    
    this.initialized = true;
  }

  /**
   * Load jsPDF from CDN
   * @returns {Promise<void>}
   */
  async loadJsPDF() {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined') {
        reject(new Error('Window object not available'));
        return;
      }
      
      // Check if already loaded
      if (window.jspdf || window.jsPDF) {
        this.jsPDF = window.jspdf?.jsPDF || window.jsPDF;
        resolve();
        return;
      }
      
      // Load from CDN
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
      script.onload = () => {
        this.jsPDF = window.jspdf?.jsPDF || window.jsPDF;
        resolve();
      };
      script.onerror = () => {
        reject(new Error('Failed to load jsPDF library'));
      };
      document.head.appendChild(script);
    });
  }

  /**
   * Generate PDF from HTML content
   * @param {string} html - HTML content
   * @param {Object} options - PDF generation options
   * @param {string} options.format - Page format ('a4', 'letter', etc.)
   * @param {string} options.orientation - Orientation ('portrait', 'landscape')
   * @param {string} options.filename - Output filename
   * @returns {Promise<Blob>} PDF blob
   */
  async generateFromHTML(html, options = {}) {
    if (!this.jsPDF) {
      await this.initialize();
    }
    
    if (!this.jsPDF) {
      throw new Error('jsPDF library not available');
    }
    
    const {
      format = 'a4',
      orientation = 'portrait',
      filename = 'document.pdf'
    } = options;
    
    // Create jsPDF instance
    const doc = new this.jsPDF({
      orientation,
      unit: 'mm',
      format
    });
    
    // For simple HTML, we can use html() method if available
    // For complex HTML, we might need html2canvas or similar
    try {
      // Method 1: Simple text extraction (fallback)
      if (typeof doc.html === 'function') {
        await doc.html(html, {
          callback: (doc) => {
            // PDF is ready
          },
          x: 10,
          y: 10,
          width: 190,
          windowWidth: 800
        });
      } else {
        // Fallback: Extract text and add to PDF
        const text = this.extractTextFromHTML(html);
        doc.text(text, 10, 10, {
          maxWidth: 190
        });
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      // Fallback to text extraction
      const text = this.extractTextFromHTML(html);
      doc.text(text, 10, 10, {
        maxWidth: 190
      });
    }
    
    // Generate blob
    const pdfBlob = doc.output('blob');
    return pdfBlob;
  }

  /**
   * Generate PDF from template
   * @param {string} template - Template content
   * @param {Object} data - Data to populate template
   * @param {Object} options - PDF generation options
   * @returns {Promise<Blob>} PDF blob
   */
  async generateFromTemplate(template, data, options = {}) {
    // Render template with data (assuming document-service handles this)
    const renderedHTML = this.renderTemplate(template, data);
    return await this.generateFromHTML(renderedHTML, options);
  }

  /**
   * Render template with data
   * @param {string} template - Template content
   * @param {Object} data - Data object
   * @returns {string} Rendered HTML
   */
  renderTemplate(template, data) {
    let rendered = template;
    
    // Replace {{variable}} placeholders
    Object.keys(data).forEach(key => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      const value = data[key] !== null && data[key] !== undefined ? String(data[key]) : '';
      rendered = rendered.replace(regex, value);
    });
    
    // Replace nested object properties {{object.property}}
    const nestedRegex = /\{\{(\w+)\.(\w+)\}\}/g;
    rendered = rendered.replace(nestedRegex, (match, objKey, propKey) => {
      if (data[objKey] && data[objKey][propKey] !== undefined) {
        return String(data[objKey][propKey]);
      }
      return '';
    });
    
    return rendered;
  }

  /**
   * Extract text from HTML (simple fallback)
   * @param {string} html - HTML content
   * @returns {string} Extracted text
   */
  extractTextFromHTML(html) {
    // Create temporary element
    const temp = document.createElement('div');
    temp.innerHTML = html;
    
    // Extract text content
    return temp.textContent || temp.innerText || '';
  }

  /**
   * Download PDF blob
   * @param {Blob} pdfBlob - PDF blob
   * @param {string} filename - Filename
   */
  downloadPDF(pdfBlob, filename = 'document.pdf') {
    const url = URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

// Create singleton instance
const pdfGenerator = new PDFGenerator();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { PDFGenerator, pdfGenerator };
}

// Make available globally
if (typeof window !== 'undefined') {
  window.pdfGenerator = pdfGenerator;
  window.PDFGenerator = PDFGenerator;
}
