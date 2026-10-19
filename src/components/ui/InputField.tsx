
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
  options?: string[];
  onClick?: () => void;
  onChange?: (value: string) => void;
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
  options,
  onClick,
  onChange,
}: InputFieldProps) => {
  const [inputValue, setInputValue] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const isPassword = inputType === 'password';
  const isDropdown = options !== undefined;

  const handleChange = (value: string) => {
    setInputValue(value);
    onChange?.(value);
  };

  const fieldClassName = `${LatoFont.className} w-full rounded-[12px] border-2 px-3 py-2 font-bold`;

  const fieldStyle = {
    borderColor,
    color: inputValue ? placeholderColor : placeholderColor,
    backgroundColor: inputBackgroundColor,
    fontSize: `${fontSize}px`,
  };

  return (
    <div className="input-field flex w-full flex-col gap-[3px] p-[5px]">
      <label
        htmlFor={inputName}
        className={`${LatoFont.className} pl-[6px] font-bold`}
        style={{
          color: inputNameColor,
          fontSize: `${fontSize}px`,
        }}
      >
        {inputName}
      </label>

      <div className="relative w-full">
        {isDropdown ? (
          <select
            id={inputName}
            name={inputName}
            value={inputValue}
            onChange={(e) => handleChange(e.target.value)}
            onClick={onClick}
            className={`${fieldClassName} cursor-pointer appearance-none pr-10 ${
              inputValue ? '' : 'text-[var(--placeholder-color)]'
            }`}
            style={{
              ...fieldStyle,
              '--placeholder-color': placeholderColor,
            } as React.CSSProperties}
          >
            <option value="" disabled>
              {placeholder}
            </option>

            {options.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        ) : (
          <input
            id={inputName}
            type={isPassword && showPassword ? 'text' : inputType}
            name={inputName}
            placeholder={placeholder}
            maxLength={maxLength}
            value={inputValue}
            onChange={(e) => handleChange(e.target.value)}
            onClick={onClick}
            className={`${fieldClassName} placeholder:text-[var(--placeholder-color)] ${
              isPassword ? 'pr-10' : ''
            }`}
            style={{
              ...fieldStyle,
              '--placeholder-color': placeholderColor,
            } as React.CSSProperties}
          />
        )}

        {isDropdown && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke={placeholderColor}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </span>
        )}

        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center justify-center"
          >
            {showPassword ? (
              <ClosedEye color={placeholderColor} width={20} height={20} />
            ) : (
              <OpenEye color={placeholderColor} width={20} height={20} />
            )}
          </button>
        )}
      </div>

      {maxLength !== undefined && !isDropdown && (
        <span
          className={`${LatoFont.className} pr-[7px] text-right font-bold`}
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
