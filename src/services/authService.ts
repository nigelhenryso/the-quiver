import { supabase, clearAuthCookies, clearRememberMe } from '@/src/lib/supabase/client';
import type { Student } from '@/src/types/Student';
import type { CompleteProfileOutput } from '@/src/lib/zodSchemas/authSchema';

import { STUDENT_TABLE } from '@/src/lib/supabase/tables';

const callbackUrl = () => `${window.location.origin}/auth/callback`;

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

export type SignUpResult =
  | { status: 'error'; message: string }
  | { status: 'exists' }
  | { status: 'confirm_email' }
  | { status: 'signed_in' };

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

export async function signInWithPassword(email: string, password: string) {
  return supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });
}

export async function getStudentProfile(userId: string) {
  return supabase
    .from(STUDENT_TABLE)
    .select('student_id')
    .eq('student_id', userId)
    .maybeSingle<Pick<Student, 'student_id'>>();
}

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
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut({ scope: 'local' });
  clearAuthCookies();
  clearRememberMe();
  return { error };
}
