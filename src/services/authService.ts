import { supabase, clearAuthCookies, clearRememberMe } from '@/src/lib/supabase/client';
import type { Student } from '@/src/types/Student';
import type { CompleteProfileOutput } from '@/src/lib/zodSchemas/authSchema';

import { STUDENT_TABLE } from '@/src/lib/supabase/tables';

/**
 * Full URL of the auth callback route (`/auth/callback`) on the current site.
 */
const callbackUrl = () => `${window.location.origin}/auth/callback`;

/**
 * Sends the browser to Google's account picker ("Sign up / Log in with Google" buttons).
 * Google then returns the user to `/auth/callback`, which finishes the login.
 *
 * @returns `{ data, error }` (never throws):
 * - success: the page navigates away to Google.
 * - failure: `error` is set (the redirect couldn't start).
 */
export async function signInWithGoogle() {
  return supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: callbackUrl(),
      queryParams: { hd: 'dlsu.edu.ph', prompt: 'select_account' },
    },
  });
}

/** Result of `signUpWithPassword()`, simplified so the modal can switch on `status`. */
export type SignUpResult =
  | { status: 'error'; message: string }
  | { status: 'exists' }
  | { status: 'confirm_email' }
  | { status: 'signed_in' };

/**
 * Creates an email + password account. Does not create the `Student` row.
 *
 * @returns A `SignUpResult` (not `{ data, error }`):
 * - `error`: sign-up failed; `message` explains why.
 * - `exists`: an account with this email already exists.
 * - `confirm_email`: account created, a 6-digit code was emailed.
 * - `signed_in`: email confirmation is off, so the user is already logged in.
 */
export async function signUpWithPassword(email: string, password: string): Promise<SignUpResult> {
  const { data, error } = await supabase.auth.signUp({
    email: email.trim().toLowerCase(),
    password,
    options: { emailRedirectTo: callbackUrl() },
  });

  if (error) {
    if (/already registered|already exists/i.test(error.message)) return { status: 'exists' };
    return { status: 'error', message: error.message };
  }
  if (data.user && data.user.identities?.length === 0) return { status: 'exists' };
  if (data.session) return { status: 'signed_in' };
  return { status: 'confirm_email' };
}

/**
 * Checks the 6-digit code from the sign-up email. On success the user is logged in.
 *
 * @returns `{ data, error }` (never throws):
 * - correct code: `data.user` and `data.session` are set, `error` is `null`.
 * - wrong or expired code: `data.user` and `data.session` are `null`, and `error` is set
 */

export async function verifyEmailOtp(email: string, token: string) {
  return supabase.auth.verifyOtp({
    email: email.trim().toLowerCase(),
    token,
    type: 'email',
  });
}

/**
 * Emails a new sign-up code. Does not log the user in.
 *
 * @returns `{ data, error }` (never throws):
 * - sent: `error` is `null`.
 * - not sent: `error` is set, usually `over_email_send_rate_limit` (requested too soon).
 */
export async function resendEmailOtp(email: string) {
  return supabase.auth.resend({
    type: 'signup',
    email: email.trim().toLowerCase(),
  });
}

/**
 * Turns an error from `verifyEmailOtp()` / `resendEmailOtp()` into text for the user.
 *
 * @returns A string (not a Promise):
 * - wrong/expired code or rate limit: a friendly message.
 * - anything else: Supabase's original message.
 */
export function otpErrorMessage(error: { code?: string; message: string }) {
  if (error.code === 'otp_expired' || /expired|invalid/i.test(error.message))
    return 'That code is incorrect or has expired. Check your latest email or resend a new code.';
  if (error.code === 'over_email_send_rate_limit' || /rate limit/i.test(error.message))
    return 'Too many codes requested. Please wait a minute and try again.';
  return error.message;
}

/**
 * Logs in with email + password.
 *
 * @returns `{ data, error }` (never throws):
 * - success: `data.user` and `data.session` are set, `error` is `null`.
 * - failure: `data.user` and `data.session` are `null`, and `error` is set
 *   (wrong password, or email not confirmed yet).
 */
export async function signInWithPassword(email: string, password: string) {
  return supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });
}

/**
 * Checks whether a user has a `Student` row (finished "Complete your profile").
 *
 * @returns `{ data, error }` (never throws):
 * - row exists: `data` is `{ student_id }`.
 * - no row: `data` is `null`.
 * - query failed: `error` is set.
 */
export async function getStudentProfile(userId: string) {
  return supabase
    .from(STUDENT_TABLE)
    .select('student_id')
    .eq('student_id', userId)
    .maybeSingle<Pick<Student, 'student_id'>>();
}

/**
 * Inserts the logged-in user's `Student` row from the "Complete your profile" form.
 *
 * @returns `{ data, error }` (never throws). `data` is always `null`:
 * - saved: `error` is `null`.
 * - failed: `error` is set (row already exists, or RLS blocked it).
 */
export async function createStudentProfile(
  userId: string,
  email: string,
  profile: CompleteProfileOutput
) {
  return supabase.from(STUDENT_TABLE).insert({
    student_id: userId,
    dlsu_email: email.toLowerCase(),
    dlsu_id_no: profile.idNumber,
    college: profile.college,
    first_name: profile.firstName,
    last_name: profile.lastName,
    contact_no: profile.contactNo,
    birthday: profile.birthday,
  });
}

/**
 * Logs out on this device: ends the session, deletes the auth cookies and resets "Remember me".
 *
 * @returns `{ error }` only (no `data`):
 * - `error` is `null` or set, but the cookies are cleared either way,
 *   so the user is logged out in this browser.
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut({ scope: 'local' });
  clearAuthCookies();
  clearRememberMe();
  return { error };
}
