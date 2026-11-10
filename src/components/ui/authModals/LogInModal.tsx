'use client';

import { useState } from 'react';
import CommonModal from './CommonModal';
import VerifyOTPInput from './VerifyOTPInput';
import { InputField } from '../InputField';
import { Button } from '../Button';
import { GoogleLogo, ArrowRight } from '../logos';
import { setRememberMe, supabase } from '@/src/lib/supabase/client';
import { loginSchema, toFieldErrors, type LoginInput } from '@/src/lib/zodSchemas/authSchema';
import { getAccountType, type AccountType } from '@/src/lib/supabase/accountType';
import {
  otpErrorMessage,
  resendEmailOtp,
  signInWithGoogle,
  signInWithPassword,
  verifyEmailOtp,
} from '@/src/services/authService';


interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToSignUp?: () => void;
  /** Called after login with the account type, so the parent knows where to send the user. */
  onLoggedIn?: (account: AccountType) => void;
  externalError?: string | null;
}

type Field = keyof LoginInput;

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className={`font-heading -mt-1 pl-[11px] text-sm font-bold text-[#7A1010]`}>
      {message}
    </p>
  );
}

export default function LoginModal({
  isOpen,
  onClose,
  onSwitchToSignUp,
  onLoggedIn,
  externalError,
}: LoginModalProps) {
  const [formData, setFormData] = useState<LoginInput>({ email: '', password: '' });
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [rememberMe, setRememberMeChecked] = useState(false);
  /** Set when the account exists but was never verified → show the OTP screen. */
  const [verifyEmail, setVerifyEmail] = useState<string | null>(null);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);

  const shownError = formError ?? externalError ?? null;

  const handleClose = () => {
    setFormData({ email: '', password: '' });
    setErrors({});
    setFormError(null);
    setRememberMeChecked(false);
    setVerifyEmail(null);
    setOtpError(null);
    onClose();
  };

  const updateField = (field: Field, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
    setFormError(null);
  };

  const handleLogin = async () => {
    const result = loginSchema.safeParse(formData);
    if (!result.success) {
      setErrors(toFieldErrors<Field>(result.error.issues));
      return;
    }
    setErrors({});
    setLoading(true);
    setRememberMe(rememberMe);

    const { data, error } = await signInWithPassword(result.data.email, result.data.password);
    if (error?.code === 'email_not_confirmed') {
      // Correct password, but sign-up was never verified → email a fresh code and ask for it.
      const { error: resendError } = await resendEmailOtp(result.data.email);
      setLoading(false);
      if (resendError) {
        setFormError(otpErrorMessage(resendError));
        return;
      }
      setOtpError(null);
      setVerifyEmail(result.data.email);
      return;
    }
    if (error || !data.user) {
      setLoading(false);
      setFormError('Incorrect email or password.');
      return;
    }

    await finishLogin(data.user.id);
  };

  const finishLogin = async (userId: string) => {
    const account = await getAccountType(supabase, userId);
    setLoading(false);
    setFormData({ email: '', password: '' });
    setRememberMeChecked(false);
    setVerifyEmail(null);
    onLoggedIn?.(account);
  };

  const handleVerifyOtp = async (code: string) => {
    if (!verifyEmail) return;
    setVerifying(true);
    setOtpError(null);
    const { data, error } = await verifyEmailOtp(verifyEmail, code);
    if (error) {
      setVerifying(false);
      setOtpError(otpErrorMessage(error));
      return;
    }
    // verifyOtp signs the user in.
    const userId = data.user?.id ?? (await supabase.auth.getUser()).data.user?.id;
    setVerifying(false);
    if (userId) await finishLogin(userId);
  };

  const handleResendOtp = async () => {
    if (!verifyEmail) return;
    setOtpError(null);
    const { error } = await resendEmailOtp(verifyEmail);
    if (error) setOtpError(otpErrorMessage(error));
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setFormError(null);
    setRememberMe(rememberMe);
    const { error } = await signInWithGoogle();
    if (error) {
      setFormError(error.message);
      setGoogleLoading(false);
    }
  };

  if (verifyEmail) {
    return (
      <VerifyOTPInput
        isOpen={isOpen}
        onClose={handleClose}
        email={verifyEmail}
        error={otpError}
        loading={verifying}
        onSubmit={handleVerifyOtp}
        onResend={handleResendOtp}
        onBack={() => {
          setVerifyEmail(null);
          setOtpError(null);
        }}
      />
    );
  }

  return (
    <CommonModal isOpen={isOpen} onClose={handleClose}>
      <form
        noValidate
        className="flex flex-col gap-[4px]"
        onSubmit={(e) => {
          e.preventDefault();
          void handleLogin();
        }}
      >
        {/* lets Enter submit the form */}
        <button type="submit" className="sr-only" tabIndex={-1} aria-hidden="true" />
        <div className="flex flex-col p-[12px] gap-[6px]">
          <h1 className={`items-center font-heading text-[40px] font-normal leading-[52px] text-[#E6FAF2]`}>
            Welcome Back
          </h1>
          <p className={`font-body text-[20px] font-normal leading-[24px] text-[#CCF0E3]`}>
            Login to your Quiver account to access exclusive campus merch drops and view exciting offers.
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
              borderColor={errors.email ? '#B91C1C' : '#A6BA9F'}
              fontSize={16}
              value={formData.email}
              onChange={(v) => updateField('email', v)}
            />
            <FieldError message={errors.email} />
          </div>

          <div className="flex flex-col">
            <InputField
              placeholder="Enter your password"
              inputType="password"
              inputName="Password"
              autoComplete="current-password"
              inputNameColor="#CCF0E3"
              inputBackgroundColor="#F5FEF2"
              placeholderColor="#80AA8C"
              borderColor={errors.password ? '#B91C1C' : '#A6BA9F'}
              fontSize={16}
              value={formData.password}
              onChange={(v) => updateField('password', v)}
            />
            <FieldError message={errors.password} />
          </div>

          <label className={`p-[10px] flex w-fit cursor-pointer items-center gap-2 text-[18px] font-bold text-[#008A58] font-body`}>
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMeChecked(e.target.checked)}
              className="peer relative h-[19px] w-[19px] shrink-0 cursor-pointer appearance-none rounded-[4px] border-2 border-[#008A58] bg-transparent checked:bg-[#008A58] checked:after:absolute checked:after:inset-0 checked:after:flex checked:after:items-center checked:after:justify-center checked:after:text-[13px] checked:after:font-bold checked:after:text-white checked:after:content-['✓']"
            />
            <span>Remember me</span>
          </label>

          {shownError && (
            <p role="alert" className={`font-heading rounded-[10px] bg-[#FDECEC] px-3 py-2 text-[15px] font-bold text-[#B91C1C]`}>
              {shownError}
            </p>
          )}
        </div>

        <div className="flex flex-col p-[12px] items-center gap-[12px]">
          <Button
            label={loading ? 'Logging in…' : 'Log In'}
            backgroundColor="#008A58"
            textColor="#ECF9F5"
            borderRadius={12}
            paddingX={10}
            paddingY={10}
            hoverTextColor="#b9dccf"
            fontSize={20}
            logo={<ArrowRight width={20} height={20} />}
            logoDir={true}
            disabled={loading || googleLoading}
            onClick={() => void handleLogin()}
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
            label={googleLoading ? 'Redirecting to Google…' : 'Log in With Google'}
            backgroundColor="#FFFFFF"
            textColor="#000000"
            borderRadius={12}
            paddingX={10}
            paddingY={10}
            hoverTextColor="#8c8c8c"
            fontSize={16}
            logo={<GoogleLogo width={20} height={20} />}
            disabled={loading || googleLoading}
            onClick={() => void handleGoogleSignIn()}
          />
        </div>

        <div className="p-[12px] w-full border-t border-[#199E72] pt-4">
          <p className={`text-[18px] font-normal text-center text-[#145B46] font-body`}>
            Don’t have a Quiver account yet?{' '}
            <button
              type="button"
              onClick={onSwitchToSignUp}
              className="font-bold underline underline-offset-2 hover:opacity-70"
            >
              Sign up
            </button>
          </p>
        </div>
      </form>
    </CommonModal>
  );
}
