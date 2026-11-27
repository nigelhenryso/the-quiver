/**
 * Small helpers shared by the FRONTEND Login tests.
 * This file has no tests of its own (Jest only runs files ending in .test.ts / .test.tsx).
 */
import type { signInWithGoogle, signInWithPassword } from '@/src/services/authService';

export type SignInResult = Awaited<ReturnType<typeof signInWithPassword>>;
export type GoogleResult = Awaited<ReturnType<typeof signInWithGoogle>>;

export const VALID_EMAIL = 'juan_dela_cruz@dlsu.edu.ph';
export const VALID_PASSWORD = 'abc123pass';

// The login form fields are found by their placeholder text (same approach as Signup.test.tsx).
export const EMAIL_PLACEHOLDER = 'e.g. juan_dela_cruz@dlsu.edu.ph';
export const PASSWORD_PLACEHOLDER = 'Enter your password';

/** What Supabase returns when the email and password are correct. */
export function authSuccess(userId = 'user-123'): SignInResult {
  return {
    data: { user: { id: userId }, session: { access_token: 'fake-token' } },
    error: null,
  } as unknown as SignInResult;
}

/** What Supabase returns when the login fails (wrong password, unknown email, ...). */
export function authFailure(code: string, message: string): SignInResult {
  return {
    data: { user: null, session: null },
    error: { code, message },
  } as unknown as SignInResult;
}

/** What Supabase returns when the redirect to Google starts correctly. */
export function googleRedirectStarted(): GoogleResult {
  return {
    data: { provider: 'google', url: 'https://accounts.google.com/o/oauth2/v2/auth' },
    error: null,
  } as unknown as GoogleResult;
}

/** What Supabase returns when the redirect to Google cannot start. */
export function googleFailure(message: string): GoogleResult {
  return {
    data: { provider: 'google', url: null },
    error: { message },
  } as unknown as GoogleResult;
}