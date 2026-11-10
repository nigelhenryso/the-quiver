import { supabase, clearAuthCookies, clearRememberMe } from '@/src/lib/supabase/client';
import type { Student } from '@/src/types/Student';
import type { CompleteProfileOutput } from '@/src/lib/zodSchemas/authSchema';

import { STUDENT_TABLE } from '@/src/lib/supabase/tables';

/**
 * Full URL of the auth callback route (`/auth/callback`) on the current site.
 */
const callbackUrl = () => `${window.location.origin}/auth/callback`;

/**
 * Starts "Sign in with Google" by redirecting the browser to Google.
 *
 * The account picker is pre-filtered to `dlsu.edu.ph`, but that is only a hint;
 * the real domain check happens in `/auth/callback`, which signs out non-DLSU accounts.
 * Call `setRememberMe()` before this so the session cookies get the right lifetime.
 *
 * @returns Supabase's `{ data, error }`. `error` is set only if the redirect couldn't start;
 *          on success the page navigates away.
 */
export async function signInWithGoogle() {
  return supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: callbackUrl(),
      // `hd` only pre-filters the Google account picker; the callback route enforces the domain.
      queryParams: { hd: 'dlsu.edu.ph', prompt: 'select_account' },
    },
  });
}

/**
 * Outcome of {@link signUpWithPassword}:
 * - `error`: sign-up failed; `message` is shown to the user.
 * - `exists`: an account with this email already exists.
 * - `confirm_email`: account created; a 6-digit code was emailed (see {@link verifyEmailOtp}).
 * - `signed_in`: email confirmation is off, so the user is already logged in.
 */
export type SignUpResult =
  | { status: 'error'; message: string }
  | { status: 'exists' }
  | { status: 'confirm_email' }
  | { status: 'signed_in' };

/**
 * Creates an email + password account. Does NOT create the `Student` row;
 * that happens later in {@link createStudentProfile}.
 *
 * @param email - Trimmed and lower-cased before sending.
 * @param password - Sent as-is; validate it with the Zod schema first.
 * @returns A {@link SignUpResult} instead of the raw Supabase response, so the modal
 *          can switch on `status`.
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
  // With email confirmation on, Supabase returns a user with no identities for an existing email.
  if (data.user && data.user.identities?.length === 0) return { status: 'exists' };
  // Email confirmation off → session is returned immediately.
  if (data.session) return { status: 'signed_in' };
  return { status: 'confirm_email' };
}

/**
 * Checks the 6-digit code from the "Confirm signup" email. On success the user is signed in
 *
 * @param email - The address the code was sent to; trimmed and lower-cased.
 * @param token - The 6-digit code the user typed.
 * @returns Supabase's `{ data, error }`. Pass `error` to {@link otpErrorMessage} for display.
 */
export async function verifyEmailOtp(email: string, token: string) {
  return supabase.auth.verifyOtp({
    email: email.trim().toLowerCase(),
    token,
    type: 'email',
  });
}

/**
 * Emails a new sign-up code. Also used when an unconfirmed account tries to log in.
 *
 * @param email - Trimmed and lower-cased.
 * @returns Supabase's `{ data, error }`. Pass `error` to {@link otpErrorMessage} for display.
 */
export async function resendEmailOtp(email: string) {
  return supabase.auth.resend({
    type: 'signup',
    email: email.trim().toLowerCase(),
  });
}

/**
 * Turns a Supabase OTP error into a user-friendly message for the verify screen.
 * Handles expired/invalid codes and the email rate limit; anything else returns
 * Supabase's original message.
 *
 * @param error - The `error` from {@link verifyEmailOtp} or {@link resendEmailOtp}.
 * @returns Text to show under the code input.
 */
export function otpErrorMessage(error: { code?: string; message: string }) {
  if (error.code === 'otp_expired' || /expired|invalid/i.test(error.message))
    return 'That code is incorrect or has expired. Check your latest email or resend a new code.';
  if (error.code === 'over_email_send_rate_limit' || /rate limit/i.test(error.message))
    return 'Too many codes requested. Please wait a minute and try again.';
  return error.message;
}

/**
 * Logs in with email + password. On success the session cookies are written.
 * Call `setRememberMe()` first so the cookies get the right lifetime.
 * If the email isn't confirmed yet this returns an error; `LogInModal` then resends a code.
 *
 * @param email - Trimmed and lower-cased.
 * @param password - Sent as-is.
 * @returns Supabase's `{ data, error }`; `data.user` is the logged-in auth user.
 */
export async function signInWithPassword(email: string, password: string) {
  return supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });
}

/**
 * Checks whether a user has finished their profile (has a `Student` row).
 * Only `student_id` is selected, so use it as an existence check, not to load the profile.
 *
 * @param userId - The auth user's id (`user.id`), which equals `Student.student_id`.
 * @returns `{ data, error }`; `data` is `null` when no profile exists yet.
 *          Needs an RLS select policy on `Student` for `auth.uid() = student_id`.
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
 * @param userId - The auth user's id; becomes `Student.student_id`. Must be the logged-in user, or the RLS insert policy (`auth.uid() = student_id`) rejects it.
 * @param email - The auth email; lower-cased and saved as `dlsu_email`.
 * @param profile - Form values already validated by `completeProfileSchema`.
 * @returns Supabase's `{ data, error }`. Inserting twice for the same user fails
 *          because `student_id` is the primary key.
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
 * Logs out on this device: ends the Supabase session, deletes all auth cookies
 * (even if the network call fails) and resets the "Remember me" choice.
 * `scope: 'local'` keeps the user's sessions on other devices logged in.
 *
 * @returns `{ error }` from Supabase. The cookies are cleared either way, so the user
 *          is logged out in this browser even when `error` is set.
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut({ scope: 'local' });
  clearAuthCookies();
  clearRememberMe();
  return { error };
}
