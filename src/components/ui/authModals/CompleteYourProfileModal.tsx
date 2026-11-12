
import CommonModal from './CommonModal';
import { InputField } from '../InputField';
import { Button } from '../Button';
import { ArrowRight, LockKeyHole } from '../logos';



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
          <h1 className={`items-center font-heading text-[40px] font-normal leading-[52px] text-[#E6FAF2]`}>
            Complete your Profile
          </h1>
          <p className={`font-body text-[20px] font-normal leading-[24px] text-[#CCF0E3]`}>
            Set up your profile to unlock exclusive merch, organization pre-orders, and more.
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
                placeholder='12******'
                inputType='number'
                inputName='Enter ID Number'
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
          <p className={`text-[18px] font-normal text-center text-[#145B46] font-body`}>
            <button
              type="button"
              onClick={onClose}
              className="font-bold underline underline-offset-2 hover:opacity-70"
            >
              Skip for now, I’ll complete this later
            </button>
          </p>
        </div>

        <div className="p-[12px]  w-full border-t border-[#199E72] pt-4">
        </div> 

        <div className="flex w-full items-center justify-center">
          <p className={`font-body text-center text-[14px] font-normal text-[#008A58]`}>
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
