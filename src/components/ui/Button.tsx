import { Cal_Sans } from 'next/font/google';
import type { ReactNode } from 'react';
import { useState } from 'react';

const calSans = Cal_Sans({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
  adjustFontFallback: false,
});

export interface ButtonProps {
  primary?: boolean;
  backgroundColor?: string;
  borderColor?: string;
  size?: 'small' | 'medium' | 'large';
  type?: 'sign-up' | 'login' | 'nav';
  paddingX?: number;
  paddingY?: number;
  borderRadius?: number;
  borderWidth?: number;
  label?: string;
  logo?: ReactNode;
  textColor?: string;
  hoverTextColor?: string;
  hoverBackgroundColor?: string;
  fontSize: number
  logoDir?: boolean //0 if left; 1 if right
  onClick?: () => void;
}

export const Button = ({
  primary = false,
  size = 'medium',
  type,
  backgroundColor,
  hoverBackgroundColor,
  borderColor ,
  label,
  paddingX,
  paddingY,
  borderWidth,
  borderRadius,
  logo: Logo,
  textColor = '#FFFFFF',
  hoverTextColor,
  fontSize,
  logoDir,
  onClick,
}: ButtonProps) => {
  const [isHovered, setIsHovered] = useState(false);

  const buttonStyle = {
    color: isHovered
    ? hoverTextColor ?? textColor
    : textColor,
    backgroundColor: isHovered
    ? hoverBackgroundColor ?? backgroundColor
    : backgroundColor,
    borderColor,
    paddingLeft: paddingX,
    paddingRight: paddingX,
    paddingTop: paddingY,
    paddingBottom: paddingY,
    borderRadius,
    borderWidth,
  };

  var buttonClass = `${calSans.className}  w-full flex shrink-0 flex-row items-center justify-center gap-[5px] whitespace-nowrap transition-colors duration-300 ease-in-out cursor-pointer`;
  if (type === "nav"){
    buttonClass = `${calSans.className} w-fit flex shrink-0 flex-row items-center justify-center gap-[5px] whitespace-nowrap transition-colors duration-300 ease-in-out cursor-pointer`;
  }
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={buttonClass}
      style={buttonStyle}
    >
      {Logo && !logoDir && (
        <span className="flex shrink-0 translate-y-px items-center">
          {Logo}
        </span>
      )}

      <span
        className="flex items-center font-normal"
        style={{ fontSize }}
      >
        {label}
      </span>

      {Logo && logoDir && (
        <span className="flex shrink-0 translate-y-px items-center">
          {Logo}
        </span>
      )}
    </button>
  );
};
