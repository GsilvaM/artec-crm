export function LoadingPanels() {
  return (
    <section className="split-layout" aria-busy="true">
      <div className="panel">
        <div className="skeleton skeleton-title" />
        <div className="skeleton skeleton-line" />
      </div>
      <div className="panel">
        <div className="skeleton skeleton-title" />
        <div className="skeleton skeleton-line" />
      </div>
    </section>
  );
}

export function Skeleton({ className = "", ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={["skeleton", className].filter(Boolean).join(" ")} {...props} />;
}
