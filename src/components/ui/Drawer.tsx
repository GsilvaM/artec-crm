import { X } from "lucide-react";
import { type ReactNode } from "react";
import { IconButton } from "./IconButton";
import { useEscapeKey, useOverlayScrollLockAndFocusRestore } from "./useOverlayBehavior";

export function Drawer({ title, subtitle, onClose, children }: { title: string; subtitle?: string; onClose: () => void; children: ReactNode }) {
  useOverlayScrollLockAndFocusRestore(true);
  useEscapeKey(true, onClose);

  return (
    <div className="drawer-overlay" role="presentation" onClick={onClose}>
      <div className="drawer" role="dialog" aria-modal="true" aria-label={title} onClick={(event) => event.stopPropagation()}>
        <header className="drawer-header">
          <div>
            {subtitle ? <p className="eyebrow">{subtitle}</p> : null}
            <h2>{title}</h2>
          </div>
          <IconButton label="Fechar" onClick={onClose}>
            <X aria-hidden="true" />
          </IconButton>
        </header>
        <div className="drawer-body">{children}</div>
      </div>
    </div>
  );
}
