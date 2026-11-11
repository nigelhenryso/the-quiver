import type { SupabaseClient } from '@supabase/supabase-js';
import { ORGANIZATION_TABLE, STUDENT_TABLE } from '@/src/lib/supabase/tables';

/**
 * What kind of account a logged-in auth user is:
 * - `organization`: has an `Organization` row (`organization_id` = auth user id).
 * - `student`: has a `Student` row (`student_id` = auth user id).
 * - `new`: student that has auth but no row in student table - should prompt for their details in the Complete Your Profile modal if they click login
 */
export type AccountType = 'organization' | 'student' | 'new';

/**
 * Finds out whether a user is an organization, a student, or a new student.
 * Organization is checked first so an org account is never treated as a 
 * New student and sent to "Complete your profile".
 *
 * @param supabase - The Supabase client to query with.
 * @param userId - The auth user's id.
 * @returns `'organization'`, `'student'` or `'new'`.
 */
export async function getAccountType(supabase: SupabaseClient, userId: string): Promise<AccountType> {
  const [{ data: org }, { data: student }] = await Promise.all([
    supabase.from(ORGANIZATION_TABLE).select('organization_id').eq('organization_id', userId).maybeSingle(),
    supabase.from(STUDENT_TABLE).select('student_id').eq('student_id', userId).maybeSingle(),
  ]);

  if (org) return 'organization';
  if (student) return 'student';
  return 'new';
}
