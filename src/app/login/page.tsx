"use client";

import { useState, useEffect, Suspense, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUserStore } from "@/store/userStore";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import AnimatedCharacters from "@/components/login/AnimatedCharacters";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/menu";
  const user = useUserStore((s) => s.user);
  const login = useUserStore((s) => s.login);
  const fetchCurrentUser = useUserStore((s) => s.fetchCurrentUser);

  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [regForm, setRegForm] = useState({
    username: "",
    phone: "",
    password: "",
    confirm: "",
  });
  const [loginLoading, setLoginLoading] = useState(false);
  const [regLoading, setRegLoading] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [regError, setRegError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [activeTab, setActiveTab] = useState("login");

  // Animated character state
  const [isTyping, setIsTyping] = useState(false);
  const [loginFailed, setLoginFailed] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);

  let typingTimer: ReturnType<typeof setTimeout>;

  const handleInputFocus = useCallback(() => {
    setIsTyping(true);
  }, []);

  const handleInputBlur = useCallback(() => {
    // Small delay before resetting typing state
    clearTimeout(typingTimer);
    typingTimer = setTimeout(() => setIsTyping(false), 200);
  }, []);

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    if (user) router.replace(redirect);
  }, [user, redirect, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setLoginFailed(false);
    if (!loginForm.username || !loginForm.password) {
      setLoginError("请填写用户名和密码");
      return;
    }
    setLoginLoading(true);
    const result = await login(loginForm.username, loginForm.password);
    setLoginLoading(false);
    if (result.success) {
      setLoginSuccess(true);
      toast.success("登录成功");
      setTimeout(() => router.push(redirect), 1500);
    } else {
      setLoginFailed(true);
      setLoginError(result.message || "登录失败");
      setTimeout(() => setLoginFailed(false), 2000);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError("");

    if (regForm.username.length < 3 || regForm.username.length > 20) {
      setRegError("用户名需3-20个字符");
      return;
    }
    if (!/^1[3-9]\d{9}$/.test(regForm.phone)) {
      setRegError("手机号格式不正确");
      return;
    }
    if (regForm.password.length < 6) {
      setRegError("密码至少6个字符");
      return;
    }
    if (regForm.password !== regForm.confirm) {
      setRegError("两次密码不一致");
      return;
    }

    setRegLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: regForm.username,
          phone: regForm.phone,
          password: regForm.password,
        }),
      });
      const data = await res.json();
      setRegLoading(false);

      if (data.success) {
        toast.success("注册成功");
        router.push(redirect);
      } else {
        setRegError(data.error?.message || "注册失败");
      }
    } catch {
      setRegLoading(false);
      setRegError("网络错误，请重试");
    }
  };

  const passwordLength = activeTab === "login" ? loginForm.password.length : regForm.password.length;
  const isPasswordVisible = activeTab === "login" ? showPassword : showRegPassword;

  return (
    <div className="flex min-h-screen">
      {/* Left panel - Animated characters (desktop only) */}
      <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden items-end justify-center"
        style={{
          background: "linear-gradient(135deg, #e4002b 0%, #f28c28 50%, #ffc107 100%)",
        }}
      >
        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: "radial-gradient(circle at 20% 50%, rgba(255,255,255,0.3) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.2) 0%, transparent 40%)",
          }}
        />

        {/* Brand text */}
        <div className="absolute top-12 left-12 text-white z-10">
          <h2 className="text-4xl font-black tracking-tight">美味1165</h2>
          <p className="mt-2 text-white/80 text-lg">新鲜美味，即刻享用</p>
        </div>

        {/* Animated characters */}
        <div className="relative z-10 mb-8">
          <AnimatedCharacters
            isTyping={isTyping}
            showPassword={isPasswordVisible}
            passwordLength={passwordLength}
            loginFailed={loginFailed}
            loginSuccess={loginSuccess}
          />
        </div>
      </div>

      {/* Right panel - Login form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-white">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden mb-8 text-center">
            <h1 className="text-3xl font-black text-[var(--color-primary)]">美味1165</h1>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">新鲜美味，即刻享用</p>
          </div>

          {/* Welcome text */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">欢迎回来！</h2>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">请输入您的账户信息</p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">登录</TabsTrigger>
              <TabsTrigger value="register">注册</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <Label htmlFor="login-username" className="text-sm font-medium text-[var(--color-text-secondary)]">
                    用户名
                  </Label>
                  <Input
                    id="login-username"
                    value={loginForm.username}
                    onChange={(e) =>
                      setLoginForm((p) => ({ ...p, username: e.target.value }))
                    }
                    onFocus={handleInputFocus}
                    onBlur={handleInputBlur}
                    placeholder="请输入用户名"
                    className="mt-1.5 h-11 rounded-lg border-[var(--color-border)] focus:border-[var(--color-primary)] focus:ring-[var(--color-primary)]/20"
                  />
                </div>
                <div>
                  <Label htmlFor="login-password" className="text-sm font-medium text-[var(--color-text-secondary)]">
                    密码
                  </Label>
                  <div className="relative mt-1.5">
                    <Input
                      id="login-password"
                      type={showPassword ? "text" : "password"}
                      value={loginForm.password}
                      onChange={(e) =>
                        setLoginForm((p) => ({ ...p, password: e.target.value }))
                      }
                      onFocus={handleInputFocus}
                      onBlur={handleInputBlur}
                      placeholder="请输入密码"
                      className="h-11 pr-10 rounded-lg border-[var(--color-border)] focus:border-[var(--color-primary)] focus:ring-[var(--color-primary)]/20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                {loginError && (
                  <p className="text-sm text-[var(--color-error)] animate-in fade-in slide-in-from-top-1">{loginError}</p>
                )}
                <Button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full h-11 text-base font-semibold rounded-lg bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-dark)] transition-colors"
                >
                  {loginLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {loginSuccess ? "登录成功！" : "登录"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <Label htmlFor="reg-username" className="text-sm font-medium text-[var(--color-text-secondary)]">
                    用户名
                  </Label>
                  <Input
                    id="reg-username"
                    value={regForm.username}
                    onChange={(e) =>
                      setRegForm((p) => ({ ...p, username: e.target.value }))
                    }
                    onFocus={handleInputFocus}
                    onBlur={handleInputBlur}
                    placeholder="3-20个字符"
                    className="mt-1.5 h-11 rounded-lg border-[var(--color-border)] focus:border-[var(--color-primary)] focus:ring-[var(--color-primary)]/20"
                  />
                </div>
                <div>
                  <Label htmlFor="reg-phone" className="text-sm font-medium text-[var(--color-text-secondary)]">
                    手机号
                  </Label>
                  <Input
                    id="reg-phone"
                    type="tel"
                    value={regForm.phone}
                    onChange={(e) =>
                      setRegForm((p) => ({ ...p, phone: e.target.value }))
                    }
                    onFocus={handleInputFocus}
                    onBlur={handleInputBlur}
                    placeholder="请输入手机号"
                    className="mt-1.5 h-11 rounded-lg border-[var(--color-border)] focus:border-[var(--color-primary)] focus:ring-[var(--color-primary)]/20"
                  />
                </div>
                <div>
                  <Label htmlFor="reg-password" className="text-sm font-medium text-[var(--color-text-secondary)]">
                    密码
                  </Label>
                  <div className="relative mt-1.5">
                    <Input
                      id="reg-password"
                      type={showRegPassword ? "text" : "password"}
                      value={regForm.password}
                      onChange={(e) =>
                        setRegForm((p) => ({ ...p, password: e.target.value }))
                      }
                      onFocus={handleInputFocus}
                      onBlur={handleInputBlur}
                      placeholder="至少6个字符"
                      className="h-11 pr-10 rounded-lg border-[var(--color-border)] focus:border-[var(--color-primary)] focus:ring-[var(--color-primary)]/20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
                      tabIndex={-1}
                    >
                      {showRegPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                <div>
                  <Label htmlFor="reg-confirm" className="text-sm font-medium text-[var(--color-text-secondary)]">
                    确认密码
                  </Label>
                  <Input
                    id="reg-confirm"
                    type="password"
                    value={regForm.confirm}
                    onChange={(e) =>
                      setRegForm((p) => ({ ...p, confirm: e.target.value }))
                    }
                    onFocus={handleInputFocus}
                    onBlur={handleInputBlur}
                    placeholder="再次输入密码"
                    className="mt-1.5 h-11 rounded-lg border-[var(--color-border)] focus:border-[var(--color-primary)] focus:ring-[var(--color-primary)]/20"
                  />
                </div>
                {regError && (
                  <p className="text-sm text-[var(--color-error)] animate-in fade-in slide-in-from-top-1">{regError}</p>
                )}
                <Button
                  type="submit"
                  disabled={regLoading}
                  className="w-full h-11 text-base font-semibold rounded-lg bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-dark)] transition-colors"
                >
                  {regLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  注册
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-white">
          <Skeleton className="h-96 w-96 rounded-xl" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
