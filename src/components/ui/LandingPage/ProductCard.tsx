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
    <div className="relative flex h-fit w-fit flex-col items-center gap-[3px] overflow-hidden rounded-[15px] border-[0.25px] border-[#2F4531] bg-[#F5FEF2] p-3 shadow-[2px_2px_8.4px_rgba(0,0,0,0.25)] transition-all duration-200 ease-in-out hover:scale-105 hover:border-[#004D31] hover:shadow-lg">
      <img className="rounded-[20px] w-[180px] h-[180px] shrink-0 " src={imgDir} />

      <div className="w-full flex flex-row items-center justify-between">
        <div className="ml-1 mt-2 flex flex-row items-center">
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

        <p className={`${LatoFont.className} italic text-[12px] leading-none`}>
          {orgName}
        </p>
      </div>

      <h1 className={`${LatoFont.className} text-[20px] text-[#2F4531] font-bold`}>{productName}</h1>
      <h1 className={`${LatoFont.className} text-[20px] text-[#2F4531]`}>₱ {price}</h1>
    </div>
  );
};