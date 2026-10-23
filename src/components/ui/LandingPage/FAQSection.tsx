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
                question="Is The Quiver free to use?"
                description="Yes! Browsing products and creating an account are free. However, purchases may require payment for the products and any applicable delivery fees."    
            />
            <FAQCard 
                question="How can I as a buyer pay for my order?"
                description="You can pay using the payment methods available at checkout. These may include e-wallets, online banking, or cash on delivery, depending on the available options."    
            />
            <FAQCard 
                question="Can I get a refund if I cancel my order?"
                description="Refunds are subject to each organization's refund policy. Please contact the organization you purchased from to learn about its refund eligibility and procedures."    
            />
            <FAQCard 
                question="What if I receive a damaged or incorrect item?"
                description="Report the issue as soon as possible through the available support channels. Include your order details and photos of the item, if requested, to help resolve the issue."    
            />
            <FAQCard 
                question="How do I create an account?"
                description="Select the sign-up option on The Quiver, provide the required information, and follow the instructions to complete your registration."    
            />
        </div>  
        </>    
    );
};
