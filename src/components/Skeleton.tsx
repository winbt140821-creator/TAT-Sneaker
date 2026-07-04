export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-kraft-dark/60 ${className}`} />;
}
