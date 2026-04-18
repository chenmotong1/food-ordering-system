"use client";

interface PickupCardProps {
  pickupNo: string;
}

export default function PickupCard({ pickupNo }: PickupCardProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)] px-8 py-8 text-white shadow-lg">
      <span className="text-lg font-medium opacity-90">取餐号</span>
      <span className="mt-2 text-8xl font-black tracking-widest">
        {pickupNo}
      </span>
      <span className="mt-2 text-sm opacity-75">请留意叫号屏</span>
    </div>
  );
}
