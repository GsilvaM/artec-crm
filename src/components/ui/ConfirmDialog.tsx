import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { useRef } from "react";
import { Modal } from "./Modal";

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

  return (
    <Modal
      title={title}
      role="alertdialog"
      icon={destructive ? <AlertTriangle size={20} /> : <CheckCircle2 size={20} />}
      initialFocusRef={confirmButtonRef}
      onClose={onCancel}
      footer={(
        <>
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
        </>
      )}
    >
      <p>{message}</p>
    </Modal>
  );
}
