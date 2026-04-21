interface Props extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

// NOTE: Previously used IntersectionObserver to defer rendering of panels
// past index 6. That observer was unreliable under CSS columns layout
// (reported 42 panels stuck on "loading..." on 2026-04-20), and since every
// data hook is called unconditionally at the top of App.tsx, the observer
// saved no network or CPU anyway. Now renders eagerly; each panel still
// manages its own loading state via StateChip / useLoadingTimeout.
export function LazyPanel({ children, className = '', ...rest }: Props) {
  return (
    <div className={className} {...rest}>
      {children}
    </div>
  );
}
