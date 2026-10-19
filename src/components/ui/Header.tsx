'use client';

import { Button } from './Button';
import { Braah_One } from 'next/font/google';
import { QuiverLogo, ShoppingCartLogo, NotificationBellLogo, UserLogo, MarketLogo } from './logos';
import { useState } from 'react';
import SignUpModal from './authModals/SignUpModal';
import LoginModal  from './authModals/LogInModal';

const braahOne = Braah_One({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
});

export interface HeaderProps {
  loggedIn? : boolean;
  student?: boolean;
  onLogin?: () => void;
  onLogout?: () => void;
  onCreateAccount?: () => void;
}

export const Header = ({
  student,
  loggedIn,
  onLogin,
  onLogout,
  onCreateAccount,
}: HeaderProps) => {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isSignUpOpen, setIsSignUpOpen] = useState(false);

  return (
    <header>
    <div className="flex flex-row items-center justify-between left-0 top-0 h-[59px] w-full bg-[#008A58] shadow-[0px_4px_8.8px_rgba(0,0,0,0.4)]">
        {loggedIn ? (
          student ? ( /* IF STUDENT */
            <>
                <div className="mx-[45px] flex flex-row items-center gap-3">
                  <QuiverLogo />
                  <div className = "flex flex-row items-end">
                    <h1 className={`${braahOne.className} flex items-center text-[21.6867px] leading-[30px] font-normal text-white`}>
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
                    onClick={onLogin}
                    label="Home"
                    fontSize={20}
                  />
                  <Button
                    primary
                    size="small"
                    type='nav'
                    textColor='#FFFFFF'
                    hoverTextColor='#b9dccf'
                    onClick={onCreateAccount}
                    label="Campus Orgs"
                    fontSize={20}
                  />
                  <Button
                    primary
                    size="small"
                    type='nav'
                    textColor='#FFFFFF'
                    hoverTextColor='#b9dccf'
                    onClick={onCreateAccount}
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
                    logo={<ShoppingCartLogo width={16} height={16}/>}
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
                  <Button
                    primary
                    size="small"
                    type='nav'
                    textColor='#FFFFFF'
                    hoverTextColor='#b9dccf'
                    onClick={onCreateAccount}
                    logo={<UserLogo width={16} height={16}/>}
                    fontSize={20}
                  />
                </div>
          </>
          ) : 
              <>
                <div className="mx-[45px] flex flex-row items-center justify-between gap-3">
                  <QuiverLogo />
                  <div className = "flex flex-row items-end">
                    <h1 className={`${braahOne.className} flex items-center text-[21.6867px] leading-[30px] font-normal text-white`}>
                      The Quiver
                    </h1>
                    <h1 className={`${braahOne.className} flex items-left text-[10px] font-normal text-white`}>
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
                    onClick={onLogin}
                    label="Dashboard"
                    fontSize={20}
                  />
                  <Button
                    primary
                    size="small"
                    type='nav'
                    textColor='#FFFFFF'
                    hoverTextColor='#b9dccf'
                    onClick={onCreateAccount}
                    label="Inventory"
                    fontSize={20}
                  />
                  <Button
                    primary
                    size="small"
                    type='nav'
                    textColor='#FFFFFF'
                    hoverTextColor='#b9dccf'
                    onClick={onCreateAccount}
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
                </div>
            </>
        ) : (
          <>
            <div className="mx-[45px] flex flex-row items-center justify-between gap-3">
              <QuiverLogo />
              <div className = "flex flex-row items-end">
                <h1 className={`${braahOne.className} flex items-center text-[21.6867px] leading-[30px] font-normal text-white`}>
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
                onClick={() => setIsLoginOpen(true)}
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
                onClick={() => setIsSignUpOpen(true)}
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
      isOpen={isLoginOpen}
      onClose={() => setIsLoginOpen(false)}
    />

    <SignUpModal
      isOpen={isSignUpOpen}
      onClose={() => setIsSignUpOpen(false)}
    />
  </header>
)
};