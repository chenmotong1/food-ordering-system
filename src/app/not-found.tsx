import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)] px-4">
      <div className="text-center max-w-md">
        <p className="text-8xl font-black text-[var(--color-primary)] mb-2">404</p>
        <h2 className="text-xl font-bold text-[var(--color-text-primary)] mb-2">
          页面未找到
        </h2>
        <p className="text-sm text-[var(--color-text-muted)] mb-6">
          您访问的页面不存在或已被移除。请检查链接是否正确。
        </p>
        <Link href="/">
          <Button className="gap-2">
            <Home size={16} />
            返回首页
          </Button>
        </Link>
      </div>
    </div>
  );
}
