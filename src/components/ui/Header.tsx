'use client';

import { Button } from './Button';
import { Search } from 'lucide-react';
import { QuiverLogo, ShoppingCartLogo, NotificationBellLogo, UserLogo, MarketLogo } from './logos';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import SignUpModal from './authModals/SignUpModal';
import LoginModal  from './authModals/LogInModal';
import CompleteYourProfileModal from './authModals/CompleteYourProfileModal';
import { AUTH_BACKDROP } from './authModals/CommonModal';
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
  // after a successful login the backdrop stays up until the next page replaces this one
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    if (!redirecting) return;
    const t = setTimeout(() => setRedirecting(false), 10000); // safety net if navigation stalls
    return () => {
      clearTimeout(t);
      // cacheComponents keeps this page alive (hidden) after navigating away, which runs this
      // cleanup; reset so the overlay isn't still up when the user comes back (e.g. after logout).
      setRedirecting(false);
    };
  }, [redirecting]);

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
        // full load: the client router may still hold pages rendered while logged out
        if (account !== 'new') window.location.replace(HOME_ROUTE[account]);
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
  const [isCartMenuOpen, setIsCartMenuOpen] = useState(false);
  const cartMenuRef = useRef<HTMLDivElement>(null);

  // Close the cart menu on outside click or Escape.
  useEffect(() => {
    if (!isCartMenuOpen) return;
    const onClick = (e: MouseEvent) => {
      if (!cartMenuRef.current?.contains(e.target as Node)) setIsCartMenuOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsCartMenuOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isCartMenuOpen]);

  /** Closes the cart menu and opens one of the carts. */
  const goToCart = (path: string) => {
    setIsCartMenuOpen(false);
    router.push(path);
  };

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
    window.location.replace('/'); // full load so no logged-in page state survives
  };

  // Keep logged-in tabs in sync: logging out in any tab sends this one home too.
  useEffect(() => {
    if (!loggedIn) return;

    /** Sends this tab to "/" if the user is no longer logged in (e.g. logged out in another tab). */
    const goHomeIfLoggedOut = async () => {
      if (document.visibilityState !== 'visible') return;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) window.location.replace('/');
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') setTimeout(() => window.location.replace('/'), 0);
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
    <div
      className={`flex w-full items-center justify-between bg-[#008A58] shadow-[0px_4px_8.8px_rgba(0,0,0,0.4)] ${
        loggedIn && student
          ? 'flex-wrap gap-x-4 gap-y-3 px-4 py-3 md:h-[59px] md:flex-nowrap md:px-6 md:py-0 lg:grid lg:grid-cols-[minmax(max-content,20.55fr)_minmax(max-content,35.9fr)_minmax(0,29fr)_minmax(max-content,14.55fr)] lg:gap-0 lg:px-[1.65%]'
          : 'h-[59px]'
      }`}
    >
        {loggedIn ? (
          student ? ( /* IF STUDENT */
            <>
                <div className="flex shrink-0 items-center gap-1 whitespace-nowrap md:ml-[21px] lg:ml-[calc(45px_-_1.65vw)]">
                  <QuiverLogo />
                  <div className = "flex flex-row items-end">
                    <h1 className={`font-heading flex items-center text-[21.6867px] leading-[30px] font-normal text-white`}>
                      The Quiver
                    </h1>
                  </div>
                </div>

                <div className="order-3 flex w-full items-center justify-between gap-3 md:order-none md:w-auto md:justify-start lg:justify-between lg:pr-[5.55vw]"> {/* NAV OPTIONS */}
                  <Button
                    size="small"
                    type='nav'
                    textColor='#FFFFFF'
                    hoverTextColor='#b9dccf'
                    onClick={() => router.push('/landing')}
                    label="Home"
                    fontSize={15}
                  />
                  <Button
                    primary
                    size="small"
                    type='nav'
                    textColor='#FFFFFF'
                    hoverTextColor='#b9dccf'
                    onClick={() => router.push('/organizations')}
                    label="Organizations"
                    fontSize={15}
                  />
                  <Button
                    primary
                    size="small"
                    type='nav'
                    textColor='#FFFFFF'
                    hoverTextColor='#b9dccf'
                    onClick={() => router.push('/studentPreOrders')}
                    label="Pre-Orders"
                    fontSize={15}
                  />
                  <Button
                    primary
                    size="small"
                    type='nav'
                    textColor='#FFFFFF'
                    hoverTextColor='#b9dccf'
                    onClick={() => router.push('/studentOrders')}
                    label="Orders"
                    fontSize={15}
                  />
                </div>
                <label className="order-4 flex h-10 w-full items-center gap-2 rounded-lg border border-[#A4B99F] bg-[#F1FBEE] px-2 focus-within:ring-2 focus-within:ring-inset focus-within:ring-[#008A58] md:order-none md:w-auto md:min-w-0 md:flex-1 lg:mr-[1.85vw] lg:h-[35px]">
                  <Search size={18} aria-hidden="true" className="shrink-0 text-[#68836D]" />
                  <span className="relative min-w-0 flex-1 font-body text-sm">
                    <input
                      type="search"
                      aria-label="Search org merchandise"
                      placeholder="Search org merchandise"
                      className="peer block w-full bg-transparent text-[#1E3A2C] outline-none placeholder:text-transparent"
                    />
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 hidden truncate text-[#8FA98B] peer-placeholder-shown:block"
                    >
                      Search org merchandise
                    </span>
                  </span>
                </label>
                <div className="flex h-9 shrink-0 items-center gap-4 border-l border-[#00B775] pl-4 lg:grid lg:h-[70%] lg:grid-cols-3 lg:justify-items-center lg:gap-0 lg:pl-2"> {/* NAV OPTIONS */}
                  <div ref={cartMenuRef} className="relative">
                    <button
                      type="button"
                      aria-label="Carts"
                      aria-haspopup="menu"
                      aria-expanded={isCartMenuOpen}
                      onClick={() => setIsCartMenuOpen((open) => !open)}
                      className="flex items-center gap-1 rounded text-white transition-colors hover:text-[#b9dccf] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                    >
                      <ShoppingCartLogo width={16} height={16}/>
                      <svg
                        width="7"
                        height="5"
                        viewBox="0 0 7 5"
                        aria-hidden="true"
                        className={`transition-transform ${isCartMenuOpen ? 'rotate-180' : ''}`}
                      >
                        <path d="M0 0H7L3.5 5Z" fill="currentColor" />
                      </svg>
                    </button>
                    {isCartMenuOpen && (
                      <div
                        role="menu"
                        aria-label="Carts"
                        className="absolute right-0 top-[calc(100%+12px)] z-50 flex w-[180px] flex-col overflow-hidden rounded-[12px] bg-white py-1 shadow-[0px_4px_8.8px_rgba(0,0,0,0.25)]"
                      >
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => goToCart('/cart')}
                          className="px-4 py-2 text-left text-[16px] text-[#145B46] hover:bg-[#E6FAF2]"
                        >
                          Order Cart
                        </button>
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => goToCart('/preOrderCart')}
                          className="px-4 py-2 text-left text-[16px] text-[#145B46] hover:bg-[#E6FAF2]"
                        >
                          Pre-Order Cart
                        </button>
                      </div>
                    )}
                  </div>
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
                <div className="mx-[45px] flex flex-row items-center justify-between gap-1">
                  <QuiverLogo />
                  <div className = "flex flex-row items-center">
                    <h1 className={`font-heading flex items-center text-[21.6867px] leading-[30px] font-normal text-white`}>
                      The Quiver
                    </h1>
                    <div className="flex font-heading text-white text-[12px] border border-1 border-[rgba(255,255,255,0.2)] bg-[rgba(255,255,255,0.12)] rounded-2xl px-2.5 py-1 ml-2">
                      Seller Hub
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-[60px]"> {/* NAV OPTIONS */}
                  <Button
                    size="small"
                    type='nav'
                    textColor='#FFFFFF'
                    hoverTextColor='#b9dccf'
                    onClick={() => router.push('/dashboard')}
                    label="Dashboard"
                    fontSize={15}
                  />
                  <Button
                    primary
                    size="small"
                    type='nav'
                    textColor='#FFFFFF'
                    hoverTextColor='#b9dccf'
                    onClick={() => router.push('/sales')}
                    label="Sales"
                    fontSize={15}
                  />
                  <Button
                    primary
                    size="small"
                    type='nav'
                    textColor='#FFFFFF'
                    hoverTextColor='#b9dccf'
                    onClick={() => router.push('/orgOrders')}
                    label="Orders"
                    fontSize={15}
                  />
                  <Button
                    primary
                    size="small"
                    type='nav'
                    textColor='#FFFFFF'
                    hoverTextColor='#b9dccf'
                    onClick={() => router.push('/inventory')}
                    label="Inventory"
                    fontSize={15}
                  />
                </div>
                
                <div className="mx-[45px] flex items-center gap-[30px]"> {/* NAV OPTIONS */}
                  <div className="h-9 w-px self-stretch bg-[#00B775]"></div>
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
            <div className="mx-[45px] flex flex-row items-center justify-between gap-1">
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
                  label="Home"
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
          setRedirecting(true);
          openModal(null);
          window.location.replace(HOME_ROUTE[account]); // full load: fresh server render with the new session
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
      onComplete={() => {
        setRedirecting(true); // the modal itself navigates to /landing
        openModal(null);
      }}
    />

    {redirecting && (
      <div className={AUTH_BACKDROP} aria-busy="true" aria-live="polite">
        <p className="font-body text-[15px] text-white">Logging you in…</p>
      </div>
    )}
  </header>
)
};
