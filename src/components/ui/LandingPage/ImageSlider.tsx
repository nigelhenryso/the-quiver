'use client';

import { useState, useEffect } from "react";
import { ChevronLeft } from "../logos";
import { ChevronRight } from "../logos";

const slides = [
    { url: "/images/market-dlsu-1.jpg", title: "Market 1" },
    { url: "/images/market-dlsu-2.jpg", title: "Market 2" },
    { url: "/images/market-dlsu-3.jpg", title: "Market 3" },
    { url: "/images/market-4.jpg", title: "Market 4" },
];

export const ImageSlider = () => {
    const [currentIndex, setCurrentIndex] = useState(3);

    useEffect(() =>{
        const autoplay = setInterval(() => {
            nextSlide()
        }, 3000)

        return () => clearInterval(autoplay)
    }, [currentIndex])
    const prevSlide = () => {
        setCurrentIndex((prevIndex) => (prevIndex === 0 ? slides.length - 1 : prevIndex - 1))
    };

    const nextSlide = () => {
        setCurrentIndex((prevIndex) => (prevIndex === slides.length - 1 ? 0 : prevIndex + 1))
    };

    {/*const Arrow = ({ direction, onClick } : {
        direction: "left" | "right";
        onClick: () => void;
    }) => {
        return (
            <div className={`hidden group-hover:block absolute top-[50%] translate-y-[-50%] text-2xl rounded-full p-2 text-white cursor-pointer ${
                direction === "left" ? "left-5" : "right-5"
            }`}
            style = {{[direction]} : }>
                {
                    direction === "left" ? (
                        <ChevronLeft onClick={onClick} width={25} height={25} />
                    ) : (
                        <ChevronRight onClick={onClick} width={25} height={25} />
                    )
                }
            </div>
        );
    };*/}

    return (
        <div className="max-w-full h-[480px] w-full m-auto py-15 relative group">
            <div
                style={{ backgroundImage: `url(${slides[currentIndex].url})` }}
                className="w-full h-full rounded-2xl bg-center bg-contain bg-no-repeat duration-500"
            ></div>
            {/* <Arrow direction="left" onClick={prevSlide}/> */}
            {/* <Arrow direction="right" onClick={nextSlide}/> */}
            
        </div>
    );
};