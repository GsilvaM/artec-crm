import { useEffect, useState } from "react";
import { PlugZap } from "lucide-react";
import { AuvoInboxPanel } from "../../components/AuvoInboxPanel";
import { LoadingPanels } from "../../components/ui/Skeleton";
import { formatDateTime } from "../../domain/format";
import { loadAuvoIntegrationStatus, loadCrmSnapshot, type AuvoIntegrationStatus, type Customer } from "../../domain/crm";

export function CaixaAuvoPage({ currentUserId }: { currentUserId: string }) {
  const [customers, setCustomers] = useState<Customer[] | null>(null);
  const [integrationStatus, setIntegrationStatus] = useState<AuvoIntegrationStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const [snapshot, status] = await Promise.all([loadCrmSnapshot(), loadAuvoIntegrationStatus()]);
        setCustomers(snapshot.customers.filter((customer) => !customer.archivedAt));
        setIntegrationStatus(status);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Não foi possível carregar os clientes para triagem.");
      }
    })();
  }, []);

  return (
    <>
      <section className="page-heading auvo-page-heading">
        <div>
          <h1>Caixa Auvo</h1>
          <p>Eventos recebidos aguardando triagem humana. Nada é criado automaticamente.</p>
        </div>
        <span className="auvo-webhook-status">
          <PlugZap size={16} aria-hidden="true" />
          Webhook {integrationStatus?.configured ? "saudável" : "pendente"} · {integrationStatus?.lastReceivedAt ? `último ${formatDateTime(integrationStatus.lastReceivedAt)}` : "sem eventos recentes"}
        </span>
      </section>

      {error ? <div className="alert danger-alert" role="alert">{error}</div> : null}

      {customers === null ? <LoadingPanels /> : <AuvoInboxPanel customers={customers} currentUserId={currentUserId} />}
    </>
  );
}
