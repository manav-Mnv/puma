import { isValidPhone, normalizePhone, normalizeStudentId, validateStudentId } from '../student-id';

const oct2026 = new Date('2026-10-15T00:00:00Z');

describe('student ID', () => {
  it('accepts UG, PG and other program codes', () => {
    expect(validateStudentId('25UG030303', oct2026)).toBeNull();
    expect(validateStudentId('24PG1234', oct2026)).toBeNull();
    expect(validateStudentId('26DIP00123', oct2026)).toBeNull();
  });

  it('accepts the permanent all-digit enrollment number', () => {
    expect(validateStudentId('2503031461401', oct2026)).toBeNull();
    expect(validateStudentId(' 2503 0314 61401 ', oct2026)).toBeNull();
    expect(validateStudentId('250303146', oct2026)).toBe('invalid_student_id'); // too short
    expect(validateStudentId('2703031461401', oct2026)).toBe('invalid_student_id_year');
  });

  it('normalises spaces and case', () => {
    expect(normalizeStudentId(' 25ug 030303 ')).toBe('25UG030303');
    expect(validateStudentId(' 25ug030303 ', oct2026)).toBeNull();
  });

  it('rejects malformed IDs', () => {
    expect(validateStudentId('UG25030303', oct2026)).toBe('invalid_student_id');
    expect(validateStudentId('25U030303', oct2026)).toBe('invalid_student_id');
    expect(validateStudentId('25UG12', oct2026)).toBe('invalid_student_id');
    expect(validateStudentId('', oct2026)).toBe('invalid_student_id');
  });

  it('rejects a joining year in the future', () => {
    expect(validateStudentId('27UG030303', oct2026)).toBe('invalid_student_id_year');
  });
});

describe('phone', () => {
  it('normalises +91 and spaces', () => {
    expect(normalizePhone('+91 98765 43210')).toBe('9876543210');
    expect(isValidPhone('+91 98765 43210')).toBe(true);
  });

  it('rejects non-Indian mobile numbers', () => {
    expect(isValidPhone('12345')).toBe(false);
    expect(isValidPhone('5876543210')).toBe(false);
  });
});
