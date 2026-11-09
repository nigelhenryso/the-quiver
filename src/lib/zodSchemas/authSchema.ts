
import { z } from 'zod';

/*

Current Zod authSchema:

Sign Up:
  Student:
  Email Input:
  1. Expected to end with @dlsu.edu.ph

  Password Input:
  1. Have 8 minimum characters
  2. Must have an uppercase letter
  3. Must have a lowercase letter
  4. Must contain a number
  5. Password input must be the same as Confirm Password

  


*/

const dlsuEmail = z
  .string()
  .trim()
  .min(1, 'Email is required.')
  .email('Please enter a valid email.')
  .refine(
    (email) => email.toLowerCase().endsWith('@dlsu.edu.ph'),
    'Please use your DLSU email.'
  );

export const signUpSchema = z
  .object({
    email: dlsuEmail,

    password: z
      .string()
      .min(8, 'Password must be at least 8 characters.')
      .regex(/[A-Z]/, 'Password must contain an uppercase letter.')
      .regex(/[a-z]/, 'Password must contain a lowercase letter.')
      .regex(/\d/, 'Password must contain a number.'),

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

export const loginSchema = z.object({
  email: dlsuEmail,
  password: z.string().min(1, 'Password is required.'),
});

export const COLLEGES = ['BAGCED', 'CCS', 'CLA', 'COS', 'GCOE', 'RVRCOB', 'SOE'] as const;
export type College = (typeof COLLEGES)[number];

const NAME_REGEX = /^[\p{L}][\p{L}\s.'-]*$/u;

const personName = (label: string) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required.`)
    .max(50, `${label} must be at most 50 characters.`)
    .regex(NAME_REGEX, `${label} can only contain letters, spaces, hyphens, apostrophes, and periods.`);

export const completeProfileSchema = z.object({
  firstName: personName('First name'),

  lastName: personName('Last name'),

  idNumber: z
    .string()
    .trim()
    .min(1, 'ID number is required.')
    .regex(/^\d{8}$/, 'ID number must be exactly 8 digits.'),

  college: z
    .string()
    .min(1, 'Please select your college.')
    .refine((value): value is College => (COLLEGES as readonly string[]).includes(value), 'Please select a valid college.'),

  // Accepts 09XXXXXXXXX, +639XXXXXXXXX or 639XXXXXXXXX (spaces/dashes allowed),
  // and stores it as 09XXXXXXXXX.
  contactNo: z
    .string()
    .trim()
    .min(1, 'Contact number is required.')
    .transform((value) => value.replace(/[\s-]/g, ''))
    .refine(
      (value) => /^(09|\+639|639)\d{9}$/.test(value),
      'Enter a valid PH mobile number (e.g. 09171234567).'
    )
    .transform((value) => value.replace(/^(\+639|639)/, '09')),
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
