
import { z } from 'zod';

/*
Current Zod authSchema:
    
    Email Input:
    1. Minimum 9 characters : VAL-INP-04, VAL-INP-06
    2. Domain expected to end with @dlsu.edu.ph : VAL-INP-01, VAL-INP-02, VAL-INP-03, VAL-INP-07
    3. Names are separated with _, and characters can be unicode : VAL-INP-08
    4. Email Input is trimmed : VAL-INP-05

    Password Input:
    1. Have 8 minimum characters : VAL-INP-11, VAL-INP-12, VAL-INP-14
    2. Password input must be the same as Confirm Password
    3. Password Inputs are trimmed : VAL-INP-13

    First Name:
    1. Minimum 1 Unicode Character : VAL-INP-19, VAL-INP-22, VAL-INP-23, VAL-INP-25, 
    2. Rejects strings with numbers in them: VAL-INP-20
    3. Rejects strings with punctuation charcaters that are not ',' or '.': VAL-INP-21, VAL-INP-24

    Last Name:
    1. Minimum 1 Unicode Character : VAL-INP-19, VAL-INP-22, VAL-INP-23, VAL-INP-25, 
    2. Rejects strings with numbers in them: VAL-INP-20
    3. Rejects strings with punctuation charcaters that are not ',' or '.': VAL-INP-21, VAL-INP-24

    ID Number:
    1. Must be between 8-9 characters.

    College:
    1. Must be in 'BAGCED', 'CCS', 'CLA', 'COS', 'GCOE', 'RVRCOB', 'SOE'
  
    Birthday:
    1. Required, in YYYY-MM-DD format (from the date picker)
    2. Must be a real date, not in the future, and not before 1900

    Contact No (Optional):
    1. Should only be numerical : VAL-INP-28
    2. Minimum one character 
    2. Should either be 7 or 11 characters (09XX - XXX - XXXX) in length : VAL-INP-30

*/

const dlsuEmail = z
  .string()
  .trim()
  .min(9, 'Email is required.')
  .email('Enter a valid email address.')
  .regex(
    /^[\p{L}\p{N}]+(_[\p{L}\p{N}]+)+@dlsu\.edu\.ph$/iu,
    'Use your DLSU Email.'
  )
  .refine(
    (email) => email.toLowerCase().endsWith('@dlsu.edu.ph'),
    'Use your DLSU Email.'
  );

export const signUpSchema = z
  .object({
    email: dlsuEmail,

    password: z
      .string()
      .min(8, 'Password must be at least 8 characters.'),

    confirmPassword: z
      .string()
      .min(1, 'Please confirm your password.'),
  })
  .refine(
    (data) => data.password === data.confirmPassword,
    {
      message: 'Passwords do not match.',
      path: ['confirmPassword'],
    }
  );

/**
 * Log in accepts any @dlsu.edu.ph address (no `first_last` underscore rule),
 * because organization accounts also log in here and org emails like
 * `lscs@dlsu.edu.ph` don't follow the student format.
 */
const loginEmail = z
  .string()
  .trim()
  .min(1, 'Email is required.')
  .email('Enter a valid email address.')
  .refine(
    (email) => email.toLowerCase().endsWith('@dlsu.edu.ph'),
    'Use your DLSU Email.'
  );

export const loginSchema = z.object({
  email: loginEmail,
  password: z.string().min(1, 'Enter your password.'),
});

export const COLLEGES = ['BAGCED', 'CCS', 'CLA', 'COS', 'GCOE', 'RVRCOB', 'SOE'] as const;
export type College = (typeof COLLEGES)[number];

export const completeProfileSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(1, `First Name is required.`)
    .regex(/^[\p{L}\s'.,-]+$/u, `First Name must contain only letters.`),

  lastName: z
    .string()
    .trim()
    .min(1, `Last Name is required.`)
    .regex(/^[\p{L}\s'.,-]+$/u, `Last Name must contain only letters.`),

  idNumber: z
    .string()
    .trim()
    .min(1, 'ID number is required.')
    .regex(/^\d{8,9}$/, 'Please enter a valid ID number'),
    

  college: z
    .string()
    .min(1, 'Please select your college.')
    .refine((value): value is College => (COLLEGES as readonly string[]).includes(value), 'Please select a valid college.'),

  birthday: z
    .string()
    .min(1, 'Birthday is required.')
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Enter a valid birthday.')
    .refine((value) => {
      // Rejects impossible dates like 2004-02-31 (JS would silently roll them over).
      const [y, m, d] = value.split('-').map(Number);
      const date = new Date(y, m - 1, d);
      return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
    }, 'Enter a valid birthday.')
    .refine((value) => new Date(`${value}T00:00:00`) <= new Date(), 'Birthday cannot be in the future.')
    .refine((value) => Number(value.slice(0, 4)) >= 1900, 'Enter a valid birthday.'),

  contactNo: z
  .string()
  .trim()
  .transform((value) => value.replace(/[\s-]/g, ''))
  .refine(
    (value) =>
      /^\d+$/.test(value) &&
      (value.length === 7 ||
        (value.length === 11 && value.startsWith('09'))),
    'Enter a valid contact number.'
  )
  .optional(),
});

export type SignUpInput = z.input<typeof signUpSchema>;
export type LoginInput = z.input<typeof loginSchema>;
export type CompleteProfileInput = z.input<typeof completeProfileSchema>;
export type CompleteProfileOutput = z.output<typeof completeProfileSchema>;

/** Turns a failed safeParse into `{ field: firstMessage }`. */
export function toFieldErrors<T extends string>(
  issues: { path: PropertyKey[]; message: string }[]
): Partial<Record<T, string>> {
  const fieldErrors: Partial<Record<T, string>> = {};
  for (const issue of issues) {
    const field = issue.path[0] as T;
    if (field && !fieldErrors[field]) fieldErrors[field] = issue.message;
  }
  return fieldErrors;
}
