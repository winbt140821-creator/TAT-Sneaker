"use client";

import { useActionState } from "react";
import { signIn } from "next-auth/react";
import { GoogleIcon } from "@/components/icons";
import { loginAction, type LoginState } from "./actions";

const initialState: LoginState = {};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <div className="flex flex-col gap-5">
      <button
        type="button"
        onClick={() => signIn("google", { callbackUrl: "/admin/google-callback" })}
        className="die-cut-flat flex w-full cursor-pointer items-center justify-center gap-2 border border-graphite bg-paper px-4 py-2.5 font-mono text-xs font-semibold uppercase tracking-wide text-ink transition-colors hover:border-ink"
      >
        <GoogleIcon className="h-4 w-4" />
        Đăng nhập bằng Google
      </button>

      <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-wide text-graphite">
        <span className="h-px flex-1 bg-kraft-dark" />
        Hoặc dùng mật khẩu
        <span className="h-px flex-1 bg-kraft-dark" />
      </div>

      <form action={formAction} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="font-mono text-xs uppercase tracking-wide text-graphite">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="username"
            required
            className="border border-graphite bg-paper px-3 py-2 text-sm text-ink focus:border-forest"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="password" className="font-mono text-xs uppercase tracking-wide text-graphite">
            Mật khẩu
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="border border-graphite bg-paper px-3 py-2 text-sm text-ink focus:border-forest"
          />
        </div>

        {state.error && (
          <p role="alert" className="font-mono text-xs text-stamp">
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="mt-2 flex cursor-pointer items-center justify-center bg-ink px-4 py-2.5 font-mono text-xs font-semibold uppercase tracking-wider text-paper transition-colors hover:bg-ink-soft disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Đang đăng nhập..." : "Đăng nhập"}
        </button>
      </form>
    </div>
  );
}
