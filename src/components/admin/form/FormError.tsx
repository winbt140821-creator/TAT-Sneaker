export function FormError({ message }: { message?: string }) {
  if (!message) return null;

  return (
    <p role="alert" className="font-mono text-xs text-stamp">
      {message}
    </p>
  );
}
