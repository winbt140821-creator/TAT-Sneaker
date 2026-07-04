import type { Metadata } from "next";
import { getSiteSettings } from "@/lib/settings";
import { Logo } from "@/components/Logo";
import { LoginForm } from "./LoginForm";

const ERROR_MESSAGE: Record<string, string> = {
  google: "Đăng nhập Google thất bại. Vui lòng thử lại.",
  not_staff: "Tài khoản Google này chưa được cấp quyền truy cập quản trị.",
};

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const [{ error }, settings] = await Promise.all([searchParams, getSiteSettings()]);

  return (
    <div className="flex min-h-dvh items-center justify-center bg-kraft px-4">
      <div className="die-cut w-full max-w-sm bg-paper p-8">
        <Logo
          logoUrl={settings?.logoUrl}
          imageClassName="h-10 w-auto max-w-[180px] object-contain"
        />
        <p className="mt-1 font-mono text-xs uppercase tracking-wide text-graphite">
          Đăng nhập quản trị
        </p>

        {error && ERROR_MESSAGE[error] && (
          <p role="alert" className="mt-4 font-mono text-xs text-stamp">
            {ERROR_MESSAGE[error]}
          </p>
        )}

        <div className="mt-6">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
