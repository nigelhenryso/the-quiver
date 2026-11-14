'use client';

import { Button } from './Button';
import { QuiverLogo, ShoppingCartLogo, NotificationBellLogo, UserLogo, MarketLogo } from './logos';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import SignUpModal from './authModals/SignUpModal';
import LoginModal  from './authModals/LogInModal';
import CompleteYourProfileModal from './authModals/CompleteYourProfileModal';
import { supabase } from '@/src/lib/supabase/client';
import { signOut } from '@/src/services/authService';
import { getAccountType } from '@/src/services/accountService';
import { HOME_ROUTE } from '@/src/lib/routes';

type AuthModal = 'login' | 'signup' | 'profile' | null;

const AUTH_ERRORS: Record<string, string> = {
  domain: 'Please use your DLSU Google account (@dlsu.edu.ph).',
  cancelled: 'Google sign-in was cancelled. Please try again.',
  failed: 'Sign-in failed or the link has expired. Please try again.',
  no_account: 'No account found for this Google account. Please sign up first.',
};

export interface HeaderProps {
  loggedIn? : boolean;
  student?: boolean;
  onLogin?: () => void;
  onCreateAccount?: () => void;
}

export const Header = ({
  student,
  loggedIn,
  onLogin,
  onCreateAccount,
}: HeaderProps) => {
  const router = useRouter();
  const [activeModal, setActiveModal] = useState<AuthModal>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  // /auth/callback redirects back to "/" with these params.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const error = params.get('auth_error');
    const completeProfile = params.get('complete_profile');
    if (!error && !completeProfile) return;

    if (error) {
      setAuthError(AUTH_ERRORS[error] ?? AUTH_ERRORS.failed);
      setActiveModal('signup');
    } else {
      setActiveModal('profile');
    }
    window.history.replaceState({}, document.title, window.location.pathname);
  }, []);

  // Keep logged-out tabs in sync: if a student or org logs in from another tab
  // (password or Google), this tab moves to their home page as well.
  useEffect(() => {
    if (loggedIn) return;
    let checking = false;

    /** If someone logged in (e.g. from another tab), sends this tab to their home page. Skips new students. */
    const redirectIfLoggedIn = async () => {
      if (checking || document.visibilityState !== 'visible') return;
      checking = true;
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const account = await getAccountType(supabase, user.id);
        if (account !== 'new') router.replace(HOME_ROUTE[account]);
      } finally {
        checking = false;
      }
    };

    // Fires across tabs for password logins (Supabase broadcasts auth changes).
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      // defer: calling Supabase inside this callback can deadlock its auth lock
      if (event === 'SIGNED_IN') setTimeout(() => void redirectIfLoggedIn(), 0);
    });
    // Google logins finish server-side and aren't broadcast, so also re-check
    // whenever the user comes back to this tab.
    document.addEventListener('visibilitychange', redirectIfLoggedIn);
    window.addEventListener('focus', redirectIfLoggedIn);

    return () => {
      subscription.unsubscribe();
      document.removeEventListener('visibilitychange', redirectIfLoggedIn);
      window.removeEventListener('focus', redirectIfLoggedIn);
    };
  }, [loggedIn, router]);

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close the user menu on outside click.
  useEffect(() => {
    if (!isUserMenuOpen) return;
    /** Closes the user menu when clicking anywhere outside it. */
    const onClick = (e: MouseEvent) => {
      if (!userMenuRef.current?.contains(e.target as Node)) setIsUserMenuOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [isUserMenuOpen]);

  /** Logs out, closes the user menu and returns to the public home page. */
  const handleLogout = async () => {
    setIsLoggingOut(true);
    await signOut();
    setIsLoggingOut(false);
    setIsUserMenuOpen(false);
    router.replace('/');
    router.refresh();
  };

  // Keep logged-in tabs in sync: logging out in any tab sends this one home too.
  useEffect(() => {
    if (!loggedIn) return;

    /** Sends this tab to "/" if the user is no longer logged in (e.g. logged out in another tab). */
    const goHomeIfLoggedOut = async () => {
      if (document.visibilityState !== 'visible') return;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) router.replace('/');
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') setTimeout(() => router.replace('/'), 0);
    });
    document.addEventListener('visibilitychange', goHomeIfLoggedOut);
    window.addEventListener('focus', goHomeIfLoggedOut);

    return () => {
      subscription.unsubscribe();
      document.removeEventListener('visibilitychange', goHomeIfLoggedOut);
      window.removeEventListener('focus', goHomeIfLoggedOut);
    };
  }, [loggedIn, router]);

  /** Opens an auth modal (or closes all with `null`) and clears any old auth error. */
  const openModal = (modal: AuthModal) => {
    setAuthError(null);
    setActiveModal(modal);
  };

  return (
    <header>
    <div className="flex flex-row items-center justify-between left-0 top-0 h-[59px] w-full bg-[#008A58] shadow-[0px_4px_8.8px_rgba(0,0,0,0.4)]">
        {loggedIn ? (
          student ? ( /* IF STUDENT */
            <>
                <div className="mx-[45px] flex flex-row items-center gap-3">
                  <QuiverLogo />
                  <div className = "flex flex-row items-end">
                    <h1 className={`font-heading flex items-center text-[21.6867px] leading-[30px] font-normal text-white`}>
                      The Quiver
                    </h1>
                  </div>
                </div>

                <div className="flex items-center gap-[30px]"> {/* NAV OPTIONS */}
                  <Button
                    size="small"
                    type='nav'
                    textColor='#FFFFFF'
                    hoverTextColor='#b9dccf'
                    onClick={() => router.push('/landing')}
                    label="Home"
                    fontSize={20}
                  />
                  <Button
                    primary
                    size="small"
                    type='nav'
                    textColor='#FFFFFF'
                    hoverTextColor='#b9dccf'
                    onClick={() => router.push('/organizations')}
                    label="Campus Orgs"
                    fontSize={20}
                  />
                  <Button
                    primary
                    size="small"
                    type='nav'
                    textColor='#FFFFFF'
                    hoverTextColor='#b9dccf'
                    onClick={() => router.push('/studentOrders')}
                    label="Orders"
                    fontSize={20}
                  />
                </div>
                <div className="mx-[45px] flex items-center gap-[30px]"> {/* NAV OPTIONS */}
                  <Button
                    primary
                    size="small"
                    type='nav'
                    textColor='#FFFFFF'
                    hoverTextColor='#b9dccf'
                    onClick={() => router.push('/cart')}
                    logo={<ShoppingCartLogo width={16} height={16}/>}
                    fontSize={20}
                  />
                  <Button
                    primary
                    size="small"
                    type='nav'
                    textColor='#FFFFFF'
                    hoverTextColor='#b9dccf'
                    logo={<NotificationBellLogo width={16} height={16}/>}
                    fontSize={20}
                  />
                  <div ref={userMenuRef} className="relative">
                    <Button
                      primary
                      size="small"
                      type='nav'
                      textColor='#FFFFFF'
                      hoverTextColor='#b9dccf'
                      onClick={() => setIsUserMenuOpen((open) => !open)}
                      logo={<UserLogo width={16} height={16}/>}
                      fontSize={20}
                    />
                    {isUserMenuOpen && (
                      <div
                        role="menu"
                        className="absolute right-0 top-[calc(100%+12px)] z-50 flex w-[180px] flex-col overflow-hidden rounded-[12px] bg-white py-1 shadow-[0px_4px_8.8px_rgba(0,0,0,0.25)]"
                      >
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            router.push('/studentProfile');
                          }}
                          className="px-4 py-2 text-left text-[16px] text-[#145B46] hover:bg-[#E6FAF2]"
                        >
                          My Profile
                        </button>
                        <button
                          type="button"
                          role="menuitem"
                          disabled={isLoggingOut}
                          onClick={() => void handleLogout()}
                          className="px-4 py-2 text-left text-[16px] font-bold text-[#B91C1C] hover:bg-[#FDECEC] disabled:opacity-60"
                        >
                          {isLoggingOut ? 'Logging out…' : 'Log out'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
          </>
          ) : 
              <>
                <div className="mx-[45px] flex flex-row items-center justify-between gap-3">
                  <QuiverLogo />
                  <div className = "flex flex-row items-end">
                    <h1 className={`font-heading flex items-center text-[21.6867px] leading-[30px] font-normal text-white`}>
                      The Quiver
                    </h1>
                    <h1 className={`font-heading flex items-left text-[10px] font-normal text-white`}>
                      Seller Hub
                    </h1>
                  </div>
                </div>

                <div className="flex items-center gap-[30px]"> {/* NAV OPTIONS */}
                  <Button
                    size="small"
                    type='nav'
                    textColor='#FFFFFF'
                    hoverTextColor='#b9dccf'
                    onClick={() => router.push('/dashboard')}
                    label="Dashboard"
                    fontSize={20}
                  />
                  <Button
                    primary
                    size="small"
                    type='nav'
                    textColor='#FFFFFF'
                    hoverTextColor='#b9dccf'
                    onClick={() => router.push('/inventory')}
                    label="Inventory"
                    fontSize={20}
                  />
                  <Button
                    primary
                    size="small"
                    type='nav'
                    textColor='#FFFFFF'
                    hoverTextColor='#b9dccf'
                    onClick={() => router.push('/orgOrders')}
                    label="Orders"
                    fontSize={20}
                  />
                </div>
                <div className="mx-[45px] flex items-center gap-[30px]"> {/* NAV OPTIONS */}
                  <Button
                    primary
                    size="small"
                    type='nav'
                    textColor='#FFFFFF'
                    hoverTextColor='#b9dccf'
                    onClick={onCreateAccount}
                    logo={<MarketLogo width={16} height={16}/>}
                    fontSize={20}
                  />
                  <Button
                    primary
                    size="small"
                    type='nav'
                    textColor='#FFFFFF'
                    hoverTextColor='#b9dccf'
                    onClick={onCreateAccount}
                    logo={<NotificationBellLogo width={16} height={16}/>}
                    fontSize={20}
                  />
                  <div ref={userMenuRef} className="relative">
                    <Button
                      primary
                      size="small"
                      type='nav'
                      textColor='#FFFFFF'
                      hoverTextColor='#b9dccf'
                      onClick={() => setIsUserMenuOpen((open) => !open)}
                      logo={<UserLogo width={16} height={16}/>}
                      fontSize={20}
                    />
                    {isUserMenuOpen && (
                      <div
                        role="menu"
                        className="absolute right-0 top-[calc(100%+12px)] z-50 flex w-[180px] flex-col overflow-hidden rounded-[12px] bg-white py-1 shadow-[0px_4px_8.8px_rgba(0,0,0,0.25)]"
                      >
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            router.push('/orgProfile');
                          }}
                          className="px-4 py-2 text-left text-[16px] text-[#145B46] hover:bg-[#E6FAF2]"
                        >
                          Org Profile
                        </button>
                        <button
                          type="button"
                          role="menuitem"
                          disabled={isLoggingOut}
                          onClick={() => void handleLogout()}
                          className="px-4 py-2 text-left text-[16px] font-bold text-[#B91C1C] hover:bg-[#FDECEC] disabled:opacity-60"
                        >
                          {isLoggingOut ? 'Logging out…' : 'Log out'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
            </>
        ) : (
          <>
            <div className="mx-[45px] flex flex-row items-center justify-between gap-3">
              <QuiverLogo />
              <div className = "flex flex-row items-end">
                <h1 className={`font-heading flex items-center text-[21.6867px] leading-[30px] font-normal text-white`}>
                  The Quiver
                </h1>
              </div>
            </div>
              <div className="flex items-center gap-[30px]">
                <Button
                  size="small"
                  onClick={onLogin}
                  textColor='#FFFFFF'
                  hoverTextColor='#b9dccf'
                  label="New Arrivals"
                  fontSize={15}
                  type='nav'
                />
                <Button
                  primary
                  size="small"
                  onClick={onCreateAccount}
                  textColor='#FFFFFF'
                  hoverTextColor='#b9dccf'
                  label="Best Sellers"
                  fontSize={15}
                  type='nav'
                />
                <Button
                  primary
                  size="small"
                  onClick={onCreateAccount}
                  textColor='#FFFFFF'
                  hoverTextColor='#b9dccf'
                  label="About Us"
                  fontSize={15}
                  type='nav'
                />
                <Button
                  size="small"
                  onClick={onLogin}
                  textColor='#FFFFFF'
                  hoverTextColor='#b9dccf'
                  label="FAQs"
                  fontSize={15}
                  type='nav'
                />
            </div>
            <div className ="border-l-2 border-[#00B775] pl-5 mx-[45px] flex items-center flex-row gap-[8px]"> {/* LOGIN AND SIGNUP */}
              <Button
                primary
                size="small"
                onClick={() => openModal('login')}
                label="Log In"
                paddingX={10}
                paddingY={6}
                textColor='#FFFFFF'
                hoverTextColor='#b9dccf'
                type='nav'
                fontSize={15}
              />
              <Button
                size="small"
                onClick={() => openModal('signup')}
                label="Sign Up"
                paddingX={10}
                paddingY={6}
                textColor='#FFFFFF'
                hoverTextColor='#00B775'
                fontSize={15}
                type='nav'
              />
            </div>
          </>
        )}
    </div>

    <LoginModal
      isOpen={activeModal === 'login'}
      onClose={() => openModal(null)}
      externalError={authError}
      onSwitchToSignUp={() => openModal('signup')}
      onLoggedIn={(account) => {
        if (account === 'new') {
          openModal('profile');
        } else {
          openModal(null);
          router.replace(HOME_ROUTE[account]);
        }
      }}
    />

    <SignUpModal
      isOpen={activeModal === 'signup'}
      onClose={() => openModal(null)}
      externalError={authError}
      onSwitchToLogin={() => openModal('login')}
      onSignedUp={() => openModal('profile')}
    />

    <CompleteYourProfileModal
      isOpen={activeModal === 'profile'}
      onClose={() => openModal(null)}
      onComplete={() => openModal(null)}
    />
  </header>
)
};