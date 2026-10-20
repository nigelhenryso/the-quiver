import { Lato } from 'next/font/google';

const LatoFont = Lato({
  weight: ['400', '700'],
  style: ['normal', 'italic'],
  subsets: ['latin'],
  display: 'swap',
  adjustFontFallback: false,
});

export interface OrgCardProps {
  id: number | string;
  name: string;
  imgDir: string;
}

export const OrgCard = ({
  name,
  id,
  imgDir
}: OrgCardProps) => {
  return (
    <div className="relative flex items-center justify-center w-[300px] h-[116px] bg-[#199E72] shadow-[0px_4px_4px_1px_rgba(0,0,0,0.25)] rounded-[15px] transition-all duration-200 ease-in-out hover:scale-105 hover:bg-[#137653] hover:shadow-lg">
      <img
        src={imgDir}
        className="w-[90px] h-[90px] shrink-0 object-contain"
        alt="Organization logo"
      />
    </div>
  );
};