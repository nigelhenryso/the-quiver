import { Lato } from 'next/font/google';
import { ProductCardStar } from '../logos';

const LatoFont = Lato({
  weight: ['400', '700'],
  style: ['normal', 'italic'],
  subsets: ['latin'],
  display: 'swap',
  adjustFontFallback: false,
});

export interface ProductCardProps {
  primary?: boolean;
  logoDir?: boolean;
  productName: string;
  orgName: string;
  starCount: number;
  price: number;
  imgDir: string;
  onClick?: () => void;
}

export const ProductCard = ({
  primary = false,
  onClick,
  starCount,
  orgName,
  productName,
  price,
  imgDir
}: ProductCardProps) => {
  return (
    <div className="relative flex h-fit w-full min-w-0 max-w-[204px] flex-col items-center gap-[3px] overflow-hidden rounded-[15px] border-[0.25px] border-[#2F4531] bg-[#F5FEF2] p-2 shadow-[2px_2px_8.4px_rgba(0,0,0,0.25)] transition-all duration-200 ease-in-out hover:scale-105 hover:border-[#004D31] hover:shadow-lg sm:p-3">
      <img className="aspect-square h-auto w-full rounded-[20px] object-cover" src={imgDir} />

      <div className="flex w-full flex-row items-center justify-between gap-1">
        <div className="ml-1 mt-2 flex flex-row items-center [&_svg]:h-[clamp(8px,1.4vw,18px)] [&_svg]:w-[clamp(8px,1.4vw,18px)]">
          {Array.from({ length: starCount }, (_, index) => (
            <div
              key={index}
              className="flex items-center justify-center"
            >
              <ProductCardStar
                height={18}
                width={18}
                color="#00B775"
              />
            </div>
          ))}
        </div>

        <p className={`${LatoFont.className} italic text-[clamp(8px,1vw,12px)] leading-none`}>
          {orgName}
        </p>
      </div>

      <h1 className={`${LatoFont.className} text-[clamp(12px,1.6vw,20px)] text-[#2F4531] font-bold`}>{productName}</h1>
      <h1 className={`${LatoFont.className} text-[clamp(12px,1.6vw,20px)] text-[#2F4531]`}>₱ {price}</h1>
    </div>
  );
};
