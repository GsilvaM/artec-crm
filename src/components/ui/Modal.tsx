import { type ReactNode, useEffect, useId, useRef } from "react";
import { X } from "lucide-react";
import { useEscapeKey, useOverlayScrollLockAndFocusRestore } from "./useOverlayBehavior";

type ModalProps = {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  role?: "dialog" | "alertdialog";
  children: ReactNode;
  footer?: ReactNode;
  initialFocusRef?: React.RefObject<HTMLElement | null>;
  onClose: () => void;
};

export function Modal({ title, subtitle, icon, role = "dialog", children, footer, initialFocusRef, onClose }: ModalProps) {
  const titleId = useId();
  const fallbackCloseRef = useRef<HTMLButtonElement>(null);

  useOverlayScrollLockAndFocusRestore(true);
  useEscapeKey(true, onClose);

  useEffect(() => {
    const focusTarget = initialFocusRef?.current ?? fallbackCloseRef.current;
    focusTarget?.focus();
  }, [initialFocusRef]);

  return (
    <div className="modal-backdrop confirm-dialog-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="modal-shell confirm-dialog"
        role={role}
        aria-modal="true"
        aria-labelledby={titleId}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="modal-header">
          {icon ? <span className="modal-icon" aria-hidden="true">{icon}</span> : null}
          <div>
            <h3 id={titleId}>{title}</h3>
            {subtitle ? <p>{subtitle}</p> : null}
          </div>
          <button ref={fallbackCloseRef} className="modal-close" type="button" aria-label="Fechar" onClick={onClose}>
            <X size={18} aria-hidden="true" />
          </button>
        </header>
        <div className="modal-body">{children}</div>
        {footer ? <footer className="modal-footer">{footer}</footer> : null}
      </section>
    </div>
  );
}
