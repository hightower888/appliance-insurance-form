/**
 * Comments Panel Component (Phase 4C)
 * UI component for displaying and managing lead comments
 */

class CommentsPanel {
  constructor(containerId, leadId = null) {
    this.containerId = containerId;
    this.leadId = leadId;
    this.container = null;
    this.isEditing = new Map(); // commentId -> boolean
    this.init();
  }

  /**
   * Initialize comments panel
   */
  init() {
    this.container = document.getElementById(this.containerId);
    if (!this.container) {
      console.error(`Comments panel container not found: ${this.containerId}`);
      return;
    }

    // Listen for comment updates
    if (window.commentsService) {
      window.commentsService.addListener((event, data) => {
        if (this.leadId && data.leadId === this.leadId) {
          this.render();
        }
      });
    }
  }

  /**
   * Set lead ID
   * @param {string} leadId - Lead ID
   */
  setLeadId(leadId) {
    this.leadId = leadId;
    this.render();
  }

  /**
   * Render comments panel
   */
  render() {
    if (!this.container || !this.leadId) {
      return;
    }

    const comments = window.commentsService ? window.commentsService.getComments(this.leadId) : [];
    const commentCount = comments.length;

    this.container.innerHTML = `
      <div class="comments-panel">
        <div class="comments-header">
          <h3>Comments <span class="comment-count">(${commentCount})</span></h3>
        </div>
        <div class="comments-list" id="commentsList-${this.leadId}">
          ${this.renderComments(comments)}
        </div>
        <div class="comment-form">
          <textarea 
            id="newCommentText-${this.leadId}" 
            class="comment-input" 
            placeholder="Add a comment..."
            rows="3"
            aria-label="Comment text"
          ></textarea>
          <button 
            class="btn btn-primary btn-sm" 
            onclick="commentsPanel_${this.leadId}.addComment()"
            aria-label="Add comment"
          >
            Add Comment
          </button>
        </div>
      </div>
    `;

    // Make panel instance accessible for onclick handlers
    window[`commentsPanel_${this.leadId}`] = this;
  }

  /**
   * Render comments list
   * @param {Array} comments - Comments array
   * @returns {string} HTML string
   */
  renderComments(comments) {
    if (comments.length === 0) {
      return '<p class="no-comments">No comments yet. Be the first to comment!</p>';
    }

    // Sort by timestamp (newest first)
    const sortedComments = [...comments].sort((a, b) => b.timestamp - a.timestamp);

    return sortedComments.map(comment => this.renderComment(comment)).join('');
  }

  /**
   * Render single comment
   * @param {Object} comment - Comment object
   * @returns {string} HTML string
   */
  renderComment(comment) {
    const isEditing = this.isEditing.get(comment.id) || false;
    const isOwner = comment.userId === (window.commentsService?.getCurrentUserId() || '');
    const formattedTime = window.commentsService ? window.commentsService.formatTimestamp(comment.timestamp) : '';

    if (isEditing) {
      return `
        <div class="comment-item" data-comment-id="${comment.id}">
          <div class="comment-edit-form">
            <textarea 
              id="editCommentText-${comment.id}" 
              class="comment-input" 
              rows="3"
              aria-label="Edit comment"
            >${this.escapeHtml(comment.text)}</textarea>
            <div class="comment-actions">
              <button 
                class="btn btn-primary btn-sm" 
                onclick="commentsPanel_${this.leadId}.saveEdit('${comment.id}')"
                aria-label="Save comment"
              >
                Save
              </button>
              <button 
                class="btn btn-secondary btn-sm" 
                onclick="commentsPanel_${this.leadId}.cancelEdit('${comment.id}')"
                aria-label="Cancel edit"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      `;
    }

    return `
      <div class="comment-item" data-comment-id="${comment.id}">
        <div class="comment-header">
          <div class="comment-author">
            <strong>${this.escapeHtml(comment.userName || 'Anonymous')}</strong>
            ${comment.edited ? '<span class="comment-edited-badge">(edited)</span>' : ''}
          </div>
          <div class="comment-meta">
            <span class="comment-time">${formattedTime}</span>
            ${isOwner ? `
              <div class="comment-actions-inline">
                <button 
                  class="btn-icon" 
                  onclick="commentsPanel_${this.leadId}.startEdit('${comment.id}')"
                  aria-label="Edit comment"
                  title="Edit"
                >
                  ✏️
                </button>
                <button 
                  class="btn-icon" 
                  onclick="commentsPanel_${this.leadId}.deleteComment('${comment.id}')"
                  aria-label="Delete comment"
                  title="Delete"
                >
                  🗑️
                </button>
              </div>
            ` : ''}
          </div>
        </div>
        <div class="comment-body">
          ${this.escapeHtml(comment.text).replace(/\n/g, '<br>')}
        </div>
      </div>
    `;
  }

  /**
   * Add new comment
   */
  async addComment() {
    if (!this.leadId || !window.commentsService) {
      return;
    }

    const textarea = document.getElementById(`newCommentText-${this.leadId}`);
    const text = textarea?.value.trim();

    if (!text) {
      alert('Please enter a comment');
      return;
    }

    try {
      await window.commentsService.addComment(this.leadId, text);
      textarea.value = '';
      this.render();
    } catch (error) {
      console.error('Failed to add comment:', error);
      alert('Failed to add comment: ' + error.message);
    }
  }

  /**
   * Start editing comment
   * @param {string} commentId - Comment ID
   */
  startEdit(commentId) {
    this.isEditing.set(commentId, true);
    this.render();
  }

  /**
   * Save edited comment
   * @param {string} commentId - Comment ID
   */
  async saveEdit(commentId) {
    if (!this.leadId || !window.commentsService) {
      return;
    }

    const textarea = document.getElementById(`editCommentText-${commentId}`);
    const newText = textarea?.value.trim();

    if (!newText) {
      alert('Comment cannot be empty');
      return;
    }

    try {
      await window.commentsService.editComment(this.leadId, commentId, newText);
      this.isEditing.set(commentId, false);
      this.render();
    } catch (error) {
      console.error('Failed to edit comment:', error);
      alert('Failed to edit comment: ' + error.message);
    }
  }

  /**
   * Cancel editing comment
   * @param {string} commentId - Comment ID
   */
  cancelEdit(commentId) {
    this.isEditing.set(commentId, false);
    this.render();
  }

  /**
   * Delete comment
   * @param {string} commentId - Comment ID
   */
  async deleteComment(commentId) {
    if (!this.leadId || !window.commentsService) {
      return;
    }

    if (!confirm('Are you sure you want to delete this comment?')) {
      return;
    }

    try {
      await window.commentsService.deleteComment(this.leadId, commentId);
      this.render();
    } catch (error) {
      console.error('Failed to delete comment:', error);
      alert('Failed to delete comment: ' + error.message);
    }
  }

  /**
   * Escape HTML
   * @param {string} text - Text to escape
   * @returns {string} Escaped text
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CommentsPanel };
}

// Make available globally
if (typeof window !== 'undefined') {
  window.CommentsPanel = CommentsPanel;
}
