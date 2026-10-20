'use client';

import { Cal_Sans } from 'next/font/google';

const calSans = Cal_Sans({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
  adjustFontFallback: false,
});


export const Footer = () => {
  return (
    <footer>
    <div className="flex flex-row items-center justify-center h-[36px] w-full bg-[#008A58] shadow-[0px_4px_8.8px_rgba(0,0,0,0.4)]">
        <h1 className={`${calSans.className} justify-center left-[calc(50%-166px-0.5px)] top-[calc(50%-13px-1px)] flex text-center text-[14px] leading-[26px] font-normal text-[#F5FEF2]`}>© 2026 The Quiver. All rights reserved.</h1>
    </div>
  </footer>
)
};