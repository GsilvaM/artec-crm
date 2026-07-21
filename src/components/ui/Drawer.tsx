import { X } from "lucide-react";
import { type ReactNode, useEffect } from "react";

export function Drawer({ title, subtitle, onClose, children }: { title: string; subtitle?: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div className="drawer-overlay" role="presentation" onClick={onClose}>
      <div className="drawer" role="dialog" aria-modal="true" aria-label={title} onClick={(event) => event.stopPropagation()}>
        <header className="drawer-header">
          <div>
            {subtitle ? <p className="eyebrow">{subtitle}</p> : null}
            <h2>{title}</h2>
          </div>
          <button className="icon-button" type="button" aria-label="Fechar" onClick={onClose}>
            <X aria-hidden="true" />
          </button>
        </header>
        <div className="drawer-body">{children}</div>
      </div>
    </div>
  );
}
