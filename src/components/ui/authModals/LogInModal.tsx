
import CommonModal from './CommonModal';
import { Cal_Sans, Lato } from 'next/font/google';
import { InputField } from '../InputField';
import { Button } from '../Button';
import { GoogleLogo, ArrowRight } from '../logos';


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

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue: () => void;
}

export default function LoginModal({
  isOpen,
  onClose,
  onContinue,
}: LoginModalProps) {
  return (
    <CommonModal isOpen={isOpen} onClose={onClose}>
      <div className="flex flex-col gap-[4px] ">
        <div className="flex flex-col p-[12px] gap-[6px]">
          <h1 className={`items-center ${calSans.className} text-[40px] font-normal leading-[52px] text-[#E6FAF2] ${calSans.className}`} >
            Welcome Back
          </h1>
          <p className={`${LatoFont.className} text-[20px] font-normal leading-[24px] text-[#CCF0E3]`}>
            Login to your Quiver account to access exclusive campus merch drops and view exciting offers.
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
            fontSize={20}/>
          
            <InputField
              placeholder='Enter your password'
              inputType='password'
              inputName='Password'
              inputNameColor='#CCF0E3'
              inputBackgroundColor='#F5FEF2'
              placeholderColor='#80AA8C'
              borderColor='#A6BA9F'
              fontSize={20}/>
            
            <label className={`p-[10px] flex w-fit cursor-pointer items-center gap-2 text-[18px] font-bold text-[#008A58] ${LatoFont.className}`}>
                <input type="checkbox"  className="h-[19px] w-[19px] cursor-pointer appearance-none rounded-[2px] border-2 border-[#008A58] checked:bg-[#008A58] checked:before:text-white checked:before:content-['✓']" />
                <span>Remember me</span>
            </label>
        </div>
        <div className="flex flex-col p-[12px] items-center gap-[12px]">
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
            logo={<GoogleLogo width={20} height={20}/>}
          />
        </div>

        <div className="p-[12px]  w-full border-t border-[#35B991] pt-4">
          <p className={`text-[18px] font-normal text-center text-[#145B46] ${LatoFont.className}`}>
            Don’t have a Quiver account yet?{' '}
            <button
              type="button"
              onClick={() => console.log('Log In clicked')}
              className="font-bold underline underline-offset-2 hover:opacity-70"
            >
              Sign up
            </button>
          </p>
        </div>    
      </div>
    </CommonModal>
  );
}
