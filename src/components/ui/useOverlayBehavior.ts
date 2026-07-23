import { useEffect } from "react";

// Comportamento comum a todo overlay modal do produto (ConfirmDialog, PromptDialog,
// ActionOperationForm, Drawer, drawer mobile da Sidebar): trava o scroll do body
// enquanto aberto e devolve o foco a quem abriu o overlay ao desmontar — achado real
// de auditoria (nenhum overlay travava o scroll, e so 1 de 7 devolvia o foco).
export function useOverlayScrollLockAndFocusRestore(active: boolean) {
  useEffect(() => {
    if (!active) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus();
    };
  }, [active]);
}

export function useEscapeKey(active: boolean, onEscape: () => void) {
  useEffect(() => {
    if (!active) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onEscape();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [active, onEscape]);
}
