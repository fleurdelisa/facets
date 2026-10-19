export function Spoiler({ children, spoiler }: { children: React.ReactNode; spoiler: boolean }) {
  if (!spoiler) return <>{children}</>;
  return (
    <details className="group">
      <summary className="cursor-pointer list-none text-sm text-faint select-none group-open:hidden">Spoiler — tap to reveal</summary>
      {children}
    </details>
  );
}
