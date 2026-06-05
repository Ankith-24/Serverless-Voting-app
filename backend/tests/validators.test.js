import { describe, it, expect } from 'vitest';
import {
  validateEmail,
  validatePassword,
  validateName,
  validateElectionTitle,
  validateDescription,
  validateStudentId,
  validateCandidates,
  validateDateRange,
  sanitize,
  parseBody,
} from '../src/utils/validators.js';

describe('Email validation', () => {
  it('rejects empty email', () => {
    expect(validateEmail('')).toEqual({ valid: false, error: 'Email is required' });
    expect(validateEmail(null)).toEqual({ valid: false, error: 'Email is required' });
  });

  it('rejects invalid email format', () => {
    expect(validateEmail('notanemail')).toEqual({ valid: false, error: 'Invalid email format' });
  });

  it('rejects non-@pollapp.com emails', () => {
    const result = validateEmail('alice@gmail.com');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('@pollapp.com');
  });

  it('rejects non-@pollapp.com with similar domains', () => {
    expect(validateEmail('alice@notpollapp.com').valid).toBe(false);
    expect(validateEmail('alice@pollapp.org').valid).toBe(false);
    expect(validateEmail('alice@pollapp.com.evil.com').valid).toBe(false);
  });

  it('accepts valid @pollapp.com emails', () => {
    const result = validateEmail('alice@pollapp.com');
    expect(result.valid).toBe(true);
    expect(result.email).toBe('alice@pollapp.com');
  });

  it('normalizes email to lowercase and trims', () => {
    const result = validateEmail('  Alice@PolLApp.com  ');
    expect(result.valid).toBe(true);
    expect(result.email).toBe('alice@pollapp.com');
  });
});

describe('Password validation', () => {
  it('rejects empty password', () => {
    expect(validatePassword('')).toEqual({ valid: false, error: 'Password is required' });
  });

  it('rejects short passwords', () => {
    expect(validatePassword('abc')).toEqual({ valid: false, error: 'Password must be at least 6 characters' });
  });

  it('rejects passwords over 128 chars', () => {
    expect(validatePassword('a'.repeat(129)).valid).toBe(false);
  });

  it('accepts valid passwords', () => {
    expect(validatePassword('password123').valid).toBe(true);
  });
});

describe('Name validation', () => {
  it('rejects empty name', () => {
    expect(validateName('').valid).toBe(false);
  });

  it('accepts valid name and sanitizes', () => {
    const result = validateName('  Alice Student  ');
    expect(result.valid).toBe(true);
    expect(result.name).toBe('Alice Student');
  });
});

describe('Election title validation', () => {
  it('rejects empty title', () => {
    expect(validateElectionTitle('').valid).toBe(false);
    expect(validateElectionTitle('').error).toContain('Election title');
  });

  it('accepts valid title', () => {
    const result = validateElectionTitle('Student Council President 2026');
    expect(result.valid).toBe(true);
    expect(result.title).toBe('Student Council President 2026');
  });
});

describe('Description validation', () => {
  it('accepts empty description', () => {
    expect(validateDescription('').valid).toBe(true);
    expect(validateDescription(null).valid).toBe(true);
  });

  it('rejects description over 1000 chars', () => {
    expect(validateDescription('a'.repeat(1001)).valid).toBe(false);
  });

  it('accepts valid description', () => {
    const result = validateDescription('Annual election for student council');
    expect(result.valid).toBe(true);
  });
});

describe('Student ID validation', () => {
  it('accepts empty studentId', () => {
    expect(validateStudentId('').valid).toBe(true);
    expect(validateStudentId(null).valid).toBe(true);
  });

  it('rejects non-alphanumeric', () => {
    expect(validateStudentId('STU-001').valid).toBe(false);
  });

  it('rejects over 20 chars', () => {
    expect(validateStudentId('A'.repeat(21)).valid).toBe(false);
  });

  it('accepts valid student ID', () => {
    const result = validateStudentId('STU2026001');
    expect(result.valid).toBe(true);
    expect(result.studentId).toBe('STU2026001');
  });
});

describe('Candidates validation', () => {
  it('rejects non-array', () => {
    expect(validateCandidates('not-array').valid).toBe(false);
  });

  it('rejects less than 2 candidates', () => {
    expect(validateCandidates([{ name: 'Alice' }]).valid).toBe(false);
  });

  it('rejects more than 20 candidates', () => {
    const many = Array.from({ length: 21 }, (_, i) => ({ name: `Candidate ${i}` }));
    expect(validateCandidates(many).valid).toBe(false);
  });

  it('rejects duplicate names', () => {
    expect(validateCandidates([{ name: 'Alice' }, { name: 'alice' }]).valid).toBe(false);
  });

  it('accepts valid candidates as objects', () => {
    const result = validateCandidates([
      { name: 'Alice', bio: 'CS major', party: 'Innovators' },
      { name: 'Bob', bio: 'Engineering major' },
    ]);
    expect(result.valid).toBe(true);
    expect(result.candidates).toHaveLength(2);
    expect(result.candidates[0].name).toBe('Alice');
    expect(result.candidates[0].party).toBe('Innovators');
  });

  it('accepts valid candidates as strings', () => {
    const result = validateCandidates(['Alice', 'Bob']);
    expect(result.valid).toBe(true);
    expect(result.candidates).toHaveLength(2);
  });
});

describe('Date range validation', () => {
  it('rejects missing dates', () => {
    expect(validateDateRange(null, '2030-12-31').valid).toBe(false);
    expect(validateDateRange('2030-01-01', null).valid).toBe(false);
  });

  it('rejects end before start', () => {
    expect(validateDateRange('2030-12-31', '2030-01-01').valid).toBe(false);
  });

  it('rejects start date in the past', () => {
    const result = validateDateRange('2020-01-01', '2030-12-31');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('past');
  });

  it('accepts valid future date range', () => {
    const result = validateDateRange('2030-01-01', '2030-12-31');
    expect(result.valid).toBe(true);
    expect(result.startDate).toBeDefined();
    expect(result.endDate).toBeDefined();
  });
});

describe('Sanitize', () => {
  it('removes control characters', () => {
    expect(sanitize('hello\x00world')).toBe('helloworld');
  });

  it('trims whitespace', () => {
    expect(sanitize('  hello  ')).toBe('hello');
  });

  it('returns empty for non-string', () => {
    expect(sanitize(123)).toBe('');
    expect(sanitize(null)).toBe('');
  });
});

describe('parseBody', () => {
  it('parses valid JSON', () => {
    expect(parseBody({ body: '{"key":"value"}' })).toEqual({ key: 'value' });
  });

  it('returns null for invalid JSON', () => {
    expect(parseBody({ body: 'not-json' })).toBe(null);
  });

  it('returns empty object for missing body', () => {
    expect(parseBody({})).toEqual({});
  });
});
