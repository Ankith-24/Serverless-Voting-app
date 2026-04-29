const ALLOWED_EMAIL_DOMAIN = '@pollapp.com';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Sanitize a string: trim whitespace and remove control characters.
 */
export function sanitize(str) {
  if (typeof str !== 'string') return '';
  // eslint-disable-next-line no-control-regex
  return str.trim().replace(/[\x00-\x1F\x7F]/g, '');
}

/**
 * Validate an email address format and enforce the @pollapp.com domain.
 * Returns { valid, error }.
 */
export function validateEmail(email) {
  if (!email || typeof email !== 'string') {
    return { valid: false, error: 'Email is required' };
  }

  const cleaned = email.trim().toLowerCase();

  if (!EMAIL_REGEX.test(cleaned)) {
    return { valid: false, error: 'Invalid email format' };
  }

  if (!cleaned.endsWith(ALLOWED_EMAIL_DOMAIN)) {
    return { valid: false, error: `Email must end with ${ALLOWED_EMAIL_DOMAIN}` };
  }

  return { valid: true, email: cleaned };
}

/**
 * Validate password strength.
 */
export function validatePassword(password) {
  if (!password || typeof password !== 'string') {
    return { valid: false, error: 'Password is required' };
  }

  if (password.length < 6) {
    return { valid: false, error: 'Password must be at least 6 characters' };
  }

  if (password.length > 128) {
    return { valid: false, error: 'Password must be at most 128 characters' };
  }

  return { valid: true };
}

/**
 * Validate a name field.
 */
export function validateName(name) {
  if (!name || typeof name !== 'string') {
    return { valid: false, error: 'Name is required' };
  }

  const cleaned = sanitize(name);

  if (cleaned.length < 1 || cleaned.length > 100) {
    return { valid: false, error: 'Name must be between 1 and 100 characters' };
  }

  return { valid: true, name: cleaned };
}

/**
 * Validate poll title.
 */
export function validatePollTitle(title) {
  if (!title || typeof title !== 'string') {
    return { valid: false, error: 'Poll title is required' };
  }

  const cleaned = sanitize(title);

  if (cleaned.length < 1 || cleaned.length > 200) {
    return { valid: false, error: 'Title must be between 1 and 200 characters' };
  }

  return { valid: true, title: cleaned };
}

/**
 * Validate poll options array.
 */
export function validatePollOptions(options) {
  if (!options || !Array.isArray(options)) {
    return { valid: false, error: 'Options must be an array' };
  }

  if (options.length < 2) {
    return { valid: false, error: 'At least 2 options are required' };
  }

  if (options.length > 20) {
    return { valid: false, error: 'Maximum 20 options allowed' };
  }

  const cleaned = options
    .map((opt) => sanitize(typeof opt === 'string' ? opt : opt?.text || ''))
    .filter((opt) => opt.length > 0);

  if (cleaned.length < 2) {
    return { valid: false, error: 'At least 2 non-empty options are required' };
  }

  const unique = new Set(cleaned.map((o) => o.toLowerCase()));
  if (unique.size !== cleaned.length) {
    return { valid: false, error: 'Options must be unique' };
  }

  return { valid: true, options: cleaned };
}

/**
 * Validate date range for polls.
 */
export function validateDateRange(startDate, endDate) {
  if (!startDate || !endDate) {
    return { valid: false, error: 'Start date and end date are required' };
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime())) {
    return { valid: false, error: 'Invalid start date' };
  }

  if (isNaN(end.getTime())) {
    return { valid: false, error: 'Invalid end date' };
  }

  if (end <= start) {
    return { valid: false, error: 'End date must be after start date' };
  }

  return { valid: true, startDate: start.toISOString(), endDate: end.toISOString() };
}

/**
 * Safely parse JSON body from Lambda event.
 */
export function parseBody(event) {
  try {
    return JSON.parse(event.body || '{}');
  } catch {
    return null;
  }
}
