/**
 * ============================================================================================
 *  LAYER:  BACKEND        (sheet "02 - Login", rows LOGIN-16, 17, 18, 19)
 *  TOOL:   Jest, Node environment  (NOT Postman, see the note below)
 * ============================================================================================
 *
 *  WHY THESE FOUR ROWS ARE NOT IN THE POSTMAN COLLECTION
 *  The route GET /auth/callback only does its work when it receives a one-time code that GOOGLE
 *  issues after a real Google login. Postman cannot log in to Google, so it cannot produce that
 *  code. The sheet already planned these rows as "Jest (Node env) with a mocked session".
 *  The REAL route code (src/app/auth/callback/route.ts) runs here; only Supabase is faked.
 *  (The Postman collection next to this file covers every other BACKEND row.)
 *
 *  Order of the test cases in this file (ascending, same as the sheet):
 *    LOGIN-16  Google callback: registered student WITH a profile
 *    LOGIN-17  (TENTATIVE) Google callback: account WITHOUT a profile
 *    LOGIN-18  Google callback: organization account
 *    LOGIN-19  Google callback: non-DLSU Google account (+ edge cases of the same route)
 *
 * @jest-environment node
 */
import { GET as authCallback } from '@/src/app/auth/callback/route';
import { cookies } from 'next/headers';
import { createClient as createServerSupabase } from '@/src/lib/supabase/server';
import { OAUTH_INTENT_COOKIE } from '@/src/lib/supabase/oauthIntent';
import { getAccountType } from '@/src/services/accountService';
import type { AccountType } from '@/src/services/accountService';

// ---------- fakes: Supabase and the cookie store -------------------------------------------------
jest.mock('next/headers', () => ({ cookies: jest.fn() }));
jest.mock('@/src/lib/supabase/server', () => ({ createClient: jest.fn() }));
jest.mock('@/src/services/accountService', () => ({ getAccountType: jest.fn() }));

const ORIGIN = 'http://localhost:3000';
const DLSU_STUDENT_EMAIL = 'juan_dela_cruz@dlsu.edu.ph';

type CallbackSetup = {
  /** Which Google button was pressed (the app stores it in a cookie before leaving for Google). */
  intent?: 'login' | 'signup';
  /** The email of the Google account that came back. */
  email?: string;
  /** What the database says this user is. */
  account?: AccountType;
  /** Simulates Supabase refusing the one-time code. */
  exchangeFails?: boolean;
};

/** Calls the REAL route handler with fake Supabase pieces and returns where it redirects to. */
async function runCallback(query: string, setup: CallbackSetup = {}) {
  const cookieStore = {
    get: jest.fn((name: string) =>
      setup.intent && name === OAUTH_INTENT_COOKIE ? { name, value: setup.intent } : undefined
    ),
    delete: jest.fn(),
  };
  jest.mocked(cookies).mockResolvedValue(cookieStore as never);

  const supabase = {
    auth: {
      exchangeCodeForSession: jest.fn().mockResolvedValue(
        setup.exchangeFails
          ? { data: { user: null }, error: { message: 'bad code' } }
          : { data: { user: { id: 'user-1', email: setup.email ?? DLSU_STUDENT_EMAIL } }, error: null }
      ),
      signOut: jest.fn(),
    },
    rpc: jest.fn(),
  };
  jest.mocked(createServerSupabase).mockResolvedValue(supabase as never);
  jest.mocked(getAccountType).mockResolvedValue(setup.account ?? 'student');

  const response = await authCallback(new Request(`${ORIGIN}/auth/callback${query}`));
  return { status: response.status, location: response.headers.get('location'), supabase };
}

beforeEach(() => {
  jest.clearAllMocks();
});

// ===========================================================================================
//  LOGIN-16
// ===========================================================================================
describe('LOGIN-16 [BACKEND] Google callback: registered student WITH a profile', () => {
  it('redirects to /landing', async () => {
    const result = await runCallback('?code=abc', { account: 'student' });

    expect(result.status).toBe(307);
    expect(result.location).toBe(`${ORIGIN}/landing`);
    expect(result.supabase.auth.signOut).not.toHaveBeenCalled();
  });
});

// ===========================================================================================
//  LOGIN-17
// ===========================================================================================
describe('LOGIN-17 [BACKEND] (TENTATIVE) Google callback: account WITHOUT a profile', () => {
  // NOTE: the sheet expects "/landing + Complete Your Profile". The real route behaves differently
  // depending on the button that was pressed. These two tests describe exactly what it does today.
  it('"Log in with Google": rejects it with "no account", deletes the new auth user and signs out', async () => {
    const result = await runCallback('?code=abc', { intent: 'login', account: 'new' });

    expect(result.location).toBe(`${ORIGIN}/?auth_error=no_account`);
    expect(result.supabase.rpc).toHaveBeenCalledWith('delete_new_oauth_user');
    expect(result.supabase.auth.signOut).toHaveBeenCalledTimes(1);
  });

  it('"Sign up with Google": sends the user back to "/" with the Complete Your Profile modal open', async () => {
    const result = await runCallback('?code=abc', { intent: 'signup', account: 'new' });

    expect(result.location).toBe(`${ORIGIN}/?complete_profile=1`);
    expect(result.supabase.auth.signOut).not.toHaveBeenCalled();
  });
});

// ===========================================================================================
//  LOGIN-18
// ===========================================================================================
describe('LOGIN-18 [BACKEND] Google callback: organization account', () => {
  it('redirects to /dashboard', async () => {
    const result = await runCallback('?code=abc', { email: 'lscs@dlsu.edu.ph', account: 'organization' });

    expect(result.status).toBe(307);
    expect(result.location).toBe(`${ORIGIN}/dashboard`);
  });
});

// ===========================================================================================
//  LOGIN-19
// ===========================================================================================
describe('LOGIN-19 [BACKEND] Google callback: non-DLSU Google account', () => {
  // NOTE: the sheet says "neither DLSU nor a whitelisted organization". The code has no whitelist:
  // ANY email that does not end in @dlsu.edu.ph is rejected, so that is what is tested.
  it('signs the user out and redirects with auth_error=domain', async () => {
    const result = await runCallback('?code=abc', { email: 'someone@gmail.com', account: 'student' });

    expect(result.location).toBe(`${ORIGIN}/?auth_error=domain`);
    expect(result.supabase.auth.signOut).toHaveBeenCalledTimes(1);
  });

  it('is case-insensitive, so "@DLSU.EDU.PH" is accepted', async () => {
    const result = await runCallback('?code=abc', { email: 'JUAN_DELA_CRUZ@DLSU.EDU.PH', account: 'student' });

    expect(result.location).toBe(`${ORIGIN}/landing`);
  });

  // Extra edge cases of the same route (not separate rows in the sheet):
  it('redirects with auth_error=cancelled when the user cancels on the Google screen', async () => {
    const result = await runCallback('?error=access_denied');

    expect(result.location).toBe(`${ORIGIN}/?auth_error=cancelled`);
  });

  it('redirects with auth_error=failed when there is no code', async () => {
    const result = await runCallback('');

    expect(result.location).toBe(`${ORIGIN}/?auth_error=failed`);
  });

  it('redirects with auth_error=failed when Supabase refuses the code', async () => {
    const result = await runCallback('?code=abc', { exchangeFails: true });

    expect(result.location).toBe(`${ORIGIN}/?auth_error=failed`);
  });
});