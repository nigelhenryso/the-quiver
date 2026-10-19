import { useState } from 'react';

import CommonModal from './CommonModal';
import { Cal_Sans, Lato } from 'next/font/google';
import { InputField } from '../InputField';
import { Button } from '../Button';
import { GoogleLogo, ArrowRight } from '../logos';
import CompleteYourProfileModal from './CompleteYourProfileModal';
import LogInModal from './LogInModal';
import LoginModal from './LogInModal';



const calSans = Cal_Sans({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
  adjustFontFallback: false,
});

const LatoFont = Lato({
  weight: ['400', '700'],
  subsets: ['latin'],
  display: 'swap',
  adjustFontFallback: false,
});

interface SignUpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SignUpModal({
  isOpen,
  onClose,
}: SignUpModalProps) {
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isLogInModalOpen, setIsLogInOpen] = useState(false);
  return (
    <>
    <CommonModal isOpen={isOpen} onClose={onClose}>
      <div className="flex flex-col gap-[2px]">
        <div className="flex flex-col p-[12px] gap-[6px]">
          <h1 className={`${calSans.className} text-[36px] font-normal leading-[44px] text-[#E6FAF2]`}>
            Sign Up
          </h1>

          <p className={`${LatoFont.className} text-[18px] font-normal leading-[22px] text-[#CCF0E3]`}>
            Provide your school email and account details to get started.
          </p>
        </div>
        <div className="flex flex-col p-[12px]">
            <InputField
            placeholder='e.g. juan_dela_cruz@dlsu.edu.ph'
            inputType='email'
            inputName='DLSU Email'
            inputNameColor='#CCF0E3'
            inputBackgroundColor='#F5FEF2'
            placeholderColor='#80AA8C'
            borderColor='#A6BA9F'
            fontSize={16}/>
          
            <InputField
              placeholder='Create a strong password'
              inputType='password'
              inputName='Password'
              inputNameColor='#CCF0E3'
              inputBackgroundColor='#F5FEF2'
              placeholderColor='#80AA8C'
              borderColor='#A6BA9F'
              fontSize={16}/>
            
            <InputField
              placeholder='Retype Password'
              inputType='password'
              inputName='Confirm Password'
              inputNameColor='#CCF0E3'
              inputBackgroundColor='#F5FEF2'
              placeholderColor='#80AA8C'
              borderColor='#A6BA9F'
              fontSize={16}/>
        </div>
        <div className="flex flex-col p-[12px] items-center gap-[12px]">
            <p className={`text-[16px] font-normal text-[#CCF0E3] ${LatoFont.className}`}>
              By signing up, you agree to our Terms of Service & Privacy Policy.
            </p>
            <Button
              label="Sign Up"
              backgroundColor='#008A58'
              textColor='#ECF9F5'
              borderRadius={12}
              paddingX={10}
              paddingY={10}
              hoverTextColor='#b9dccf'
              fontSize={20}
              logo={<ArrowRight width={16} height={16}/>}
              logoDir={true}
              onClick={() => {
                onClose();
                setIsProfileModalOpen(true);
              }}
              />
        </div>

        <div className="flex w-full p-[12px] flex-col items-center gap-4">
          <div className="flex w-full items-center gap-6">
            <div className="h-px flex-1 bg-[#35B991]" />

            <span className={`${LatoFont.className} shrink-0 text-[14px] font-normal text-[#CCF0E3]`}>
              OR CONTINUE WITH
            </span>

            <div className="h-px flex-1 bg-[#35B991]" />
          </div>

          <Button
            label="Log in With Google"
            backgroundColor="#FFFFFF"
            textColor="#000000"
            borderRadius={12}
            paddingX={10}
            paddingY={10}
            hoverTextColor="#8c8c8c"
            fontSize={20}
            logo={<GoogleLogo width={16} height={16}/>}
          />
        </div>

        <div className="p-[12px]  w-full border-t border-[#199E72] pt-4">
          <p className={`text-[18px] font-normal text-center text-[#145B46] ${LatoFont.className}`}>
            Already have a Quiver account?{' '}
            <button
              type="button"
              onClick={() => {
                onClose();
                setIsLogInOpen(true);
              }}
              className="font-bold underline underline-offset-2 hover:opacity-70"
            >
              Log In
            </button>
          </p>
        </div>    
      </div>
    </CommonModal>
    <CompleteYourProfileModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)}/>    
    {/*<LoginModal isOpen={isLogInModalOpen} onClose={() => setIsLogInOpen(false)}/>*/} {/* When i uncomment this out para maredirect sa login, the page suddenly becomes unresponsive hello wtf ive been at this for an hour this will NOT be like that scrollbar issue GOOD FUCKING NIGHT */}
    </>

  );
}
