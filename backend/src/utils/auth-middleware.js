import { extractToken, verifyToken } from './jwt.js';
import { error } from './response.js';

/**
 * Authenticate the request by verifying the JWT token.
 * Returns the decoded user payload or an error response.
 */
export function authenticate(event) {
  const token = extractToken(event);
  if (!token) {
    return { error: error('Authentication required', 401) };
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return { error: error('Invalid or expired token', 401) };
  }

  return { user: decoded };
}

/**
 * Authorize the request by checking if the user has one of the allowed roles.
 */
export function authorize(user, allowedRoles) {
  if (!allowedRoles.includes(user.role)) {
    return error('Insufficient permissions', 403);
  }
  return null;
}
