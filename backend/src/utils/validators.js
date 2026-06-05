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
 * Validate election title.
 */
export function validateElectionTitle(title) {
  if (!title || typeof title !== 'string') {
    return { valid: false, error: 'Election title is required' };
  }

  const cleaned = sanitize(title);

  if (cleaned.length < 1 || cleaned.length > 200) {
    return { valid: false, error: 'Title must be between 1 and 200 characters' };
  }

  return { valid: true, title: cleaned };
}

/**
 * Validate election description (optional).
 */
export function validateDescription(description) {
  if (!description || typeof description !== 'string') {
    return { valid: true, description: '' };
  }

  const cleaned = sanitize(description);

  if (cleaned.length > 1000) {
    return { valid: false, error: 'Description must be at most 1000 characters' };
  }

  return { valid: true, description: cleaned };
}

/**
 * Validate student ID (optional, alphanumeric, max 20 chars).
 */
export function validateStudentId(studentId) {
  if (!studentId || typeof studentId !== 'string') {
    return { valid: true, studentId: '' };
  }

  const cleaned = sanitize(studentId);

  if (cleaned.length > 20) {
    return { valid: false, error: 'Student ID must be at most 20 characters' };
  }

  if (!/^[a-zA-Z0-9]+$/.test(cleaned)) {
    return { valid: false, error: 'Student ID must be alphanumeric' };
  }

  return { valid: true, studentId: cleaned };
}

/**
 * Validate candidates array for an election.
 * Each candidate: { name (required), bio (optional), party (optional), position (optional) }
 */
export function validateCandidates(candidates) {
  if (!candidates || !Array.isArray(candidates)) {
    return { valid: false, error: 'Candidates must be an array' };
  }

  if (candidates.length < 2) {
    return { valid: false, error: 'At least 2 candidates are required' };
  }

  if (candidates.length > 20) {
    return { valid: false, error: 'Maximum 20 candidates allowed' };
  }

  const cleaned = [];
  for (const candidate of candidates) {
    // Support both string and object formats
    if (typeof candidate === 'string') {
      const name = sanitize(candidate);
      if (!name) continue;
      cleaned.push({ name });
    } else if (candidate && typeof candidate === 'object') {
      const name = sanitize(candidate.name || '');
      if (!name) continue;
      cleaned.push({
        name,
        bio: sanitize(candidate.bio || ''),
        party: sanitize(candidate.party || ''),
        position: sanitize(candidate.position || ''),
      });
    }
  }

  if (cleaned.length < 2) {
    return { valid: false, error: 'At least 2 candidates with valid names are required' };
  }

  const uniqueNames = new Set(cleaned.map((c) => c.name.toLowerCase()));
  if (uniqueNames.size !== cleaned.length) {
    return { valid: false, error: 'Candidate names must be unique' };
  }

  return { valid: true, candidates: cleaned };
}

/**
 * Validate date range for elections.
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

  // Reject start dates in the past (with 5 minute grace period)
  const now = new Date();
  now.setMinutes(now.getMinutes() - 5);
  if (start < now) {
    return { valid: false, error: 'Start date cannot be in the past' };
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
