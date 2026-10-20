
'use client';

import { useState } from 'react';
import { OrgCard } from './OrgCard';
import { Cal_Sans, Braah_One, Lato } from 'next/font/google';


const braahOne = Braah_One({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
});

export interface Org {
  id: number | string;
  name: string;
  imgDir: string;
}

interface OrgSliderProps {
  orgs?: Org[];
}

const sampleOrgs: Org[] = [
  { id: 1, name: 'LSCS', imgDir: '/images/org-1.png' },
  { id: 2, name: 'CHEN', imgDir: '/images/org-2.jpg' },
  { id: 3, name: 'DSS', imgDir: '/images/org-3.jpg' },
  { id: 4, name: 'ChemSoc', imgDir: '/images/org-4.jpg' },
  { id: 5, name: 'Mafia', imgDir: '/images/org-5.jpg' },
  { id: 6, name: 'EngliCom', imgDir: '/images/org-6.jpg' },
  { id: 7, name: 'GGFM', imgDir: '/images/org-7.jpg' },
  { id: 8, name: 'LSS', imgDir: '/images/org-8.jpg' },
  { id: 9, name: 'Archers Network', imgDir: '/images/org-9.jpg' },
  { id: 10, name: 'The Lasallian', imgDir: '/images/org-10.jpg' },
  { id: 11, name: 'SPRINT', imgDir: '/images/org-11.jpg' },
];

export const OrgSlider = ({
  orgs = sampleOrgs,
}: OrgSliderProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (orgs.length === 0) return null;
    const visibleCards = 5;
    const maxIndex = Math.max(0, orgs.length - visibleCards);

    const nextPage = () => {
    setCurrentIndex((index) => Math.min(index + 1, maxIndex));
    };

    const previousPage = () => {
    setCurrentIndex((index) => Math.max(index - 1, 0));
    };

  return (
    <section className="w-full py-8">
        <h1 className={`${braahOne.className} justify-center flex flex-row items-center whitespace-nowrap text-[40px] font-normal text-[#000000]`}>
            Partner Organizations
        </h1>
        <div className="relative flex w-full items-center justify-center">

        <button
          type="button"
          onClick={previousPage}
          disabled={currentIndex === 0}
          aria-label="Previous organization"
          className="absolute left-0 top-1/2 z-10 flex h-[24px] w-[24px] -translate-y-1/2 items-center justify-center rounded-full bg-[#244A36] text-white shadow-md transition hover:bg-[#3C7657] disabled:cursor-not-allowed disabled:opacity-30"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path
              d="M15 4L7 12L15 20"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        <div className="mx-[40px] w-full overflow-hidden py-4">
            <div
                className="flex transition-transform duration-500 ease-in-out"
                style={{
                    transform: `translateX(-${currentIndex * 20}%)`,
                }}
            >
                {orgs.map((org) => (
                <div
                    key={org.id}
                    className="flex w-1/5 shrink-0 justify-center px-2"
                >
                    <OrgCard
                    id={org.id}
                    name={org.name}
                    imgDir={org.imgDir}
                    />
                </div>
                ))}
            </div>
        </div>

        <button
          type="button"
          onClick={nextPage}
          disabled={currentIndex >= maxIndex}
          aria-label="Next organization"
          className="absolute right-0 top-1/2 z-10 flex h-[24px] w-[24px] -translate-y-1/2 items-center justify-center rounded-full bg-[#244A36] text-white shadow-md transition hover:bg-[#3C7657] disabled:cursor-not-allowed disabled:opacity-30"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path
              d="M9 4L17 12L9 20"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

      </div>
    </section>
  );
};
