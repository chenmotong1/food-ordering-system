"use client";

import { ORDER_STATUS_MAP } from "@/types";

interface OrderStatusBarProps {
  status: string;
}

const STEPS = ["pending", "preparing", "ready", "completed"];

export default function OrderStatusBar({ status }: OrderStatusBarProps) {
  const currentIndex = STEPS.indexOf(status);

  return (
    <div className="flex items-center justify-between px-2 py-4">
      {STEPS.map((step, i) => {
        const info = ORDER_STATUS_MAP[step];
        const isCompleted = currentIndex > i;
        const isCurrent = currentIndex === i;

        return (
          <div key={step} className="flex flex-1 items-center">
            {/* 节点 */}
            <div className="flex flex-col items-center">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                  isCompleted
                    ? "bg-[var(--color-success)] text-white"
                    : isCurrent
                    ? "bg-[var(--color-primary)] text-white animate-pulse"
                    : "bg-[var(--color-border)] text-[var(--color-text-muted)]"
                }`}
              >
                {isCompleted ? "✓" : i + 1}
              </div>
              <span
                className={`mt-1 text-xs font-medium ${
                  isCurrent
                    ? "text-[var(--color-primary)]"
                    : isCompleted
                    ? "text-[var(--color-success)]"
                    : "text-[var(--color-text-muted)]"
                }`}
              >
                {info?.label || step}
              </span>
            </div>

            {/* 连线 */}
            {i < STEPS.length - 1 && (
              <div
                className={`mx-1 h-0.5 flex-1 ${
                  isCompleted
                    ? "bg-[var(--color-success)]"
                    : "bg-[var(--color-border)]"
                }`}
                style={{
                  borderStyle: isCompleted ? "solid" : "dashed",
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
