import { useEffect, useState } from "react";
import { LoadingPanels } from "../../components/ui/Skeleton";
import { AuvoInboxPanel } from "../../components/AuvoInboxPanel";
import { loadCrmSnapshot, type Customer } from "../../domain/crm";

export function CaixaAuvoPage({ currentUserId }: { currentUserId: string }) {
  const [customers, setCustomers] = useState<Customer[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const snapshot = await loadCrmSnapshot();
        setCustomers(snapshot.customers.filter((customer) => !customer.archivedAt));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Nao foi possivel carregar os clientes para triagem.");
      }
    })();
  }, []);

  return (
    <>
      <section className="page-heading">
        <div>
          <p className="eyebrow">Integracao Auvo</p>
          <h1>Caixa de Entrada</h1>
        </div>
      </section>

      {error ? <div className="alert danger-alert" role="alert">{error}</div> : null}

      {customers === null ? <LoadingPanels /> : <AuvoInboxPanel customers={customers} currentUserId={currentUserId} />}
    </>
  );
}
