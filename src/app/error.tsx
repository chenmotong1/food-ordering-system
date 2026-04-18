"use client";

import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)] px-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle size={32} className="text-[var(--color-error)]" />
        </div>
        <h2 className="text-xl font-bold text-[var(--color-text-primary)] mb-2">
          页面出错了
        </h2>
        <p className="text-sm text-[var(--color-text-muted)] mb-6">
          抱歉，页面遇到了一些问题。请尝试刷新页面，如果问题持续存在，请联系管理员。
        </p>
        <div className="flex gap-3 justify-center">
          <Button onClick={reset} variant="default">
            刷新页面
          </Button>
          <Button onClick={() => (window.location.href = "/")} variant="outline">
            返回首页
          </Button>
        </div>
        {process.env.NODE_ENV === "development" && (
          <p className="mt-4 text-xs text-[var(--color-text-muted)] bg-gray-100 p-3 rounded-lg text-left break-all">
            {error.message}
          </p>
        )}
      </div>
    </div>
  );
}
