/**
 * Unit / component tests for the Login modal (sheet "02 - Login", Frontend rows).
 *
 *   LOGIN-05  failed login shows an error and the user stays on the form
 *   LOGIN-08  Log In button shows a loading state and only sends one request
 *   LOGIN-13  after a successful login the parent is told the account type
 *             (the redirect itself is tested in LoginRouting.test.tsx)
 *   LOGIN-15  "Log in With Google" starts the Google sign-in
 *
 * Nothing here touches the real database: the Supabase client and the auth/account
 * services are replaced with fake functions.
 */
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginModal from '@/src/components/ui/authModals/LogInModal';
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

// --- fakes (jest.mock calls are moved to the top of the file automatically) ---------------
jest.mock('@/src/lib/supabase/client', () => ({
  supabase: {},
  setRememberMe: jest.fn(),
}));

jest.mock('@/src/services/authService', () => ({
  signInWithPassword: jest.fn(),
  signInWithGoogle: jest.fn(),
  resendEmailOtp: jest.fn(),
  verifyEmailOtp: jest.fn(),
  otpErrorMessage: jest.fn((error: { message: string }) => error.message),
}));

jest.mock('@/src/services/accountService', () => ({
  getAccountType: jest.fn(),
}));

// --- helpers ---------------------------------------------------------------------------------
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
});

// --- LOGIN-05 --------------------------------------------------------------------------------
describe('LOGIN-05: failed login', () => {
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

      // The user is NOT logged in: nothing is looked up and the parent is not told anything.
      expect(getAccountType).not.toHaveBeenCalled();
      expect(onLoggedIn).not.toHaveBeenCalled();

      // The form is still there and can be used again.
      expect(logInButton()).toBeEnabled();
    }
  );
});

// --- LOGIN-08 --------------------------------------------------------------------------------
describe('LOGIN-08: loading state', () => {
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

// --- LOGIN-13 --------------------------------------------------------------------------------
describe('LOGIN-13: successful login', () => {
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

// --- LOGIN-15 --------------------------------------------------------------------------------
describe('LOGIN-15: Log in With Google', () => {
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