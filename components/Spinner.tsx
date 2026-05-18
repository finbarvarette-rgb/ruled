export function Spinner({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <span
      className={`inline-block rounded-full border-2 border-current border-t-transparent animate-spin ${className}`}
      aria-hidden
    />
  );
}
