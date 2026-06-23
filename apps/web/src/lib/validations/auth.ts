/** Client-side validation helpers */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email.trim());
}

export function isValidPassword(password: string): boolean {
  return password.length >= 8;
}

export function isValidUsername(username: string): boolean {
  return username.trim().length >= 3 && /^[a-zA-Z0-9_]+$/.test(username);
}

export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

export function validateRegister(data: {
  username?: string;
  email?: string;
  password?: string;
}): ValidationResult {
  const errors: Record<string, string> = {};
  if (!data.username || !isValidUsername(data.username)) {
    errors.username = "Username must be 3+ alphanumeric characters";
  }
  if (!data.email || !isValidEmail(data.email)) {
    errors.email = "Valid email required";
  }
  if (!data.password || !isValidPassword(data.password)) {
    errors.password = "Password must be at least 8 characters";
  }
  return { valid: Object.keys(errors).length === 0, errors };
}

export function validateLogin(data: { email?: string; password?: string }): ValidationResult {
  const errors: Record<string, string> = {};
  if (!data.email || !isValidEmail(data.email)) errors.email = "Valid email required";
  if (!data.password) errors.password = "Password required";
  return { valid: Object.keys(errors).length === 0, errors };
}
