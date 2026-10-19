'use client';

import { Button } from "../Button";
import { ShoppingCart, LightningBolt } from "../logos";
import { Braah_One, Lato } from 'next/font/google';

const braahOne = Braah_One({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
});

const LatoFont = Lato({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
});


export const HeroSection = () => {
    return (
        <div className="flex flex-col w-full gap-12">
            <div className="flex flex-col gap-12">
                <h1 className={`${braahOne.className} flex items-center text-[78px] text-[#000000] leading-[30px] font-normal`}>Made By <span className="ml-1 text-[#004D31]">Lasallians</span>,</h1>
                <h1 className={`${braahOne.className} flex items-center text-[78px] text-[#000000] leading-[30px] font-normal`}>For <span className="ml-1 text-[#004D31]">Lasallians</span>.</h1>
            </div>
            <div className="">
                <h1 className={`${LatoFont.className} flex items-center text-[28px] text-[#004D31]/50 leading-[30px] font-normal`}>
                    A one-stop marketplace for student organization merchandise drops, built by and for the Lasallian community.
                </h1>
            </div>
            <div className ="flex items-center flex-row gap-[8px] w-[640px]"> {/* LOGIN AND SIGNUP */}
                <Button
                primary
                size="small"
                textColor='#FFFFFF'
                hoverTextColor='#b9dccf'
                backgroundColor="#00B775"
                borderRadius={6}
                paddingX={15}
                paddingY={6}
                label="Shop Now"
                logo={<ShoppingCart width={16} height={16}/>}
                />
                <Button
                size="small"
                borderRadius={6}
                borderWidth={1}
                borderColor='#004D31'
                paddingX={15}
                paddingY={6}
                textColor='#004D31'
                hoverTextColor='#00B775'
                label="Explore New Arrivals"
                logo={<LightningBolt width={16} height={16}/>}
                />
            </div>
        </div>         
    );
};
