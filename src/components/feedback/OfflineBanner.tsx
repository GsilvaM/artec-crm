import { WifiOff } from "lucide-react";
import { useOnlineStatus } from "../../hooks/useOnlineStatus";

export function OfflineBanner() {
  const isOnline = useOnlineStatus();
  if (isOnline) return null;

  return (
    <div className="offline-banner" role="status">
      <WifiOff aria-hidden="true" size={16} />
      Sem conexao. Consultas mostram o ultimo dado carregado; acoes como aprovar, perder ou concluir follow-up podem falhar ate a conexao voltar.
    </div>
  );
}
