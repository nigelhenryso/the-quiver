import { Header } from '@/src/components/ui/Header';

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="fixed top-0 left-0 z-50 w-full">
        <Header loggedIn student />
      </div>
      <div className="pt-[59px]">{children}</div>
    </>
  );
}
