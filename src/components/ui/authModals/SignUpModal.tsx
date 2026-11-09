'use client';

import { useState } from 'react';
import CommonModal from './CommonModal';
import { InputField } from '../InputField';
import { Button } from '../Button';
import { GoogleLogo, ArrowRight } from '../logos';
import {
  signUpSchema,
  toFieldErrors,
  type SignUpInput,
} from '@/src/lib/zodSchemas/authSchema';
import { setRememberMe } from '@/src/lib/supabase/client';
import { signInWithGoogle, signUpWithPassword } from '@/src/services/authService';


interface SignUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToLogin?: () => void;
  /** Called when sign-up produced a session right away (email confirmation off). */
  onSignedUp?: () => void;
  /** Error passed in from the OAuth callback redirect (e.g. non-DLSU Google account). */
  externalError?: string | null;
}

type Field = keyof SignUpInput;

const EMPTY_FORM: SignUpInput = { email: '', password: '', confirmPassword: '' };

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className={`font-body -mt-1 pl-[11px] text-sm font-bold text-[#7A1010]`}>
      {message}
    </p>
  );
}

export default function SignUpModal({
  isOpen,
  onClose,
  onSwitchToLogin,
  onSignedUp,
  externalError,
}: SignUpModalProps) {
  const [formData, setFormData] = useState<SignUpInput>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [confirmEmailSentTo, setConfirmEmailSentTo] = useState<string | null>(null);

  const shownError = formError ?? externalError ?? null;

  const validate = (data: SignUpInput) => {
    const result = signUpSchema.safeParse(data);
    setErrors(result.success ? {} : toFieldErrors<Field>(result.error.issues));
    return result;
  };

  const updateField = (field: Field, value: string) => {
    const next = { ...formData, [field]: value };
    setFormData(next);
    setFormError(null);
    if (submitted) validate(next);
    else setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleClose = () => {
    setFormData(EMPTY_FORM);
    setErrors({});
    setFormError(null);
    setSubmitted(false);
    setConfirmEmailSentTo(null);
    onClose();
  };

  const handleSignUp = async () => {
    setSubmitted(true);
    const result = validate(formData);
    if (!result.success) return;

    setLoading(true);
    setRememberMe(true); // new accounts are kept signed in for 30 days
    const outcome = await signUpWithPassword(result.data.email, result.data.password);
    setLoading(false);

    switch (outcome.status) {
      case 'error':
        setFormError(outcome.message);
        return;
      case 'exists':
        setErrors((prev) => ({ ...prev, email: 'An account with this email already exists. Log in instead.' }));
        return;
      case 'confirm_email':
        setConfirmEmailSentTo(result.data.email);
        return;
      case 'signed_in':
        setFormData(EMPTY_FORM);
        setSubmitted(false);
        onSignedUp?.();
        return;
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setFormError(null);
    setRememberMe(true);
    const { error } = await signInWithGoogle();
    // On success the browser navigates away to Google, so only handle failure.
    if (error) {
      setFormError(error.message);
      setGoogleLoading(false);
    }
  };

  if (confirmEmailSentTo) {
    return (
      <CommonModal isOpen={isOpen} onClose={handleClose}>
        <div className="flex flex-col gap-[12px] p-[12px]">
          <h1 className={`font-heading text-[36px] font-normal leading-[44px] text-[#E6FAF2]`}>
            Check your inbox
          </h1>
          <p className={`font-body text-[18px] leading-[24px] text-[#CCF0E3]`}>
            We sent a confirmation link to <span className="font-bold text-white">{confirmEmailSentTo}</span>.
            Open it in this browser to verify your account and complete your profile.
          </p>
          <Button
            label="Got it"
            backgroundColor="#008A58"
            textColor="#ECF9F5"
            borderRadius={12}
            paddingX={10}
            paddingY={10}
            hoverTextColor="#b9dccf"
            fontSize={20}
            onClick={handleClose}
          />
        </div>
      </CommonModal>
    );
  }

  return (
    <CommonModal isOpen={isOpen} onClose={handleClose}>
      <form
        noValidate
        className="flex flex-col gap-[2px]"
        onSubmit={(e) => {
          e.preventDefault();
          void handleSignUp();
        }}
      >
        {/* lets Enter submit the form */}
        <button type="submit" className="sr-only" tabIndex={-1} aria-hidden="true" />
        <div className="flex flex-col p-[12px] gap-[6px]">
          <h1 className={`font-heading text-[36px] font-normal leading-[44px] text-[#E6FAF2]`}>
            Sign Up
          </h1>
          <p className={`font-body text-[18px] font-normal leading-[22px] text-[#CCF0E3]`}>
            Provide your school email and account details to get started.
          </p>
        </div>

        <div className="flex flex-col p-[12px] gap-1">
          <div className="flex flex-col">
            <InputField
              placeholder="e.g. juan_dela_cruz@dlsu.edu.ph"
              inputType="email"
              inputName="DLSU Email"
              autoComplete="email"
              inputNameColor="#CCF0E3"
              inputBackgroundColor="#F5FEF2"
              placeholderColor="#80AA8C"
              borderColor={errors.email ? '#EF4444' : '#A6BA9F'}
              fontSize={16}
              value={formData.email}
              onChange={(v) => updateField('email', v)}
            />
            <FieldError message={errors.email} />
          </div>

          <div className="flex flex-col">
            <InputField
              placeholder="Create a strong password"
              inputType="password"
              inputName="Password"
              autoComplete="new-password"
              inputNameColor="#CCF0E3"
              inputBackgroundColor="#F5FEF2"
              placeholderColor="#80AA8C"
              borderColor={errors.password ? '#EF4444' : '#A6BA9F'}
              fontSize={16}
              value={formData.password}
              onChange={(v) => updateField('password', v)}
            />
            <FieldError message={errors.password} />
            {!errors.password}
          </div>

          <div className="flex flex-col">
            <InputField
              placeholder="Retype Password"
              inputType="password"
              inputName="Confirm Password"
              autoComplete="new-password"
              inputNameColor="#CCF0E3"
              inputBackgroundColor="#F5FEF2"
              placeholderColor="#80AA8C"
              borderColor={errors.confirmPassword ? '#EF4444' : '#A6BA9F'}
              fontSize={16}
              value={formData.confirmPassword}
              onChange={(v) => updateField('confirmPassword', v)}
            />
            <FieldError message={errors.confirmPassword} />
          </div>

          {shownError && (
            <p role="alert" className={`font-body mt-2 rounded-[10px] bg-[#FDECEC] px-3 py-2 text-[15px] font-bold text-[#B91C1C]`}>
              {shownError}
            </p>
          )}
        </div>

        <div className="flex flex-col p-[12px] items-center gap-[12px]">
          <p className={`font-body text-[16px] font-normal text-[#CCF0E3]`}>
            By signing up, you agree to our Terms of Service &amp; Privacy Policy.
          </p>

          <Button
            label={loading ? 'Creating account…' : 'Sign Up'}
            backgroundColor="#008A58"
            textColor="#ECF9F5"
            borderRadius={12}
            paddingX={10}
            paddingY={10}
            hoverTextColor="#b9dccf"
            fontSize={20}
            logo={<ArrowRight width={16} height={16} />}
            logoDir={true}
            disabled={loading || googleLoading}
            onClick={() => void handleSignUp()}
          />
        </div>

        <div className="flex w-full p-[12px] flex-col items-center gap-4">
          <div className="flex w-full items-center gap-6">
            <div className="h-px flex-1 bg-[#35B991]" />
            <span className={`font-body shrink-0 text-[14px] font-normal text-[#CCF0E3]`}>
              OR CONTINUE WITH
            </span>
            <div className="h-px flex-1 bg-[#35B991]" />
          </div>

          <Button
            label={googleLoading ? 'Redirecting to Google…' : 'Sign up with Google'}
            backgroundColor="#FFFFFF"
            textColor="#000000"
            borderRadius={12}
            paddingX={10}
            paddingY={10}
            hoverTextColor="#8c8c8c"
            fontSize={20}
            logo={<GoogleLogo width={16} height={16} />}
            disabled={loading || googleLoading}
            onClick={() => void handleGoogleSignIn()}
          />
        </div>

        <div className="p-[12px] w-full border-t border-[#199E72] pt-4">
          <p className={`font-body text-[18px] font-normal text-center text-[#145B46]`}>
            Already have a Quiver account?{' '}
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="font-bold underline underline-offset-2 hover:opacity-70"
            >
              Log In
            </button>
          </p>
        </div>
      </form>
    </CommonModal>
  );
}
