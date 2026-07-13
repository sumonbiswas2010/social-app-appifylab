import { AppError } from './errors';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function assert(condition, message, status = 422) {
  if (!condition) throw new AppError(message, status);
}

export function cleanString(value, { field, min = 1, max = 255, required = true }) {
  const v = typeof value === 'string' ? value.trim() : '';
  if (!v) {
    if (required) throw new AppError(`${field} is required`, 422);
    return '';
  }
  assert(v.length >= min, `${field} must be at least ${min} characters`);
  assert(v.length <= max, `${field} must be at most ${max} characters`);
  return v;
}

export function cleanEmail(value) {
  const v = cleanString(value, { field: 'Email', max: 255 }).toLowerCase();
  assert(EMAIL_RE.test(v), 'Invalid email address');
  return v;
}
