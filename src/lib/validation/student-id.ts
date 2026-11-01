// Mirrors the database rules in complete_onboarding (SRS §3 AUTH-4), so the
// form can give instant feedback. The database remains the source of truth.

// Temporary ID (25UG024310) or permanent enrollment number (2503031461401).
export const STUDENT_ID_PATTERN = /^([0-9]{2}[A-Z]{2,5}[0-9]{3,8}|[0-9]{10,15})$/;

export function normalizeStudentId(raw: string): string {
  return raw.replace(/\s/g, '').toUpperCase();
}

export type StudentIdError = 'invalid_student_id' | 'invalid_student_id_year';

export function validateStudentId(raw: string, now: Date = new Date()): StudentIdError | null {
  const id = normalizeStudentId(raw);
  if (!STUDENT_ID_PATTERN.test(id)) return 'invalid_student_id';
  if (Number(id.slice(0, 2)) > now.getFullYear() % 100) return 'invalid_student_id_year';
  return null;
}

export function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  return digits.length === 12 && digits.startsWith('91') ? digits.slice(2) : digits;
}

export function isValidPhone(raw: string): boolean {
  return /^[6-9][0-9]{9}$/.test(normalizePhone(raw));
}
