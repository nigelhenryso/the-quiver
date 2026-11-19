/**
 * ============================================================================================
 *  LAYER:  FRONTEND       (sheet "02 - Login", every row whose Layer is "Frontend")
 *  TOOL:   Jest + React Testing Library (jsdom)
 *  NO database, NO network: Supabase, the router and the services are replaced with fakes.
 * ============================================================================================
 *
 * Order of the test cases in this file (ascending, same as the sheet):
 *   LOGIN-05  [FRONTEND] failed login shows an error and the user stays on the form
 *   LOGIN-08  [FRONTEND] loading state, only one request on double click
 *   LOGIN-13  [FRONTEND] after login: (A) the modal reports the account type,
 *                                     (B) the Header redirects by account type
 *   LOGIN-15  [FRONTEND] "Log in With Google": (A) the button, (B) the request it sends
 *
 * Rows of the sheet that are NOT in this file: the BACKEND rows are in the Login.backend.* files
 * next to this one (Postman collection + one small Jest file) and the END-TO-END rows are in tests/e2e/.
 */
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { serializeCookieHeader } from '@supabase/ssr';
import LoginModal from '@/src/components/ui/authModals/LogInModal';
import { Header } from '@/src/components/ui/Header';
import { HOME_ROUTE } from '@/src/lib/routes';
import { supabase } from '@/src/lib/supabase/client';
import { OAUTH_INTENT_COOKIE } from '@/src/lib/supabase/oauthIntent';
import { signInWithGoogle, signInWithPassword } from '@/src/services/authService';
import { getAccountType } from '@/src/services/accountService';
import {
  EMAIL_PLACEHOLDER,
  PASSWORD_PLACEHOLDER,
  VALID_EMAIL,
  VALID_PASSWORD,
  authFailure,
  authSuccess,
  googleFailure,
  googleRedirectStarted,
  type SignInResult,
} from '../helpers/authMocks';

// ---------- fakes (jest.mock calls are moved to the top of the file automatically) ----------
// One fake router shared by every component, so the tests can check what it was asked to do.
// (Variables used inside jest.mock must start with the word "mock".)
const mockRouter = { push: jest.fn(), replace: jest.fn(), refresh: jest.fn() };
jest.mock('next/navigation', () => ({ useRouter: () => mockRouter }));

jest.mock('@supabase/ssr', () => ({
  serializeCookieHeader: jest.fn(() => 'quiver-oauth-intent=login; Path=/'),
}));

jest.mock('@/src/lib/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(),
      onAuthStateChange: jest.fn(),
      signInWithOAuth: jest.fn(),
      signInWithPassword: jest.fn(),
    },
  },
  setRememberMe: jest.fn(),
  clearAuthCookies: jest.fn(),
  clearRememberMe: jest.fn(),
}));

jest.mock('@/src/services/authService', () => ({
  signInWithPassword: jest.fn(),
  signInWithGoogle: jest.fn(),
  signUpWithPassword: jest.fn(),
  resendEmailOtp: jest.fn(),
  verifyEmailOtp: jest.fn(),
  createStudentProfile: jest.fn(),
  signOut: jest.fn(),
  otpErrorMessage: jest.fn((error: { message: string }) => error.message),
}));

jest.mock('@/src/services/accountService', () => ({
  getAccountType: jest.fn(),
}));

// The REAL signInWithGoogle (the mock above replaced it for every other test in this file).
const { signInWithGoogle: realSignInWithGoogle } = jest.requireActual<
  typeof import('@/src/services/authService')
>('@/src/services/authService');

// ---------- helpers ----------------------------------------------------------------------------
type User = ReturnType<typeof userEvent.setup>;

/** Types the email and password, without pressing Log In. */
async function fillForm(user: User, email = VALID_EMAIL, password = VALID_PASSWORD) {
  await user.type(screen.getByPlaceholderText(EMAIL_PLACEHOLDER), email);
  await user.type(screen.getByPlaceholderText(PASSWORD_PLACEHOLDER), password);
}

const logInButton = () => screen.getByRole('button', { name: 'Log In' });
const googleButton = () => screen.getByRole('button', { name: /log in with google/i });

beforeEach(() => {
  jest.clearAllMocks();
  // The Header watches the Supabase session while nobody is logged in.
  jest.mocked(supabase.auth.getUser).mockResolvedValue({ data: { user: null }, error: null } as never);
  jest
    .mocked(supabase.auth.onAuthStateChange)
    .mockReturnValue({ data: { subscription: { unsubscribe: jest.fn() } } } as never);
});

// ===========================================================================================
//  LOGIN-05  [FRONTEND]  failed login
// ===========================================================================================
describe('LOGIN-05 [FRONTEND] failed login', () => {
  it.each([['invalid_credentials'], ['user_not_found']])(
    'shows "Incorrect email or password." and stays on the form (Supabase error: %s)',
    async (errorCode) => {
      jest.mocked(signInWithPassword).mockResolvedValue(authFailure(errorCode, 'Login failed'));
      const onLoggedIn = jest.fn();
      const user = userEvent.setup();
      render(<LoginModal isOpen={true} onClose={jest.fn()} onLoggedIn={onLoggedIn} />);

      await fillForm(user, VALID_EMAIL, 'wrongpassword');
      await user.click(logInButton());

      // Same message for a wrong password and for an unknown email (no account hints).
      expect(await screen.findByText('Incorrect email or password.')).toBeInTheDocument();
      expect(signInWithPassword).toHaveBeenCalledWith(VALID_EMAIL, 'wrongpassword');

      // The user is NOT logged in: nothing is looked up and the parent is not told anything
      // (the modal has no router of its own; the parent only redirects after onLoggedIn).
      expect(getAccountType).not.toHaveBeenCalled();
      expect(onLoggedIn).not.toHaveBeenCalled();

      // The form is still there and can be used again.
      expect(logInButton()).toBeEnabled();
    }
  );
});

// ===========================================================================================
//  LOGIN-08  [FRONTEND]  loading state
// ===========================================================================================
describe('LOGIN-08 [FRONTEND] loading state', () => {
  it('disables the buttons and sends only one login request when Log In is double-clicked', async () => {
    // A request that never finishes, so the modal stays in its loading state.
    jest.mocked(signInWithPassword).mockReturnValue(new Promise<SignInResult>(() => {}));
    const user = userEvent.setup();
    render(<LoginModal isOpen={true} onClose={jest.fn()} />);

    await fillForm(user);
    await user.dblClick(logInButton());

    expect(signInWithPassword).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: /logging in/i })).toBeDisabled();
    expect(googleButton()).toBeDisabled();
  });
});

// ===========================================================================================
//  LOGIN-13  [FRONTEND]  routes by account type
// ===========================================================================================
describe('LOGIN-13 (A) [FRONTEND] the Login modal reports the account type', () => {
  it.each(['student', 'organization', 'new'] as const)(
    'tells the parent the account type is "%s" and resets the form',
    async (account) => {
      jest.mocked(signInWithPassword).mockResolvedValue(authSuccess('user-123'));
      jest.mocked(getAccountType).mockResolvedValue(account);
      const onLoggedIn = jest.fn();
      const user = userEvent.setup();
      render(<LoginModal isOpen={true} onClose={jest.fn()} onLoggedIn={onLoggedIn} />);

      await fillForm(user);
      await user.click(logInButton());

      await waitFor(() => expect(onLoggedIn).toHaveBeenCalledTimes(1));
      expect(onLoggedIn).toHaveBeenCalledWith(account);
      expect(getAccountType).toHaveBeenCalledWith(expect.anything(), 'user-123');

      // The email and password are cleared after a successful login.
      expect(screen.getByPlaceholderText(EMAIL_PLACEHOLDER)).toHaveValue('');
      expect(screen.getByPlaceholderText(PASSWORD_PLACEHOLDER)).toHaveValue('');
    }
  );
});

describe('LOGIN-13 (B) [FRONTEND] the Header redirects by account type', () => {
  // The redirect is done by the Header (not the modal), so these tests render the real Header,
  // open its Login modal and log in through it.
  async function logInThroughHeader(account: 'student' | 'organization' | 'new') {
    jest.mocked(signInWithPassword).mockResolvedValue(authSuccess('user-123'));
    jest.mocked(getAccountType).mockResolvedValue(account);

    const user = userEvent.setup();
    render(<Header />);

    // The Header's own "Log In" button opens the modal.
    await user.click(screen.getByRole('button', { name: 'Log In' }));
    const dialog = await screen.findByRole('dialog');

    // The modal has its own "Log In" button too, so look inside the dialog only.
    await user.type(within(dialog).getByPlaceholderText(EMAIL_PLACEHOLDER), VALID_EMAIL);
    await user.type(within(dialog).getByPlaceholderText(PASSWORD_PLACEHOLDER), VALID_PASSWORD);
    await user.click(within(dialog).getByRole('button', { name: 'Log In' }));
  }

  it('maps each account type to its home page', () => {
    expect(HOME_ROUTE.student).toBe('/landing');
    expect(HOME_ROUTE.organization).toBe('/dashboard');
  });

  it('sends a student to /landing and closes the login modal', async () => {
    await logInThroughHeader('student');

    await waitFor(() => expect(mockRouter.replace).toHaveBeenCalledWith('/landing'));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('sends an organization to /dashboard and closes the login modal', async () => {
    await logInThroughHeader('organization');

    await waitFor(() => expect(mockRouter.replace).toHaveBeenCalledWith('/dashboard'));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('does not redirect a new account, and asks it to complete its profile instead', async () => {
    await logInThroughHeader('new');

    expect(await screen.findByRole('heading', { name: /complete your profile/i })).toBeInTheDocument();
    expect(mockRouter.replace).not.toHaveBeenCalled();
  });
});

// ===========================================================================================
//  LOGIN-15  [FRONTEND]  Log in with Google
// ===========================================================================================
describe('LOGIN-15 (A) [FRONTEND] the "Log in With Google" button', () => {
  it('starts the Google sign-in with the "login" intent', async () => {
    jest.mocked(signInWithGoogle).mockResolvedValue(googleRedirectStarted());
    const user = userEvent.setup();
    render(<LoginModal isOpen={true} onClose={jest.fn()} />);

    await user.click(googleButton());

    expect(signInWithGoogle).toHaveBeenCalledTimes(1);
    expect(signInWithGoogle).toHaveBeenCalledWith('login');
    // While the browser is being sent to Google, both buttons are locked.
    expect(await screen.findByRole('button', { name: /redirecting to google/i })).toBeDisabled();
    expect(logInButton()).toBeDisabled();
  });

  it('shows the error and unlocks the buttons when Google sign-in cannot start', async () => {
    jest.mocked(signInWithGoogle).mockResolvedValue(googleFailure('Google sign-in is unavailable.'));
    const user = userEvent.setup();
    render(<LoginModal isOpen={true} onClose={jest.fn()} />);

    await user.click(googleButton());

    expect(await screen.findByText('Google sign-in is unavailable.')).toBeInTheDocument();
    expect(googleButton()).toBeEnabled();
    expect(logInButton()).toBeEnabled();
  });
});

describe('LOGIN-15 (B) [FRONTEND] the request that signInWithGoogle sends', () => {
  it('uses the google provider, only DLSU accounts, and returns to /auth/callback', async () => {
    jest.mocked(supabase.auth.signInWithOAuth).mockResolvedValue({
      data: { provider: 'google', url: 'https://accounts.google.com' },
      error: null,
    } as never);

    await realSignInWithGoogle('login');

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

    await realSignInWithGoogle('login');

    expect(serializeCookieHeader).toHaveBeenCalledWith(
      OAUTH_INTENT_COOKIE,
      'login',
      expect.objectContaining({ path: '/' })
    );
  });
});