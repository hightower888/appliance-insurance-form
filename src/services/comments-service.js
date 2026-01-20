/**
 * Comments Service (Phase 4C)
 * Lead comments and collaboration features
 */

class CommentsService {
  constructor() {
    this.comments = new Map(); // leadId -> comments array
    this.listeners = [];
    // Delay initialization until Firebase is ready
    if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length > 0) {
      this.init();
    } else {
      // Wait a bit for Firebase to initialize, then try again
      setTimeout(() => {
        if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length > 0) {
          // Check if Firebase Auth is ready
          const auth = firebase.auth();
          if (auth && auth.currentUser) {
            this.init();
          } else {
            // Try to sign in anonymously if needed
            if (auth) {
              auth.signInAnonymously().then(() => {
                this.init();
              }).catch(() => {
                this.loadCommentsFromLocalStorage();
              });
            } else {
              this.loadCommentsFromLocalStorage();
            }
          }
        } else {
          this.loadCommentsFromLocalStorage();
        }
      }, 100);
    }
  }

  /**
   * Initialize comments service
   */
  init() {
    // Check if Firebase is initialized before loading comments
    if (typeof firebase === 'undefined' || !firebase.apps || firebase.apps.length === 0) {
      console.warn('Firebase not initialized, delaying comments service initialization');
      // Try again when Firebase is ready
      setTimeout(() => {
        if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length > 0) {
          const auth = firebase.auth();
          if (auth && auth.currentUser) {
            this.loadComments();
          } else if (auth) {
            auth.signInAnonymously().then(() => {
              this.loadComments();
            }).catch(() => {
              this.loadCommentsFromLocalStorage();
            });
          } else {
            this.loadCommentsFromLocalStorage();
          }
        } else {
          this.loadCommentsFromLocalStorage();
        }
      }, 100);
      return;
    }
    
    // Load comments from Firebase or localStorage
    this.loadComments();
  }

  /**
   * Add comment to lead
   * @param {string} leadId - Lead ID
   * @param {string} text - Comment text
   * @param {string} userId - User ID
   * @param {string} userName - User name
   * @returns {Promise<Object>} Created comment
   */
  async addComment(leadId, text, userId = null, userName = null) {
    if (!leadId || !text || text.trim().length === 0) {
      throw new Error('Lead ID and comment text are required');
    }

    const comment = {
      id: this.generateId(),
      leadId,
      text: text.trim(),
      userId: userId || this.getCurrentUserId(),
      userName: userName || this.getCurrentUserName(),
      timestamp: Date.now(),
      edited: false,
      editedAt: null
    };

    // Add to local storage
    if (!this.comments.has(leadId)) {
      this.comments.set(leadId, []);
    }
    this.comments.get(leadId).push(comment);

    // Save to Firebase
    await this.saveCommentToFirebase(comment);

    // Notify listeners
    this.notifyListeners('comment_added', { leadId, comment });

    return comment;
  }

  /**
   * Edit comment
   * @param {string} leadId - Lead ID
   * @param {string} commentId - Comment ID
   * @param {string} newText - New comment text
   * @returns {Promise<Object>} Updated comment
   */
  async editComment(leadId, commentId, newText) {
    const comments = this.comments.get(leadId);
    if (!comments) {
      throw new Error('Lead not found');
    }

    const comment = comments.find(c => c.id === commentId);
    if (!comment) {
      throw new Error('Comment not found');
    }

    // Check permissions
    if (comment.userId !== this.getCurrentUserId()) {
      throw new Error('You can only edit your own comments');
    }

    comment.text = newText.trim();
    comment.edited = true;
    comment.editedAt = Date.now();

    // Save to Firebase
    await this.saveCommentToFirebase(comment);

    // Notify listeners
    this.notifyListeners('comment_edited', { leadId, comment });

    return comment;
  }

  /**
   * Delete comment
   * @param {string} leadId - Lead ID
   * @param {string} commentId - Comment ID
   * @returns {Promise<void>}
   */
  async deleteComment(leadId, commentId) {
    const comments = this.comments.get(leadId);
    if (!comments) {
      throw new Error('Lead not found');
    }

    const comment = comments.find(c => c.id === commentId);
    if (!comment) {
      throw new Error('Comment not found');
    }

    // Check permissions
    if (comment.userId !== this.getCurrentUserId()) {
      throw new Error('You can only delete your own comments');
    }

    // Remove from local storage
    const index = comments.indexOf(comment);
    comments.splice(index, 1);

    // Delete from Firebase
    await this.deleteCommentFromFirebase(leadId, commentId);

    // Notify listeners
    this.notifyListeners('comment_deleted', { leadId, commentId });

    return;
  }

  /**
   * Get comments for lead
   * @param {string} leadId - Lead ID
   * @returns {Array} Comments array
   */
  getComments(leadId) {
    return this.comments.get(leadId) || [];
  }

  /**
   * Get comment count for lead
   * @param {string} leadId - Lead ID
   * @returns {number} Comment count
   */
  getCommentCount(leadId) {
    return this.getComments(leadId).length;
  }

  /**
   * Load comments from Firebase
   * @param {string} leadId - Optional lead ID to load specific lead's comments
   */
  async loadComments(leadId = null) {
    try {
      // Check if Firebase is initialized
      if (typeof firebase === 'undefined' || !firebase.apps || firebase.apps.length === 0) {
        console.warn('Firebase not initialized, using localStorage fallback');
        this.loadCommentsFromLocalStorage();
        return;
      }
      
      // Check if Firebase Auth user exists, try to sign in anonymously if needed
      let authUser = firebase.auth().currentUser;
      if (!authUser && typeof firebase !== 'undefined' && firebase.auth) {
        const auth = firebase.auth();
        try {
          await auth.signInAnonymously();
          authUser = auth.currentUser;
        } catch (error) {
          console.warn('Could not sign in anonymously, using localStorage fallback:', error);
          this.loadCommentsFromLocalStorage();
          return;
        }
      }
      
      if (!authUser) {
        console.warn('User not authenticated, using localStorage fallback');
        this.loadCommentsFromLocalStorage();
        return;
      }
      
      const database = firebase.database();
      const commentsRef = database.ref('comments');

      if (leadId) {
        const leadCommentsRef = commentsRef.child(leadId);
        leadCommentsRef.on('value', (snapshot) => {
          const commentsData = snapshot.val() || {};
          const comments = Object.values(commentsData);
          this.comments.set(leadId, comments);
          this.notifyListeners('comments_loaded', { leadId, comments });
        });
      } else {
        commentsRef.on('value', (snapshot) => {
          const allComments = snapshot.val() || {};
          Object.keys(allComments).forEach(leadId => {
            const comments = Object.values(allComments[leadId]);
            this.comments.set(leadId, comments);
          });
          this.notifyListeners('comments_loaded', { comments: allComments });
        });
      }
    } catch (error) {
      console.error('Failed to load comments:', error);
      // Fallback to localStorage
      this.loadCommentsFromLocalStorage();
    }
  }

  /**
   * Save comment to Firebase
   * @param {Object} comment - Comment object
   */
  async saveCommentToFirebase(comment) {
    try {
      const database = firebase.database();
      const commentRef = database.ref(`comments/${comment.leadId}/${comment.id}`);
      await commentRef.set(comment);
    } catch (error) {
      console.error('Failed to save comment to Firebase:', error);
      // Fallback to localStorage
      this.saveCommentsToLocalStorage();
    }
  }

  /**
   * Delete comment from Firebase
   * @param {string} leadId - Lead ID
   * @param {string} commentId - Comment ID
   */
  async deleteCommentFromFirebase(leadId, commentId) {
    try {
      const database = firebase.database();
      const commentRef = database.ref(`comments/${leadId}/${commentId}`);
      await commentRef.remove();
    } catch (error) {
      console.error('Failed to delete comment from Firebase:', error);
      // Fallback to localStorage
      this.saveCommentsToLocalStorage();
    }
  }

  /**
   * Load comments from localStorage
   */
  loadCommentsFromLocalStorage() {
    try {
      const stored = localStorage.getItem('leadComments');
      if (stored) {
        const commentsData = JSON.parse(stored);
        Object.entries(commentsData).forEach(([leadId, comments]) => {
          this.comments.set(leadId, comments);
        });
      }
    } catch (error) {
      console.error('Failed to load comments from localStorage:', error);
    }
  }

  /**
   * Save comments to localStorage
   */
  saveCommentsToLocalStorage() {
    try {
      const commentsData = {};
      this.comments.forEach((comments, leadId) => {
        commentsData[leadId] = comments;
      });
      localStorage.setItem('leadComments', JSON.stringify(commentsData));
    } catch (error) {
      console.error('Failed to save comments to localStorage:', error);
    }
  }

  /**
   * Add event listener
   * @param {Function} callback - Callback function
   */
  addListener(callback) {
    this.listeners.push(callback);
  }

  /**
   * Remove event listener
   * @param {Function} callback - Callback function
   */
  removeListener(callback) {
    const index = this.listeners.indexOf(callback);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  /**
   * Notify listeners
   * @param {string} event - Event name
   * @param {Object} data - Event data
   */
  notifyListeners(event, data) {
    this.listeners.forEach(callback => {
      try {
        callback(event, data);
      } catch (error) {
        console.error('Error in comment listener:', error);
      }
    });
  }

  /**
   * Get current user ID
   * @returns {string} User ID
   */
  getCurrentUserId() {
    const user = firebase.auth().currentUser;
    return user ? user.uid : 'anonymous';
  }

  /**
   * Get current user name
   * @returns {string} User name
   */
  getCurrentUserName() {
    const user = firebase.auth().currentUser;
    return user ? (user.displayName || user.email || 'Anonymous') : 'Anonymous';
  }

  /**
   * Generate unique ID
   * @returns {string} Unique ID
   */
  generateId() {
    return `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Format timestamp for display
   * @param {number} timestamp - Timestamp
   * @returns {string} Formatted date
   */
  formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) {
      return 'Just now';
    } else if (diffMins < 60) {
      return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    }
  }
}

// Create singleton instance
const commentsService = new CommentsService();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CommentsService, commentsService };
}

// Make available globally
if (typeof window !== 'undefined') {
  window.CommentsService = CommentsService;
  window.commentsService = commentsService;
}
