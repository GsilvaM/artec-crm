import type { ReactNode } from "react";

export function EmptyState({ title, text, children }: { title: string; text: string; children?: ReactNode }) {
  return (
    <div className="empty-state">
      <h3>{title}</h3>
      <p>{text}</p>
      {children ? <div className="empty-state-actions">{children}</div> : null}
    </div>
  );
}
