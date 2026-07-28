import type { ReactNode } from "react";
import { Inbox } from "lucide-react";

export function EmptyState({ title, text, icon, children }: { title: string; text: string; icon?: ReactNode; children?: ReactNode }) {
  return (
    <div className="empty-state">
      <span className="empty-state-icon" aria-hidden="true">{icon ?? <Inbox size={20} />}</span>
      <h3>{title}</h3>
      <p>{text}</p>
      {children ? <div className="empty-state-actions">{children}</div> : null}
    </div>
  );
}
