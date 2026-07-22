import { Download, Share, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { useInstallPrompt } from "../../hooks/useInstallPrompt";

// So aparece depois que o usuario navegou pelo menos uma vez (ja concluiu
// algo util), nunca no primeiro carregamento da tela — secao 25.3.
export function InstallPrompt() {
  const { showAndroidPrompt, showIosInstructions, promptInstall, dismiss } = useInstallPrompt();
  const location = useLocation();
  const visitedRoutes = useRef(new Set<string>());
  const [hasNavigatedOnce, setHasNavigatedOnce] = useState(false);

  useEffect(() => {
    visitedRoutes.current.add(location.pathname);
    if (visitedRoutes.current.size > 1) setHasNavigatedOnce(true);
  }, [location.pathname]);

  if (!hasNavigatedOnce || (!showAndroidPrompt && !showIosInstructions)) return null;

  return (
    <div className="install-prompt" role="status">
      {showAndroidPrompt ? (
        <>
          <Download aria-hidden="true" size={18} />
          <span>Instale o Artec CRM no seu aparelho para abrir mais rapido, mesmo em campo.</span>
          <button className="button primary" type="button" onClick={() => void promptInstall()}>Instalar</button>
        </>
      ) : (
        <>
          <Share aria-hidden="true" size={18} />
          <span>Para instalar: toque em Compartilhar no Safari e escolha "Adicionar a Tela de Inicio".</span>
        </>
      )}
      <button className="icon-button" type="button" aria-label="Dispensar convite de instalacao" onClick={dismiss}>
        <X aria-hidden="true" />
      </button>
    </div>
  );
}
