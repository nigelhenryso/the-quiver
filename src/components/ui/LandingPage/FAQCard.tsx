
import { useState } from 'react';
import { Lato, Cal_Sans } from 'next/font/google';
import { ChevronDown, ChevronUp } from '../logos';

const LatoFont = Lato({
  weight: ['400', '700'],
  style: ['normal', 'italic'],
  subsets: ['latin'],
  display: 'swap',
  adjustFontFallback: false,
});

const calSans = Cal_Sans({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
  adjustFontFallback: false,
});

export interface FAQCardProps {
  question: string;
  description: string;
}

export const FAQCard = ({
  question,
  description,
}: FAQCardProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="m-auto w-full cursor-pointer rounded-[5px] bg-[#199E72] px-[22px] py-[14px] text-white shadow-[0px_4px_4px_1px_rgba(0,0,0,0.15)] transition-colors duration-300 hover:bg-[#178F69]">
        <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            aria-expanded={isOpen}
            className="flex w-full items-center justify-between gap-4 text-left"
            >
            <span className={`${calSans.className} text-[18px] leading-[24px]`}>
                {question}
            </span>

            <span className={`flex h-[24px] w-[24px] shrink-0 items-center justify-center transition-transform duration-300 ease-in-out ${ isOpen ? 'rotate-180' : 'rotate-0' }`}>
                <ChevronDown height={15} width={15} />
            </span>
        </button>

      <div
        className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out ${
          isOpen
            ? 'grid-rows-[1fr] opacity-100'
            : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="overflow-hidden">
          <p className={`${LatoFont.className} mt-[10px] pr-[12px] text-[14px] leading-[16px] text-white/90`}>
            {description}
          </p>
        </div>
      </div>
    </div>
  );
};

