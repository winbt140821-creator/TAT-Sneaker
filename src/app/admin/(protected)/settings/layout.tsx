import type { ReactNode } from "react";
import { SettingsTabs } from "./SettingsTabs";

export default function SettingsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-2xl text-ink">Cài đặt</h1>
      <SettingsTabs />
      <div className="mt-8">{children}</div>
    </div>
  );
}
