
import { Lato } from 'next/font/google';
import { useState } from 'react';
import { OpenEye, ClosedEye } from './logos';

const LatoFont = Lato({
  weight: ['400', '700'],
  subsets: ['latin'],
  display: 'swap',
  adjustFontFallback: false,
});

export interface InputFieldProps {
  placeholder: string;
  inputType: 'text' | 'date' | 'number' | 'email' | 'password';
  inputName: string;
  maxLength?: number;
  placeholderColor: string;
  inputNameColor: string;
  borderColor: string;
  inputBackgroundColor: string;
  fontSize: number;
  onClick?: () => void;
}

export const InputField = ({
  placeholder,
  inputType,
  inputName,
  maxLength,
  placeholderColor,
  inputNameColor,
  borderColor,
  inputBackgroundColor,
  fontSize = 12,
  onClick,
}: InputFieldProps) => {
  const [inputValue, setInputValue] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const isPassword = inputType === 'password';

  return (
    <div className="p-[5px] input-field flex flex-col gap-[3px] w-full">
      <span
        className={`${LatoFont.className} font-bold pl-[6px]`}
        style={{
          color: inputNameColor,
          fontSize: `${fontSize}px`,
        }}
      >
        {inputName}
      </span>

      <div className="relative w-full">
        <input
          type={isPassword && showPassword ? 'text' : inputType}
          name={inputName}
          placeholder={placeholder}
          maxLength={maxLength}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onClick={onClick}
          className={`${LatoFont.className} font-bold w-full border-2 rounded-[12px] px-3 py-2 ${
            isPassword ? 'pr-10' : ''
          } placeholder:text-[var(--placeholder-color)]`}
          style={{
            borderColor: borderColor,
            color: placeholderColor,
            backgroundColor: inputBackgroundColor,
            fontSize: `${fontSize}px`,
            '--placeholder-color': placeholderColor,
          } as React.CSSProperties}
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center"
          >
            {showPassword ? (
                <ClosedEye color={placeholderColor} width={20} height={20} />
                ) : (
                <OpenEye color={placeholderColor} width={20} height={20} />
            )}
          </button>
        )}
      </div>

      {maxLength !== undefined && (
        <span
          className={`${LatoFont.className} font-bold text-right pr-[7px]`}
          style={{
            color: inputNameColor,
            fontSize: `${fontSize}px`,
          }}
        >
          {inputValue.length}/{maxLength}
        </span>
      )}
    </div>
  );
};
