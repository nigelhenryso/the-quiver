import type { SupabaseClient } from '@supabase/supabase-js';
import { ORGANIZATION_TABLE, STUDENT_TABLE } from './tables';

/**
 * What kind of account a logged-in auth user is:
 * - `organization`: has an `Organization` row (`organization_id` = auth user id).
 *   Org accounts are created manually in Supabase; orgs can only log in, never sign up.
 * - `student`: has a `Student` row (`student_id` = auth user id).
 * - `new`: has neither yet, i.e. a student who still needs to complete their profile.
 */
export type AccountType = 'organization' | 'student' | 'new';

/** Org-only pages (from the `(organization)` route group). */
export const ORG_ROUTES = ['/dashboard', '/inventory', '/orgOrders', '/orgProfile', '/productLine'];

/** Student-only pages (from the `(student)` route group). */
export const STUDENT_ROUTES = [
  '/landing',
  '/cart',
  '/checkout',
  '/organizations',
  '/studentOrders',
  '/studentProfile',
  '/success',
];

/** Where each account type lands after logging in. */
export const HOME_ROUTE: Record<Exclude<AccountType, 'new'>, string> = {
  organization: '/dashboard',
  student: '/landing',
};

/** True if `pathname` is one of `routes` or a sub-path of one (e.g. `/inventory/123`). */
export function isInRoutes(pathname: string, routes: string[]) {
  return routes.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

/**
 * Finds out whether a user is an organization, a student, or a new student.
 * Works with any Supabase client (browser, server or proxy).
 *
 * Organization is checked first so an org account is never treated as a new
 * student and sent to "Complete your profile".
 *
 * Needs RLS select policies that let a user read their own `Organization` / `Student` row.
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
