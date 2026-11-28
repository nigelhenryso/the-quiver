import { useState } from 'react';
import { Info } from 'lucide-react';
import { OpenEye, ClosedEye } from './logos';


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
  value?: string;
  disabled?: boolean;
  autoComplete?: string;
  required?: boolean;
  /** Shows an info icon next to the label with this text as a hover/focus tooltip. */
  info?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'];
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
  value,
  disabled = false,
  autoComplete,
  inputMode,
  required,
  info,
  onClick,
  onChange,
}: InputFieldProps) => {
  const [inputValue, setInputValue] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const isPassword = inputType === 'password';
  const isDate = inputType === 'date';
  const isDropdown = options !== undefined;

  /** Updates the field's own value and passes it up to the parent's `onChange`. */
  const handleChange = (value: string) => {
    setInputValue(value);
    onChange?.(value);
  };

  const fieldClassName = `font-body w-full rounded-[12px] border-2 px-3 py-2 font-bold`;

  const fieldStyle = {
    borderColor,
    color: inputValue ? placeholderColor : placeholderColor,
    backgroundColor: inputBackgroundColor,
    fontSize: `${fontSize}px`,
  };

  return (
    <div className="input-field flex w-full flex-col gap-[3px] p-[5px]">
      <div className="flex items-center justify-between gap-[6px] px-[6px]">
        <label
          htmlFor={inputName}
          className="font-body font-bold"
          style={{
            color: inputNameColor,
            fontSize: `${fontSize}px`,
          }}
        >
          {inputName}
          {required && <span className="text-[#EF4444]"> *</span>}
        </label>

        {info && (
          <span className="group relative inline-flex">
            <button
              type="button"
              aria-label={`About ${inputName}`}
              aria-describedby={`${inputName}-info`}
              className="inline-flex cursor-help items-center rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[#CCF0E3]"
            >
              <Info width={fontSize - 2} height={fontSize - 2} color={inputNameColor} aria-hidden="true" />
            </button>
            <span
              id={`${inputName}-info`}
              role="tooltip"
              className="font-body pointer-events-none invisible absolute bottom-full right-0 z-20 mb-2 w-64 rounded-[10px] bg-[#F5FEF2] px-3 py-2 text-[14px] font-normal leading-[18px] text-[#1F3D2B] opacity-0 shadow-lg transition-opacity group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100"
            >
              {info}
            </span>
          </span>
        )}
      </div>
      
      <div className="relative w-full">
        {isDropdown ? (
          <select
            id={inputName}
            name={inputName}
            value={value ?? inputValue}
            onChange={(e) => handleChange(e.target.value)}
            onClick={onClick}
            disabled={disabled}
            className={`${fieldClassName} cursor-pointer appearance-none pr-10 ${
              (value ?? inputValue) ? '' : 'text-[var(--placeholder-color)]'
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
            disabled={disabled}
            autoComplete={autoComplete}
            inputMode={inputMode}
            value={value ?? ''}
            onChange={(e) => handleChange(e.target.value)}
            onClick={(e) => {
              // Date inputs only open the calendar from the small icon; open it on any click.
              if (isDate && !disabled) {
                try {
                  e.currentTarget.showPicker?.();
                } catch {
                  /* unsupported browser: falls back to the native icon */
                }
              }
              onClick?.();
            }}
            className={`${fieldClassName} placeholder:text-[var(--placeholder-color)] disabled:cursor-not-allowed disabled:opacity-70 ${
              isPassword ? 'pr-10' : ''
            } ${isDate ? 'cursor-pointer' : ''}`}
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
          className={`font-body pr-[7px] text-right font-bold`}
          style={{
            color: inputNameColor,
            fontSize: `${fontSize}px`,
          }}
        >
          {(value ?? inputValue).length}/{maxLength}
        </span>
      )}
    </div>
  );
};
