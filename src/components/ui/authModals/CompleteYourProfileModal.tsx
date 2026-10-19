
import CommonModal from './CommonModal';
import { Cal_Sans, Lato } from 'next/font/google';
import { InputField } from '../InputField';
import { Button } from '../Button';
import { ArrowRight, LockKeyHole } from '../logos';


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

interface CompleteYourProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CompleteYourProfileModal({
  isOpen,
  onClose,
}: CompleteYourProfileModalProps) {
  return (
    <CommonModal isOpen={isOpen} onClose={onClose}>
      <div className="flex flex-col gap-[4px] ">
        <div className="flex flex-col p-[12px] gap-[6px]">
          <h1 className={`items-center ${calSans.className} text-[40px] font-normal leading-[52px] text-[#E6FAF2] ${calSans.className}`} >
            Complete your Profile
          </h1>
          <p className={`${LatoFont.className} text-[20px] font-normal leading-[24px] text-[#CCF0E3]`}>
            Set up you profile to unlock exclusive merch, organization pre-orders, and more.
          </p>
        </div>
        <div className="flex flex-col p-[12px]">
            <div className="flex flex-row">
                <InputField
                placeholder='Enter First Name'
                inputType='text'
                inputName='First Name'
                inputNameColor='#CCF0E3'
                inputBackgroundColor='#F5FEF2'
                placeholderColor='#80AA8C'
                borderColor='#A6BA9F'
                fontSize={20}/>

                <InputField
                placeholder='Enter Last Name'
                inputType='text'
                inputName='Last Name'
                inputNameColor='#CCF0E3'
                inputBackgroundColor='#F5FEF2'
                placeholderColor='#80AA8C'
                borderColor='#A6BA9F'
                fontSize={20}/>
            </div>
            <div className="flex flex-row">
                <InputField
                placeholder='Enter ID Number'
                inputType='number'
                inputName='DLSU Email'
                inputNameColor='#CCF0E3'
                inputBackgroundColor='#F5FEF2'
                placeholderColor='#80AA8C'
                borderColor='#A6BA9F'
                fontSize={20}/>

                <InputField
                    placeholder="Select College"
                    inputType="text"
                    inputName="College"
                    inputNameColor="#CCF0E3"
                    inputBackgroundColor="#F5FEF2"
                    placeholderColor="#80AA8C"
                    borderColor="#A6BA9F"
                    fontSize={20}
                    options={[
                        'BAGCED','CCS', 'CLA', 'COS', 'GCOE', 'RVRCOB','SOE'
                    ]}
                    />
            </div>
          
        </div>
        <div className="flex flex-col p-[12px] items-center gap-[12px]">
            <Button
              label="Complete Setup & Start Exploring"
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
          <div className="p-[12px]  w-full pt-4">
            <p className={`text-[18px] font-normal text-center text-[#145B46] ${LatoFont.className}`}>
                <button
                type="button"
                onClick={() => console.log('Log In clicked')}
                className="font-bold underline underline-offset-2 hover:opacity-70"
                >
                Skip for now, I’ll complete this later
                </button>
            </p>
            </div> 
        </div>

        <div className="p-[12px]  w-full border-t border-[#199E72] pt-4">
        </div> 

        <div className="flex w-full items-center justify-center">
            
            <p className={`${LatoFont.className} text-center text-[14px] font-normal text-[#008A58]`} >
            <LockKeyHole
                width={16}
                height={16}
                color="#168A68"
                className="inline-block align-middle mr-[4px]"
            />
            DLSU student data is encrypted and strictly used for pre-orders
            and pickup verification.
            </p>
        </div>
      </div>
    </CommonModal>
  );
}
