// ₱34,500 with a smaller, muted ".00"
export default function Peso({ amount, className = "" }: { amount: number; className?: string }) {
  const [whole, cents] = amount.toFixed(2).split(".");
  return (
    <span className={className}>
      ₱{Number(whole).toLocaleString("en-PH")}
      <span className="ml-[2px] text-[0.5em] font-normal text-[#8C9A92]">.{cents}</span>
    </span>
  );
}
