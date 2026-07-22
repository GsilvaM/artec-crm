import { type FormEvent, useEffect, useRef, useState } from "react";

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
    inputRef.current?.focus();
    inputRef.current?.select();
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onCancel();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onCancel]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!value.trim()) return;
    onConfirm(value.trim());
  }

  return (
    <div className="confirm-dialog-backdrop" role="presentation" onClick={onCancel}>
      <form
        className="confirm-dialog panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="prompt-dialog-title"
        onClick={(event) => event.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <h3 id="prompt-dialog-title">{title}</h3>
        <label>
          {label}
          <input ref={inputRef} value={value} onChange={(event) => setValue(event.target.value)} />
        </label>
        <div className="form-actions">
          <button className="button primary" type="submit">{confirmLabel}</button>
          <button className="button secondary" type="button" onClick={onCancel}>{cancelLabel}</button>
        </div>
      </form>
    </div>
  );
}
