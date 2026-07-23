import { type KeyboardEvent, type ReactNode, useRef } from "react";

export type TabItem = { id: string; label: string; content: ReactNode };

// Abas simples controladas pelo pai (estado fica na URL via searchParams no
// caller, nao aqui) — navegacao por teclado (setas esquerda/direita, Home/End)
// segue o padrao WAI-ARIA APG de "manual activation" tabs.
export function Tabs({ items, activeId, onChange, ariaLabel = "Seções" }: { items: TabItem[]; activeId: string; onChange: (id: string) => void; ariaLabel?: string }) {
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  function focusAndSelect(id: string) {
    onChange(id);
    tabRefs.current[id]?.focus();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      focusAndSelect(items[(index + 1) % items.length].id);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      focusAndSelect(items[(index - 1 + items.length) % items.length].id);
    } else if (event.key === "Home") {
      event.preventDefault();
      focusAndSelect(items[0].id);
    } else if (event.key === "End") {
      event.preventDefault();
      focusAndSelect(items[items.length - 1].id);
    }
  }

  const activeItem = items.find((item) => item.id === activeId) ?? items[0];

  return (
    <div className="tabs">
      <div className="tabs-list" role="tablist" aria-label={ariaLabel}>
        {items.map((item, index) => (
          <button
            key={item.id}
            ref={(element) => { tabRefs.current[item.id] = element; }}
            role="tab"
            type="button"
            id={`tab-${item.id}`}
            aria-selected={item.id === activeItem.id}
            aria-controls={`tabpanel-${item.id}`}
            tabIndex={item.id === activeItem.id ? 0 : -1}
            className={item.id === activeItem.id ? "tab-trigger is-active" : "tab-trigger"}
            onClick={() => onChange(item.id)}
            onKeyDown={(event) => handleKeyDown(event, index)}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="tabs-panel" role="tabpanel" id={`tabpanel-${activeItem.id}`} aria-labelledby={`tab-${activeItem.id}`} tabIndex={0}>
        {activeItem.content}
      </div>
    </div>
  );
}
