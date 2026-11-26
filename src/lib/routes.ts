import type { AccountType } from '@/src/services/accountService';

/** Org-only pages (from the `(organization)` route group). */
export const ORG_ROUTES = [
  '/dashboard',
  '/sales',
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
  '/products',
  '/studentOrders',
  '/studentPreOrders',
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

/** Filters the org Orders page understands via `?status=` (used by dashboard redirects). */
export type OrgOrderFilter = 'pending-verification' | 'pending-claim' | 'completed';

/** Links used by the org dashboard so every redirect lives in one place. */
export const ORG_LINKS = {
  orders: (status?: OrgOrderFilter) => (status ? `/orgOrders?status=${status}` : '/orgOrders'),
  order: (orderId: string) => `/orgOrders?orderId=${encodeURIComponent(orderId)}`,
  // TODO: point to the sales page once it exists
  sales: '/dashboard',
};
