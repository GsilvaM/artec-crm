import { Component, type ErrorInfo, type ReactNode } from "react";
import { EmptyState } from "./EmptyState";

export class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Erro nao tratado na interface:", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="auth-screen">
          <EmptyState title="Algo deu errado" text="Ocorreu um erro inesperado nesta tela. Recarregue a página para continuar.">
            <button className="button primary" type="button" onClick={() => window.location.reload()}>
              Recarregar página
            </button>
          </EmptyState>
        </main>
      );
    }
    return this.props.children;
  }
}
