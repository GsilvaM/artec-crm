import { type FormEvent, useEffect, useRef, useState } from "react";
import { PencilLine } from "lucide-react";
import { Modal } from "./Modal";

export function PromptDialog({ title, label, defaultValue = "", confirmLabel = "Salvar", cancelLabel = "Cancelar", onConfirm, onCancel }: {
  title: string;
  label: string;
  defaultValue?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: (value: string) => void;
  onCancel: () => void;
}) {
  const [value, setValue] = useState(defaultValue);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.select();
  }, []);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!value.trim()) return;
    onConfirm(value.trim());
  }

  return (
    <Modal
      title={title}
      icon={<PencilLine size={20} />}
      initialFocusRef={inputRef}
      onClose={onCancel}
      footer={(
        <>
          <button className="button primary" type="submit" form="prompt-dialog-form" disabled={!value.trim()}>{confirmLabel}</button>
          <button className="button secondary" type="button" onClick={onCancel}>{cancelLabel}</button>
        </>
      )}
    >
      <form id="prompt-dialog-form" className="modal-form" onSubmit={handleSubmit}>
        <label>
          {label}
          <input ref={inputRef} value={value} onChange={(event) => setValue(event.target.value)} />
        </label>
      </form>
    </Modal>
  );
}
