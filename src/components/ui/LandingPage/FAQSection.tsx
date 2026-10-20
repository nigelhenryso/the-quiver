'use client';

import { FAQCard } from "./FAQCard";
import { Braah_One } from 'next/font/google';


const braahOne = Braah_One({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
});

export const FAQSection = () => {
    return (
        <>
        <div className="flex flex-col w-full gap-6 items-center pl-4">
            <h1 className={`${braahOne.className} justify-center flex flex-row items-center whitespace-nowrap text-[40px] font-normal text-[#000000]`}>
                Frequently Asked Questions
            </h1>
            <FAQCard 
                question="fds"
                description="fwefe"    
            />
            <FAQCard 
                question="How to belejrlherlhewrlwe?"
                description="fwefefreg4refhjuirgr4jriwjiotj34iofhi3rthi934hioptwehiopteriotghioerhuiofwegerger3fgerf3erujfiwehjiofwerjiofweriorf0werhuio"    
            />
            <FAQCard 
                question="Where to rawrgwargawgrw?"
                description="fwefe"    
            />
            <FAQCard 
                question="When is the blehblehrlehrelhrel?"
                description="fwefe"    
            />
            <FAQCard 
                question="Why is hrewkjhrew?"
                description="fwefe"    
            />
        </div>  
        </>    
    );
};
