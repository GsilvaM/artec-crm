import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { App } from "./App";
import { ErrorBoundary } from "./components/ui/ErrorBoundary";
import { ToastProvider } from "./components/ui/Toast";
// Inter self-hospedada (sem chamada externa a Google Fonts) — pesos usados
// pela escala de --weight-* em src/styles.css. Sem isso, --font-sans caia
// no fallback do SO (Segoe UI/San Francisco), nunca a Inter que o design
// system (Venture) especifica. Apenas os subconjuntos latin/latin-ext (cobrem
// acentuacao pt-BR: ç ã õ á é í ó ú) — os imports "sem sufixo" do fontsource
// incluem tambem cyrillic/greek/vietnamese, que o service worker do PWA
// pre-cacheava sem necessidade (produto e 100% pt-BR).
import "@fontsource/inter/latin-400.css";
import "@fontsource/inter/latin-600.css";
import "@fontsource/inter/latin-700.css";
import "@fontsource/inter/latin-800.css";
import "@fontsource/inter/latin-ext-400.css";
import "@fontsource/inter/latin-ext-600.css";
import "@fontsource/inter/latin-ext-700.css";
import "@fontsource/inter/latin-ext-800.css";
import "./styles.css";

const root = document.getElementById("root");

if (!root) {
  throw new Error("Elemento root não encontrado.");
}

createRoot(root).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <ToastProvider>
          <App />
        </ToastProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
);
