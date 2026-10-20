'use client';

import { Button } from "../Button";
import { ShoppingCart, LightningBolt } from "../logos";
import { Cal_Sans, Braah_One, Lato } from 'next/font/google';
import { ProductCardSlider } from "./ProductCardSlider";

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

const calSans = Cal_Sans({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
  adjustFontFallback: false,
});


export const HeroSection = () => {
    return (
        <>
        <div className="flex flex-row w-full gap-2 items-center pl-4">
            <div className="flex flex-col w-[45%] ">
                <div className="flex flex-col ">
                    <h1 className={`${braahOne.className} flex flex-row items-center whitespace-nowrap text-[clamp(32px,5vw,68px)] font-normal text-[#000000]`}>
                    Made By <span className="ml-4 text-[#004D31]">Lasallians</span>,
                    </h1>

                    <h1 className={`${braahOne.className} flex flex-row items-center whitespace-nowrap text-[clamp(32px,5vw,68px)] font-normal text-[#000000]`}>
                    For <span className="ml-4 text-[#004D31]">Lasallians</span>.
                    </h1>
                </div>
                <div className="">
                    <h1 className={`${LatoFont.className}  flex items-center text-[24px] text-[#004D31]/50  font-normal`}>
                        A one-stop marketplace for student organization merchandise drops, built by and for the Lasallian community.
                    </h1>
                </div>
                <div className =" flex flex-row justify-between p-4 gap-4">
                    <div className=" w-[40%]">
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
                        fontSize={20}
                        />
                    </div>
                    <div className="w-[60%]">
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
                        fontSize={20}
                        />
                    </div>
                </div>
            </div>
            <div className="flex flex-col w-[55%] items-center">
                <h1 className={`${calSans.className} flex items-center text-[40px] text-[#199E72] font-normal`}>
                    Featured Products
                </h1>
                <ProductCardSlider/>
            </div>
        </div>  
        </>    
    );
};
