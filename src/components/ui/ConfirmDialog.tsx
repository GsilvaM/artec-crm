import { useEffect, useRef } from "react";
import { useEscapeKey, useOverlayScrollLockAndFocusRestore } from "./useOverlayBehavior";

export function ConfirmDialog({ title, message, confirmLabel = "Confirmar", cancelLabel = "Cancelar", destructive, onConfirm, onCancel }: {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  useOverlayScrollLockAndFocusRestore(true);
  useEscapeKey(true, onCancel);

  useEffect(() => {
    confirmButtonRef.current?.focus();
  }, []);

  return (
    <div className="confirm-dialog-backdrop" role="presentation" onClick={onCancel}>
      <div
        className="confirm-dialog panel"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        onClick={(event) => event.stopPropagation()}
      >
        <h3 id="confirm-dialog-title">{title}</h3>
        <p>{message}</p>
        <div className="form-actions">
          <button
            ref={confirmButtonRef}
            className={`button ${destructive ? "destructive" : "primary"}`}
            type="button"
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
          <button className="button secondary" type="button" onClick={onCancel}>
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
