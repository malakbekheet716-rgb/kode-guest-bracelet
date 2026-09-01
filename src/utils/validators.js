const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(value) {
  if (!value || !value.trim()) return 'required';
  if (!EMAIL_RE.test(value.trim())) return 'invalidEmail';
  return null;
}

export function validatePassword(value, { minLength = 6 } = {}) {
  if (!value) return 'required';
  if (value.length < minLength) return 'passwordTooShort';
  return null;
}

export function validateRequired(value) {
  if (value === undefined || value === null || String(value).trim() === '') {
    return 'required';
  }
  return null;
}

export function validateQuantity(value, { max }) {
  const n = Number(value);
  if (value === '' || value === null || value === undefined) return 'required';
  if (!Number.isInteger(n)) return 'invalidQuantity';
  if (n < 1) return 'quantityTooLow';
  if (n > max) return 'quantityTooHigh';
  return null;
}

export function passwordsMatch(a, b) {
  return a === b ? null : 'passwordMismatch';
}
