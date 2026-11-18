/**
 * LOGIN-13 (second half): where the user is sent after logging in.
 *
 * The Login modal only reports the account type. The redirect is done by the Header, so
 * these tests render the real Header, open its Login modal and log in with fake services.
 * Nothing here touches the real database or a real router.
 */
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Header } from '@/src/components/ui/Header';
import { HOME_ROUTE } from '@/src/lib/routes';
import { supabase } from '@/src/lib/supabase/client';
import { signInWithPassword } from '@/src/services/authService';
import { getAccountType } from '@/src/services/accountService';
import {
  EMAIL_PLACEHOLDER,
  PASSWORD_PLACEHOLDER,
  VALID_EMAIL,
  VALID_PASSWORD,
  authSuccess,
} from '../helpers/authMocks';

// --- fakes -----------------------------------------------------------------------------------
// One fake router that every component shares, so the tests can check what it was asked to do.
// (Variables used inside jest.mock must start with the word "mock".)
const mockRouter = { push: jest.fn(), replace: jest.fn(), refresh: jest.fn() };

jest.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
}));

jest.mock('@/src/lib/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(),
      onAuthStateChange: jest.fn(),
    },
  },
  setRememberMe: jest.fn(),
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

// --- helpers ---------------------------------------------------------------------------------
/** Opens the Login modal from the Header and logs in as an account of the given type. */
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

beforeEach(() => {
  jest.clearAllMocks();
  // The Header watches the Supabase session while nobody is logged in.
  jest.mocked(supabase.auth.getUser).mockResolvedValue({ data: { user: null }, error: null } as never);
  jest
    .mocked(supabase.auth.onAuthStateChange)
    .mockReturnValue({ data: { subscription: { unsubscribe: jest.fn() } } } as never);
});

// --- tests -----------------------------------------------------------------------------------
describe('LOGIN-13: redirect by account type', () => {
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