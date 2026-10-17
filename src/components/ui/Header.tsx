'use client';

import { Button } from './Button';
import { Braah_One } from 'next/font/google';
import { QuiverLogo, ShoppingCartLogo, NotificationBellLogo, UserLogo, MarketLogo } from './logos';

const braahOne = Braah_One({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
});

export interface HeaderProps {
  loggedIn : boolean;
  student: boolean;
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
}: HeaderProps) => (
  <header>
    <div className="flex flex-row items-center justify-between left-0 top-0 h-[59px] w-full bg-[#199E72] shadow-[0px_4px_8.8px_rgba(0,0,0,0.4)]">
        {loggedIn ? (
          student ? ( /* IF STUDENT */
            <>
                <div className="mx-[45px] flex flex-row items-center justify-between gap-3">
                  <QuiverLogo />
                  <div className = "flex flex-row items-end">
                    <h1 className={`${braahOne.className} flex items-center text-[21.6867px] leading-[30px] font-normal text-white`}>
                      The Quiver
                    </h1>
                  </div>
                </div>

                <div className="mx-[45px] flex items-center gap-3">
                  <div className ="flex items-center flex-row gap-[45px]"> {/* IF STUDENT LOGGED IN */} 
                    <div className="flex items-center gap-[30px]"> {/* NAV OPTIONS */}
                    <Button
                      size="small"
                      type='nav'
                      textColor='#FFFFFF'
                      hoverTextColor='#76CD26'
                      onClick={onLogin}
                      label="Home"
                    />
                    <Button
                      primary
                      size="small"
                      type='nav'
                      textColor='#FFFFFF'
                      hoverTextColor='#76CD26'
                      onClick={onCreateAccount}
                      label="Campus Orgs"
                    />
                    <Button
                      primary
                      size="small"
                      type='nav'
                      textColor='#FFFFFF'
                      hoverTextColor='#76CD26'
                      onClick={onCreateAccount}
                      label="Orders"
                    />
                    </div>
                    <div className="flex items-center gap-[30px]"> {/* NAV OPTIONS */}
                      <Button
                        primary
                        size="small"
                        type='nav'
                        textColor='#FFFFFF'
                        hoverTextColor='#76CD26'
                        onClick={onCreateAccount}
                        logo={<ShoppingCartLogo width={16} height={16}/>}
                      />
                      <Button
                        primary
                        size="small"
                        type='nav'
                        textColor='#FFFFFF'
                        hoverTextColor='#76CD26'
                        onClick={onCreateAccount}
                        logo={<NotificationBellLogo width={16} height={16}/>}
                      />
                      <Button
                        primary
                        size="small"
                        type='nav'
                        textColor='#FFFFFF'
                        hoverTextColor='#76CD26'
                        onClick={onCreateAccount}
                        logo={<UserLogo width={16} height={16}/>}
                      />
                    </div>
                </div>
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

                <div className="mx-[45px] flex items-center gap-3">
                  <div className ="flex items-center flex-row gap-[45px]"> {/* IF ORGANIZATION LOGGED IN */} 
                      <div className="flex items-center gap-[30px]"> {/* NAV OPTIONS */}
                      <Button
                        size="small"
                        type='nav'
                        textColor='#FFFFFF'
                        hoverTextColor='#76CD26'
                        onClick={onLogin}
                        label="Dashboard"
                      />
                      <Button
                        primary
                        size="small"
                        type='nav'
                        textColor='#FFFFFF'
                        hoverTextColor='#76CD26'
                        onClick={onCreateAccount}
                        label="Inventory"
                      />
                      <Button
                        primary
                        size="small"
                        type='nav'
                        textColor='#FFFFFF'
                        hoverTextColor='#76CD26'
                        onClick={onCreateAccount}
                        label="Orders"
                      />
                      </div>
                      <div className="flex items-center gap-[30px]"> {/* NAV OPTIONS */}
                      <Button
                        primary
                        size="small"
                        type='nav'
                        textColor='#FFFFFF'
                        hoverTextColor='#76CD26'
                        onClick={onCreateAccount}
                        logo={<MarketLogo width={16} height={16}/>}
                      />
                      <Button
                        primary
                        size="small"
                        type='nav'
                        textColor='#FFFFFF'
                        hoverTextColor='#76CD26'
                        onClick={onCreateAccount}
                        logo={<NotificationBellLogo width={16} height={16}/>}
                      />
                      </div>
                  </div>
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

            <div className="mx-[45px] flex items-center gap-3">
              <div className ="flex items-center flex-row gap-[45px]"> {/* IF LOGGED OUT */}     {/* NAV OPTIONS */}
                  <div className="flex items-center gap-[30px]">
                    <Button
                      size="small"
                      onClick={onLogin}
                      textColor='#FFFFFF'
                      hoverTextColor='#76CD26'
                      label="New Arrivals"
                    />
                    <Button
                      primary
                      size="small"
                      onClick={onCreateAccount}
                      textColor='#FFFFFF'
                      hoverTextColor='#76CD26'
                      label="Best Sellers"
                    />
                    <Button
                      primary
                      size="small"
                      onClick={onCreateAccount}
                      textColor='#FFFFFF'
                      hoverTextColor='#76CD26'
                      label="About Us"
                    />
                    <Button
                      size="small"
                      onClick={onLogin}
                      textColor='#FFFFFF'
                      hoverTextColor='#76CD26'
                      label="FAQs"
                    />
                </div>
                <div className ="flex items-center flex-row gap-[8px]"> {/* LOGIN AND SIGNUP */}
                  <Button
                    primary
                    size="small"
                    onClick={onCreateAccount}
                    label="Log In"
                    paddingX={10}
                    paddingY={6}
                    borderRadius={6}
                    borderWidth={2}
                    borderColor='#00B775'
                    textColor='#FFFFFF'
                    hoverTextColor='#76CD26'
                  />
                  <Button
                    size="small"
                    onClick={onLogin}
                    label="Sign Up"
                    borderColor='#00B775'
                    backgroundColor='#76CD26'
                    paddingX={10}
                    paddingY={6}
                    borderRadius={6}
                    borderWidth={2}
                    textColor='#FFFFFF'
                    hoverTextColor='#00B775'
                  />
                </div>
              </div>
            </div>
          </>
        )}
    </div>
  </header>
);