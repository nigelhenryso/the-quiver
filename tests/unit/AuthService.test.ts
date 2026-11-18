/**
 * Service-level checks for the login functions in src/services/authService.ts.
 *
 *   LOGIN-15  the Google sign-in uses the google provider and returns to /auth/callback
 *   LOGIN-09  (client part) the email is trimmed and lower-cased before it is sent
 *
 * The Supabase client is replaced with fake functions, so nothing leaves the computer.
 */
import { serializeCookieHeader } from '@supabase/ssr';
import { supabase } from '@/src/lib/supabase/client';
import { OAUTH_INTENT_COOKIE } from '@/src/lib/supabase/oauthIntent';
import { signInWithGoogle, signInWithPassword } from '@/src/services/authService';

jest.mock('@supabase/ssr', () => ({
  serializeCookieHeader: jest.fn(() => 'quiver-oauth-intent=login; Path=/'),
}));

jest.mock('@/src/lib/supabase/client', () => ({
  supabase: {
    auth: {
      signInWithOAuth: jest.fn(),
      signInWithPassword: jest.fn(),
    },
  },
  clearAuthCookies: jest.fn(),
  clearRememberMe: jest.fn(),
}));

beforeEach(() => {
  jest.clearAllMocks();
});

describe('LOGIN-15: signInWithGoogle', () => {
  it('starts the google sign-in, limited to DLSU accounts, and returns to /auth/callback', async () => {
    jest.mocked(supabase.auth.signInWithOAuth).mockResolvedValue({
      data: { provider: 'google', url: 'https://accounts.google.com' },
      error: null,
    } as never);

    await signInWithGoogle('login');

    expect(supabase.auth.signInWithOAuth).toHaveBeenCalledTimes(1);
    expect(supabase.auth.signInWithOAuth).toHaveBeenCalledWith({
      provider: 'google',
      options: expect.objectContaining({
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: expect.objectContaining({ hd: 'dlsu.edu.ph' }),
      }),
    });
  });

  it('remembers that the "login" button was used, so the callback can tell it apart from sign up', async () => {
    jest.mocked(supabase.auth.signInWithOAuth).mockResolvedValue({ data: {}, error: null } as never);

    await signInWithGoogle('login');

    expect(serializeCookieHeader).toHaveBeenCalledWith(
      OAUTH_INTENT_COOKIE,
      'login',
      expect.objectContaining({ path: '/' })
    );
  });
});

describe('LOGIN-09 (client part): signInWithPassword', () => {
  it('trims and lower-cases the email before sending it', async () => {
    await signInWithPassword('  JUAN_DELA_CRUZ@DLSU.EDU.PH  ', 'abc123pass');

    expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'juan_dela_cruz@dlsu.edu.ph',
      password: 'abc123pass',
    });
  });
});