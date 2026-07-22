import { WifiOff } from "lucide-react";
import { useOnlineStatus } from "../../hooks/useOnlineStatus";

export function OfflineBanner() {
  const isOnline = useOnlineStatus();
  if (isOnline) return null;

  return (
    <div className="offline-banner" role="status">
      <WifiOff aria-hidden="true" size={16} />
      Sem conexão. Consultas mostram o último dado carregado; ações como aprovar, perder ou concluir follow-up podem falhar até a conexão voltar.
    </div>
  );
}
