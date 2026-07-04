import type { OrderStatus } from "@/generated/prisma/client";

const STEPS: OrderStatus[] = ["PENDING", "CONFIRMED", "SHIPPED", "DONE"];

export function OrderStatusStepper({
  status,
  labels,
}: {
  status: OrderStatus;
  labels: Record<OrderStatus, string>;
}) {
  if (status === "CANCELLED") {
    return (
      <div className="die-cut-flat mt-4 border border-stamp bg-stamp/10 p-3">
        <p className="font-mono text-xs font-semibold uppercase tracking-wide text-stamp">
          {labels.CANCELLED}
        </p>
      </div>
    );
  }

  const currentIndex = STEPS.indexOf(status);

  return (
    <div className="mt-4 flex items-start">
      {STEPS.map((step, i) => (
        <div key={step} className="flex flex-1 items-start last:flex-none">
          <div className="flex w-14 flex-col items-center gap-1.5 sm:w-20">
            <div
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-mono text-[10px] font-bold ${
                i <= currentIndex ? "bg-forest text-paper" : "bg-kraft-dark/40 text-graphite"
              }`}
            >
              {i + 1}
            </div>
            <span
              className={`text-center font-mono text-[9px] leading-tight uppercase tracking-wide sm:text-[10px] ${
                i <= currentIndex ? "text-ink" : "text-graphite"
              }`}
            >
              {labels[step]}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div
              className={`mt-3 h-0.5 flex-1 ${i < currentIndex ? "bg-forest" : "bg-kraft-dark/40"}`}
            />
          )}
        </div>
      ))}
    </div>
  );
}
