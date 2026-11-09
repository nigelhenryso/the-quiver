'use client';

import { useEffect, useState } from 'react';
import { Button } from "../Button";
import { ShoppingCart, LightningBolt } from "../logos";
import { ProductCardSlider } from "./ProductCardSlider";

export const HeroSection = () => {
    const [btnFont, setBtnFont] = useState(20);

    useEffect(() => {
        const update = () =>
            setBtnFont(Math.round(Math.min(20, Math.max(12, window.innerWidth * 0.014))));
        update();
        window.addEventListener('resize', update);
        return () => window.removeEventListener('resize', update);
    }, []);

    return (
        <>
        <div className="flex flex-row w-full gap-2 items-center pl-4">
            <div className="flex flex-col w-[45%] ">
                <div className="flex w-full min-w-0 flex-col gap-4">
                <h1 className={`font-heading text-[clamp(32px,4.5vw,68px)] font-bold leading-tight text-black`}>
                    Made By <span className="text-[#004D31]">Lasallians</span>, For{" "}
                    <span className="text-[#004D31]">Lasallians</span>.
                </h1>

                <p className={`font-body text-[clamp(16px,1.8vw,24px)] font-normal text-[#004D31]/50`}>
                    A one-stop marketplace for student organization merchandise drops, built by
                    and for the Lasallian community.
                </p>
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
                            paddingX={Math.round(btnFont * 0.75)}
                            paddingY={6}
                            label="Shop Now"
                            logo={<ShoppingCart width={btnFont * 0.8} height={btnFont * 0.8}/>}
                            fontSize={btnFont}
                        />
                    </div>
                    <div className="w-[60%]">
                        <Button
                            size="small"
                            borderRadius={6}
                            borderWidth={1}
                            borderColor='#004D31'
                            paddingX={Math.round(btnFont * 0.75)}
                            paddingY={6}
                            textColor='#004D31'
                            hoverTextColor='#00B775'
                            label="Explore New Arrivals"
                            logo={<LightningBolt width={btnFont * 0.8} height={btnFont * 0.8}/>}
                            fontSize={btnFont}
                        />
                    </div>
                </div>
            </div>
            <div className="flex flex-col w-[55%] items-center">
                <h1 className={`font-heading flex items-center text-[clamp(24px,3vw,40px)] text-[#199E72] font-normal`}>
                    Featured Products
                </h1>
                <ProductCardSlider/>
            </div>
        </div>  
        </>    
    );
};
