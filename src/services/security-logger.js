/**
 * Security Event Logging Service
 * Logs security-related events to Firebase database for audit trail
 */

// Security event types
const SECURITY_EVENTS = {
  LOGIN_SUCCESS: 'login_success',
  LOGIN_FAILED: 'login_failed',
  LOGIN_LOCKED: 'login_locked',
  LOGOUT: 'logout',
  BRUTE_FORCE_DETECTED: 'brute_force_detected',
  UNAUTHORIZED_ACCESS: 'unauthorized_access',
  PASSWORD_CHANGE: 'password_change',
  ACCOUNT_CREATED: 'account_created',
  ACCOUNT_DELETED: 'account_deleted',
  ROLE_CHANGED: 'role_changed',
  SESSION_EXPIRED: 'session_expired'
};

// Security severity levels
const SEVERITY = {
  INFO: 'info',
  WARNING: 'warning',
  CRITICAL: 'critical'
};

/**
 * Log a security event to the database
 * @param {string} eventType - Type of security event
 * @param {Object} details - Additional details about the event
 * @param {string} severity - Severity level (info, warning, critical)
 * @returns {Promise<void>}
 */
async function logSecurityEvent(eventType, details = {}, severity = SEVERITY.INFO) {
  try {
    // Check authentication - try to sign in anonymously if needed
    let authUser = firebase.auth().currentUser;
    if (!authUser && typeof firebase !== 'undefined' && firebase.auth) {
      const auth = firebase.auth();
      try {
        await auth.signInAnonymously();
        authUser = auth.currentUser;
      } catch (error) {
        // Silently fail if not authenticated - security logging is non-critical
        console.warn('Could not sign in anonymously for security logging:', error);
        return;
      }
    }
    
    if (!authUser) {
      // Silently fail if not authenticated - security logging is non-critical
      console.warn('Cannot log security event: user not authenticated');
      return;
    }
    
    if (!database) {
      console.error('Database not initialized');
      return;
    }

    const timestamp = new Date().toISOString();
    const user = getCurrentUser();
    
    // Helper function to recursively clean objects
    const cleanObject = (obj) => {
      if (obj === null || obj === undefined) {
        return null;
      }
      if (typeof obj !== 'object' || Array.isArray(obj)) {
        return obj;
      }
      
      const cleaned = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          // Skip password-related fields
          if (key === 'password' || key === 'passwordHash') {
            continue;
          }
          
          const value = obj[key];
          // Skip undefined values
          if (value === undefined) {
            continue;
          }
          
          // Recursively clean nested objects
          if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
            const cleanedNested = cleanObject(value);
            if (cleanedNested !== null && Object.keys(cleanedNested).length > 0) {
              cleaned[key] = cleanedNested;
            }
          } else {
            cleaned[key] = value;
          }
        }
      }
      return cleaned;
    };
    
    const securityEvent = {
      eventType: eventType,
      severity: severity,
      timestamp: timestamp,
      userId: user?.uid || details.userId || null,
      userEmail: user?.email || details.userEmail || null,
      username: user?.username || details.username || null,
      ipAddress: details.ipAddress || null,
      userAgent: navigator.userAgent || null,
      details: cleanObject(details) || {}
    };

    // Log to database
    const securityLogsRef = database.ref('security_logs');
    await securityLogsRef.push(securityEvent);

    // Also log to console for debugging (remove in production if needed)
    if (severity === SEVERITY.CRITICAL || severity === SEVERITY.WARNING) {
      console.warn(`[SECURITY ${severity.toUpperCase()}] ${eventType}:`, securityEvent);
    }
  } catch (error) {
    // Don't throw - security logging should not break the app
    // Silently fail to prevent blocking authentication
    console.error('Error logging security event (non-blocking):', error);
  }
}

/**
 * Log successful login
 */
async function logLoginSuccess(userId, email, username) {
  await logSecurityEvent(
    SECURITY_EVENTS.LOGIN_SUCCESS,
    { userId, userEmail: email, username },
    SEVERITY.INFO
  );
}

/**
 * Log failed login attempt
 */
async function logLoginFailed(identifier, reason = 'Invalid credentials', attemptCount = 0) {
  const severity = attemptCount >= 4 ? SEVERITY.WARNING : SEVERITY.INFO;
  await logSecurityEvent(
    SECURITY_EVENTS.LOGIN_FAILED,
    { 
      identifier: identifier.toLowerCase(),
      reason,
      attemptCount,
      remainingAttempts: Math.max(0, 5 - attemptCount)
    },
    severity
  );
}

/**
 * Log account lockout due to brute force
 */
async function logAccountLocked(identifier, lockoutDuration) {
  await logSecurityEvent(
    SECURITY_EVENTS.LOGIN_LOCKED,
    {
      identifier: identifier.toLowerCase(),
      lockoutDuration,
      reason: 'Too many failed login attempts'
    },
    SEVERITY.CRITICAL
  );
}

/**
 * Log brute force detection
 */
async function logBruteForceDetected(identifier, attemptCount) {
  await logSecurityEvent(
    SECURITY_EVENTS.BRUTE_FORCE_DETECTED,
    {
      identifier: identifier.toLowerCase(),
      attemptCount,
      action: 'Account locked'
    },
    SEVERITY.CRITICAL
  );
}

/**
 * Log unauthorized access attempt
 */
async function logUnauthorizedAccess(route, userId = null) {
  await logSecurityEvent(
    SECURITY_EVENTS.UNAUTHORIZED_ACCESS,
    {
      route,
      userId,
      action: 'Access denied'
    },
    SEVERITY.WARNING
  );
}

/**
 * Log user logout
 */
async function logLogout(userId, email) {
  await logSecurityEvent(
    SECURITY_EVENTS.LOGOUT,
    { userId, userEmail: email },
    SEVERITY.INFO
  );
}

/**
 * Log account creation
 */
async function logAccountCreated(userId, email, role, createdBy) {
  await logSecurityEvent(
    SECURITY_EVENTS.ACCOUNT_CREATED,
    {
      userId,
      userEmail: email,
      role,
      createdBy
    },
    SEVERITY.INFO
  );
}

/**
 * Log account deletion
 */
async function logAccountDeleted(userId, email, deletedBy) {
  await logSecurityEvent(
    SECURITY_EVENTS.ACCOUNT_DELETED,
    {
      userId,
      userEmail: email,
      deletedBy
    },
    SEVERITY.WARNING
  );
}

/**
 * Log role change
 */
async function logRoleChanged(userId, email, oldRole, newRole, changedBy) {
  await logSecurityEvent(
    SECURITY_EVENTS.ROLE_CHANGED,
    {
      userId,
      userEmail: email,
      oldRole,
      newRole,
      changedBy
    },
    SEVERITY.WARNING
  );
}

/**
 * Get current user (helper function)
 */
function getCurrentUser() {
  try {
    const stored = sessionStorage.getItem('currentUser');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    // Ignore
  }
  return null;
}

// Export the security logger
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    logSecurityEvent,
    logLoginSuccess,
    logLoginFailed,
    logAccountLocked,
    logBruteForceDetected,
    logUnauthorizedAccess,
    logLogout,
    logAccountCreated,
    logAccountDeleted,
    logRoleChanged,
    SECURITY_EVENTS,
    SEVERITY
  };
}

// Make available globally
if (typeof window !== 'undefined') {
  window.securityLogger = {
    logSecurityEvent,
    logLoginSuccess,
    logLoginFailed,
    logAccountLocked,
    logBruteForceDetected,
    logUnauthorizedAccess,
    logLogout,
    logAccountCreated,
    logAccountDeleted,
    logRoleChanged,
    SECURITY_EVENTS,
    SEVERITY
  };
}
