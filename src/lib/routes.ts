import type { AccountType } from '@/src/services/accountService';

/** Org-only pages (from the `(organization)` route group). */
export const ORG_ROUTES = [
  '/dashboard',
  '/inventory', 
  '/orgOrders', 
  '/orgProfile', 
  '/productLine'
];

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
