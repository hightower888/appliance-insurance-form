/**
 * Mobile Camera Component (Phase 4A)
 * Camera integration for mobile devices
 */

class MobileCamera {
  constructor(options = {}) {
    this.options = {
      onPhotoCapture: options.onPhotoCapture || null,
      onError: options.onError || null,
      maxFileSize: options.maxFileSize || 5 * 1024 * 1024, // 5MB
      allowedTypes: options.allowedTypes || ['image/jpeg', 'image/png', 'image/webp'],
      ...options
    };

    this.isSupported = this.checkSupport();
  }

  /**
   * Check if camera is supported
   * @returns {boolean} True if supported
   */
  checkSupport() {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia) ||
           !!(navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia);
  }

  /**
   * Create camera input button
   * @param {HTMLElement} container - Container element
   * @param {Object} options - Options
   */
  createCameraButton(container, options = {}) {
    if (!container) return null;

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'btn btn-secondary mobile-camera-button';
    button.innerHTML = '📷 Take Photo';
    button.setAttribute('aria-label', 'Take photo with camera');
    button.style.minHeight = '44px';
    button.style.minWidth = '44px';

    button.addEventListener('click', () => {
      this.openCamera(options);
    });

    container.appendChild(button);
    return button;
  }

  /**
   * Open camera interface
   * @param {Object} options - Options
   */
  async openCamera(options = {}) {
    if (!this.isSupported) {
      this.showError('Camera not supported on this device');
      return;
    }

    try {
      // Create file input with camera capture
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.capture = 'environment'; // Use back camera if available
      input.style.display = 'none';

      input.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          this.handleFile(file, options);
        }
        // Cleanup
        if (input.parentNode) {
          input.parentNode.removeChild(input);
        }
      });

      document.body.appendChild(input);
      input.click();
    } catch (error) {
      console.error('MobileCamera: Error opening camera:', error);
      this.showError('Failed to open camera: ' + error.message);
    }
  }

  /**
   * Handle captured file
   * @param {File} file - Image file
   * @param {Object} options - Options
   */
  async handleFile(file, options = {}) {
    // Validate file type
    if (!this.options.allowedTypes.includes(file.type)) {
      this.showError('Invalid file type. Please use JPEG, PNG, or WebP.');
      return;
    }

    // Validate file size
    if (file.size > this.options.maxFileSize) {
      this.showError(`File too large. Maximum size: ${Math.round(this.options.maxFileSize / 1024 / 1024)}MB`);
      return;
    }

    try {
      // Read file as data URL
      const dataUrl = await this.readFileAsDataURL(file);
      
      // Call callback
      if (this.options.onPhotoCapture) {
        this.options.onPhotoCapture({
          file: file,
          dataUrl: dataUrl,
          name: file.name,
          size: file.size,
          type: file.type
        });
      }

      // Show success
      if (typeof showCRMMessage === 'function') {
        showCRMMessage('Photo captured successfully', 'success');
      }
    } catch (error) {
      console.error('MobileCamera: Error processing file:', error);
      this.showError('Failed to process photo: ' + error.message);
    }
  }

  /**
   * Read file as data URL
   * @param {File} file - File to read
   * @returns {Promise<string>} Data URL
   */
  readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }

  /**
   * Show error message
   * @param {string} message - Error message
   */
  showError(message) {
    if (this.options.onError) {
      this.options.onError(message);
    } else if (typeof showCRMMessage === 'function') {
      showCRMMessage(message, 'error');
    } else {
      alert(message);
    }
  }

  /**
   * Create image preview
   * @param {string} dataUrl - Image data URL
   * @param {HTMLElement} container - Container element
   * @returns {HTMLElement} Preview element
   */
  createPreview(dataUrl, container) {
    if (!container) return null;

    const preview = document.createElement('div');
    preview.className = 'mobile-camera-preview';
    preview.innerHTML = `
      <img src="${dataUrl}" alt="Captured photo" style="max-width: 100%; max-height: 200px; border-radius: 8px;">
      <button class="btn btn-xs btn-danger" onclick="this.parentElement.remove()" style="margin-top: 8px;">Remove</button>
    `;

    container.appendChild(preview);
    return preview;
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { MobileCamera };
}

// Make available globally
if (typeof window !== 'undefined') {
  window.MobileCamera = MobileCamera;
}
