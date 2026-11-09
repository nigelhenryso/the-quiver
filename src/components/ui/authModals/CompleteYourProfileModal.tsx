'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import CommonModal from './CommonModal';
import { InputField } from '../InputField';
import { Button } from '../Button';
import { ArrowRight, LockKeyHole } from '../logos';
import { supabase } from '@/src/lib/supabase/client';
import { COLLEGES,
  completeProfileSchema,
  toFieldErrors,
  type CompleteProfileInput,
} from '@/src/lib/zodSchemas/authSchema';
import { createStudentProfile } from '@/src/services/authService';


interface CompleteYourProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

type Field = keyof CompleteProfileInput;

const EMPTY_FORM: CompleteProfileInput = {
  firstName: '',
  lastName: '',
  idNumber: '',
  college: '',
  contactNo: '',
  birthday: '',
};

const fieldProps = {
  inputNameColor: '#CCF0E3',
  inputBackgroundColor: '#F5FEF2',
  placeholderColor: '#80AA8C',
  fontSize: 18,
} as const;

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className={`font-heading -mt-1 pl-[11px] text-sm font-bold text-[#EF4444]`}>
      {message}
    </p>
  );
}

export default function CompleteYourProfileModal({
  isOpen,
  onClose,
  onComplete,
}: CompleteYourProfileModalProps) {
  const router = useRouter();
  const [formData, setFormData] = useState<CompleteProfileInput>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Load the signed-in user and prefill from Google metadata when available.
  useEffect(() => {
    if (!isOpen) return;
    let active = true;

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!active) return;
      if (!user) {
        setFormError('Your session has expired. Please sign up or log in again.');
        return;
      }
      setUserId(user.id);
      setEmail(user.email ?? '');

      const meta = user.user_metadata ?? {};
      const [fallbackFirst = '', ...rest] = String(meta.full_name ?? meta.name ?? '').split(' ');
      setFormData((prev) => ({
        ...prev,
        firstName: prev.firstName || meta.given_name || fallbackFirst,
        lastName: prev.lastName || meta.family_name || rest.join(' '),
      }));
    });

    return () => {
      active = false;
    };
  }, [isOpen]);

  const validate = (data: CompleteProfileInput) => {
    const result = completeProfileSchema.safeParse(data);
    setErrors(result.success ? {} : toFieldErrors<Field>(result.error.issues));
    return result;
  };

  const updateField = (field: Field, value: string) => {
    const next = { ...formData, [field]: value };
    setFormData(next);
    setFormError(null);
    // Live re-validation only after the first submit attempt.
    if (submitted) validate(next);
    else setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async () => {
    setSubmitted(true);
    const result = validate(formData);
    if (!result.success) return;
    if (!userId) {
      setFormError('Your session has expired. Please sign up or log in again.');
      return;
    }

    setSubmitting(true);
    const { error } = await createStudentProfile(userId, email, result.data);
    setSubmitting(false);

    if (error) {
      if (error.code === '23505') {
        // unique_violation: either this account already has a profile, or the ID is taken.
        if (/dlsu_id_no/i.test(error.message + (error.details ?? ''))) {
          setErrors((prev) => ({ ...prev, idNumber: 'This ID number is already registered.' }));
          return;
        }
        // This account already has a profile — go straight to the student landing page.
        onComplete?.();
        router.replace('/landing');
        return;
      }
      console.error('[CompleteYourProfile] insert failed:', error);
      if (error.code === 'PGRST204') {
        const column = /'(\w+)' column/.exec(error.message)?.[1] ?? 'a required';
        setFormError(`The Student table has no "${column}" column yet. Add it in Supabase first.`);
        return;
      }
      if (error.code === '42501') {
        setFormError(`You are not allowed to create this profile (${error.message}).`);
        return;
      }
      setFormError(error.message);
      return;
    }

    setFormData(EMPTY_FORM);
    setSubmitted(false);
    onComplete?.();
    router.replace('/landing');
  };

  const borderFor = (field: Field) => (errors[field] ? '#e82b2b' : '#A6BA9F');

  return (
    <CommonModal isOpen={isOpen} onClose={onClose}>
      <form
        noValidate
        className="flex flex-col gap-[4px]"
        onSubmit={(e) => {
          e.preventDefault();
          void handleSubmit();
        }}
      >
        {/* lets Enter submit the form */}
        <button type="submit" className="sr-only" tabIndex={-1} aria-hidden="true" />
        <div className="flex flex-col p-[12px] gap-[6px]">
          <h1 className={`items-center font-heading text-[40px] font-normal leading-[52px] text-[#E6FAF2]`}>
            Complete your Profile
          </h1>
          <p className={`font-body text-[20px] font-normal leading-[24px] text-[#CCF0E3]`}>
            Set up your profile to unlock exclusive merch, organization pre-orders, and more.
          </p>
        </div>

        <div className="flex flex-col p-[12px] gap-1">
          <div className="flex flex-col">
            <InputField
              {...fieldProps}
              placeholder="DLSU Email"
              inputType="email"
              inputName="DLSU Email"
              borderColor="#A6BA9F"
              value={email}
              disabled
            />
          </div>

          <div className="flex flex-row gap-1">
            <div className="flex w-1/2 flex-col">
              <InputField
                {...fieldProps}
                placeholder="Enter First Name"
                inputType="text"
                inputName="First Name"
                autoComplete="given-name"
                borderColor={borderFor('firstName')}
                value={formData.firstName}
                onChange={(v) => updateField('firstName', v)}
              />
              <FieldError message={errors.firstName} />
            </div>
            <div className="flex w-1/2 flex-col">
              <InputField
                {...fieldProps}
                placeholder="Enter Last Name"
                inputType="text"
                inputName="Last Name"
                autoComplete="family-name"
                borderColor={borderFor('lastName')}
                value={formData.lastName}
                onChange={(v) => updateField('lastName', v)}
              />
              <FieldError message={errors.lastName} />
            </div>
          </div>

          <div className="flex flex-row gap-1">
            <div className="flex w-1/2 flex-col">
              <InputField
                {...fieldProps}
                placeholder="12******"
                inputType="text"
                inputMode="numeric"
                inputName="ID Number"
                borderColor={borderFor('idNumber')}
                value={formData.idNumber}
                onChange={(v) => updateField('idNumber', v.replace(/\D/g, '').slice(0, 8))}
              />
              <FieldError message={errors.idNumber} />
            </div>
            <div className="flex w-1/2 flex-col">
              <InputField
                {...fieldProps}
                placeholder="Select College"
                inputType="text"
                inputName="College"
                borderColor={borderFor('college')}
                options={[...COLLEGES]}
                value={formData.college}
                onChange={(v) => updateField('college', v)}
              />
              <FieldError message={errors.college} />
            </div>
          </div>

          <div className="flex flex-row gap-1">
            <div className="flex w-1/2 flex-col">
              <InputField
                {...fieldProps}
                placeholder="09XXXXXXXXX"
                inputType="text"
                inputMode="tel"
                inputName="Contact Number"
                autoComplete="tel"
                borderColor={borderFor('contactNo')}
                value={formData.contactNo}
                onChange={(v) => updateField('contactNo', v.replace(/[^\d+\s-]/g, '').slice(0, 16))}
              />
              <FieldError message={errors.contactNo} />
            </div>
            <div className="flex w-1/2 flex-col">
              <InputField
                {...fieldProps}
                placeholder="YYYY-MM-DD"
                inputType="date"
                inputName="Birthday"
                autoComplete="bday"
                borderColor={borderFor('birthday')}
                value={formData.birthday}
                onChange={(v) => updateField('birthday', v)}
              />
              <FieldError message={errors.birthday} />
            </div>
          </div>



          {formError && (
            <p role="alert" className={`font-heading mt-2 rounded-[10px] bg-[#FDECEC] px-3 py-2 text-[15px] font-bold text-[#B91C1C]`}>
              {formError}
            </p>
          )}
        </div>

        <div className="flex flex-col p-[12px] items-center gap-[12px]">
          <Button
            label={submitting ? 'Saving…' : 'Complete Setup & Start Exploring'}
            backgroundColor="#008A58"
            textColor="#ECF9F5"
            borderRadius={12}
            paddingX={10}
            paddingY={10}
            hoverTextColor="#b9dccf"
            fontSize={20}
            logo={<ArrowRight width={16} height={16} />}
            logoDir={true}
            disabled={submitting}
            onClick={() => void handleSubmit()}
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

        <div className="p-[12px] w-full border-t border-[#199E72] pt-4" />

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
      </form>
    </CommonModal>
  );
}
