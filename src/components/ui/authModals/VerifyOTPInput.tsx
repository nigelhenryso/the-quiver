'use client';

import { useEffect, useRef, useState, type ClipboardEvent, type KeyboardEvent } from 'react';
import CommonModal from './CommonModal';
import { Button } from '../Button';

const OTP_LENGTH = 6;
const EMPTY_CODE = Array<string>(OTP_LENGTH).fill('');
const RESEND_COOLDOWN_SECONDS = 60;

interface VerifyOTPInputProps {
  isOpen: boolean;
  onClose: () => void;
  email?: string;
  onSubmit?: (code: string) => void | Promise<void>;
  onResend?: () => void | Promise<void>;
  onBack?: () => void;
  error?: string | null;
  loading?: boolean;
}

export default function VerifyOTPInput({
  isOpen,
  onClose,
  email,
  onSubmit,
  onResend,
  onBack,
  error,
  loading = false,
}: VerifyOTPInputProps) {
  const [digits, setDigits] = useState<string[]>(EMPTY_CODE);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);
  // A code was just sent when this screen appears, so start with the cooldown running.
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  /** Clears the boxes, restarts the 60s cooldown, and asks the parent to send a new code. */
  const handleResend = async () => {
    setDigits(EMPTY_CODE);
    setCooldown(RESEND_COOLDOWN_SECONDS);
    focusBox(0);
    await onResend?.();
  };

  const code = digits.join('');
  const isComplete = code.length === OTP_LENGTH;

  /** Moves the cursor to a box (kept within the first and last box). */
  const focusBox = (index: number) => {
    inputsRef.current[Math.max(0, Math.min(OTP_LENGTH - 1, index))]?.focus();
  };

  /** Fills boxes starting at `start` with the digits in `value` (ignores non-digits), then moves the cursor after them. */
  const fillFrom = (start: number, value: string) => {
    const chars = value.replace(/\D/g, '').slice(0, OTP_LENGTH - start).split('');
    if (chars.length === 0) return;
    setDigits((prev) => {
      const next = [...prev];
      chars.forEach((char, i) => (next[start + i] = char));
      return next;
    });
    focusBox(start + chars.length);
  };

  /** Handles typing in a box: clears it, or fills from it (autofill can give several digits at once). */
  const handleChange = (index: number, value: string) => {
    if (value === '') {
      setDigits((prev) => prev.map((d, i) => (i === index ? '' : d)));
      return;
    }
    // Typing over a filled box or autofill can give several characters at once.
    fillFrom(index, value);
  };

  /** Backspace on an empty box clears the previous one; arrow keys move between boxes. */
  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      e.preventDefault();
      setDigits((prev) => prev.map((d, i) => (i === index - 1 ? '' : d)));
      focusBox(index - 1);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      focusBox(index - 1);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      focusBox(index + 1);
    }
  };

  /** Pastes a code into the boxes starting at the current one. */
  const handlePaste = (index: number, e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    fillFrom(index, e.clipboardData.getData('text'));
  };

  /** Clears the boxes and closes the modal. */
  const handleClose = () => {
    setDigits(EMPTY_CODE);
    onClose();
  };

  /** Sends the code to the parent once all 6 digits are filled (and not already loading). */
  const handleSubmit = () => {
    if (!isComplete || loading) return;
    void onSubmit?.(code);
  };

  return (
    <CommonModal isOpen={isOpen} onClose={handleClose}>
      <form
        noValidate
        className="flex flex-col gap-[6px]"
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
      >
        <div className="flex flex-col p-[12px] gap-[6px]">
          <h1 className="font-heading text-[40px] font-normal leading-[52px] text-[#E6FAF2]">
            Verify It’s You
          </h1>
          <p className="font-body text-[20px] font-normal leading-[24px] text-[#E6FAF2]">
            We sent a verification code to{' '}
            {email ? <span className="font-bold">{email}</span> : 'your email'}. Please enter it to
            verify your account.
          </p>
        </div>

        <div className="flex flex-col p-[12px] gap-[14px]">
          <div className="flex w-full flex-row justify-between gap-[14px]">
            {digits.map((digit, index) => (
              <input
                key={index}
                ref={(el) => {
                  inputsRef.current[index] = el;
                }}
                type="text"
                inputMode="numeric"
                autoComplete={index === 0 ? 'one-time-code' : 'off'}
                aria-label={`Digit ${index + 1} of ${OTP_LENGTH}`}
                maxLength={OTP_LENGTH}
                value={digit}
                disabled={loading}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={(e) => handlePaste(index, e)}
                onFocus={(e) => e.target.select()}
                className={`font-heading aspect-[90/105] w-full min-w-0 flex-1 rounded-[12px] border-2 bg-[#F2FDF4] text-center text-[40px] text-[#004D31] outline-none transition-colors focus:border-[#004D31] disabled:opacity-70 ${
                  error ? 'border-[#B91C1C]' : 'border-[#008A58]'
                }`}
              />
            ))}
          </div>

          {error && (
            <p role="alert" className="font-body rounded-[10px] bg-[#FDECEC] px-3 py-2 text-[15px] font-bold text-[#B91C1C]">
              {error}
            </p>
          )}

          <p className="font-body pl-[4px] text-[20px] font-normal leading-[24px] text-[#004D31]">
            Didn’t receive the OTP?{' '}
            <button
              type="button"
              onClick={() => void handleResend()}
              disabled={loading || cooldown > 0}
              className="font-bold underline underline-offset-4 hover:opacity-70 disabled:cursor-not-allowed disabled:no-underline disabled:opacity-60"
            >
              {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend'}
            </button>
          </p>
        </div>

        {/* lets Enter submit the form */}
        <button type="submit" className="sr-only" tabIndex={-1} aria-hidden="true" />

        <div className="flex flex-col p-[12px] gap-[16px]">
          <Button
            label={loading ? 'Verifying…' : 'Submit'}
            backgroundColor="#008A58"
            textColor="#ECF9F5"
            borderRadius={12}
            paddingX={10}
            paddingY={14}
            hoverTextColor="#b9dccf"
            fontSize={24}
            disabled={!isComplete || loading}
            onClick={handleSubmit}
          />
          <Button
            label="Back"
            backgroundColor="#F4F4F4"
            borderColor="#8C8C8C"
            borderWidth={2}
            textColor="#6E8C79"
            hoverBackgroundColor="#E8E8E8"
            borderRadius={12}
            paddingX={10}
            paddingY={12}
            fontSize={24}
            disabled={loading}
            onClick={onBack ?? handleClose}
          />
        </div>
      </form>
    </CommonModal>
  );
}
