import { type FormEvent, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { EmptyState } from "../../components/ui/EmptyState";
import { LoadingPanels } from "../../components/ui/Skeleton";
import { formatActivityType, formatDateTime } from "../../domain/format";
import {
  archiveCustomer,
  createActivity,
  createNextAction,
  loadCustomer,
  loadCustomerActivities,
  loadNextActions,
  loadOpportunitiesByCustomer,
  type Activity,
  type Customer,
  type NextAction,
  type Opportunity,
} from "../../domain/crm";

const SUPPORT_ACTIVITY_TYPES: Activity["type"][] = ["warranty", "support", "after_sales"];

export function ClientePage({ currentUserId }: { currentUserId: string }) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [nextActions, setNextActions] = useState<NextAction[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activityForm, setActivityForm] = useState<{ type: Activity["type"]; description: string }>({ type: "warranty", description: "" });
  const [actionForm, setActionForm] = useState({ title: "", dueAt: "" });

  async function refresh() {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const [customerRecord, opportunityList, actionList, activityList] = await Promise.all([
        loadCustomer(id),
        loadOpportunitiesByCustomer(id),
        loadNextActions({ customerId: id, status: "pending" }),
        loadCustomerActivities(id),
      ]);
      setCustomer(customerRecord);
      setOpportunities(opportunityList);
      setNextActions(actionList);
      setActivities(activityList);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nao foi possivel carregar o cliente.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (isLoading || !customer) {
    return <LoadingPanels />;
  }

  async function handleArchive() {
    if (!window.confirm(`Arquivar ${customer!.nome}? O historico sera preservado.`)) return;
    await archiveCustomer(customer!.id);
    navigate("/clientes");
  }

  async function handleRegisterActivity(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activityForm.description.trim()) return;
    setError(null);
    try {
      await createActivity({ customerId: customer!.id, opportunityId: null, type: activityForm.type, description: activityForm.description.trim() });
      setActivityForm({ ...activityForm, description: "" });
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nao foi possivel registrar a atividade.");
    }
  }

  async function handleCreateAction(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!actionForm.title.trim() || !actionForm.dueAt) return;
    setError(null);
    try {
      await createNextAction({ customerId: customer!.id, responsibleUserId: currentUserId, category: "support", title: actionForm.title.trim(), dueAt: actionForm.dueAt });
      setActionForm({ title: "", dueAt: "" });
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nao foi possivel criar a proxima acao.");
    }
  }

  const supportActivities = activities.filter((activity) => SUPPORT_ACTIVITY_TYPES.includes(activity.type));
  const commercialActivities = activities.filter((activity) => !SUPPORT_ACTIVITY_TYPES.includes(activity.type));

  return (
    <>
      <section className="page-heading">
        <div>
          <p className="eyebrow"><Link to="/clientes">Clientes</Link> / {customer.nome}</p>
          <h1>{customer.nome}</h1>
        </div>
        <button className="button ghost" type="button" onClick={() => void handleArchive()}>Arquivar</button>
      </section>

      {error ? <div className="alert danger-alert" role="alert">{error}</div> : null}

      {customer.duplicatePhoneCustomerIds.length ? (
        <div className="alert" role="status">Este telefone tambem aparece em {customer.duplicatePhoneCustomerIds.length} outro(s) cadastro(s) — verifique possivel duplicidade.</div>
      ) : null}

      <section className="panel" aria-label="Identificacao">
        <dl className="detail-list">
          <div><dt>Tipo</dt><dd>{customer.tipoPessoa === "fisica" ? "Pessoa fisica" : "Pessoa juridica"}</dd></div>
          <div><dt>Telefone</dt><dd>{customer.telefone ?? "-"}</dd></div>
          <div><dt>E-mail</dt><dd>{customer.email ?? "-"}</dd></div>
          <div><dt>Empresa</dt><dd>{customer.empresa ?? "-"}</dd></div>
          <div><dt>Cidade</dt><dd>{customer.cidade ?? "-"}</dd></div>
          <div><dt>Bairro</dt><dd>{customer.bairro ?? "-"}</dd></div>
        </dl>
      </section>

      <section className="data-section" aria-label="Oportunidades relacionadas">
        <h2>Oportunidades ({opportunities.length})</h2>
        {opportunities.length ? (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Titulo</th><th>Etapa</th><th>Situacao</th><th>Status</th><th>Acoes</th></tr></thead>
              <tbody>
                {opportunities.map((opportunity) => (
                  <tr key={opportunity.id}>
                    <td>{opportunity.titulo}</td>
                    <td>{opportunity.etapaNome}</td>
                    <td>{opportunity.situacao}</td>
                    <td><span className="badge">{opportunity.status}</span></td>
                    <td className="actions-cell"><Link className="button secondary" to={`/oportunidades/${opportunity.id}`}>Abrir</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title="Nenhuma oportunidade" text="Este cliente ainda nao tem oportunidades comerciais registradas." />
        )}
      </section>

      <section className="data-section" aria-label="Proximas acoes">
        <h2>Proximas acoes pendentes ({nextActions.length})</h2>
        <form className="admin-inline-form" onSubmit={handleCreateAction}>
          <label>Nova acao de atendimento<input value={actionForm.title} onChange={(event) => setActionForm({ ...actionForm, title: event.target.value })} placeholder="ex: retornar sobre garantia" /></label>
          <label>Data<input type="datetime-local" value={actionForm.dueAt} onChange={(event) => setActionForm({ ...actionForm, dueAt: event.target.value })} /></label>
          <button className="button secondary" type="submit">Criar</button>
        </form>
        {nextActions.length ? (
          <ul className="work-list">
            {nextActions.map((action) => (
              <li key={action.id}>
                <div>
                  <strong>{action.title}</strong>
                  <span>{action.opportunityTitle ?? "Atendimento"}</span>
                  <small>{formatDateTime(action.dueAt)}</small>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title="Nenhuma acao pendente" text="Crie uma acao para acompanhar este cliente." />
        )}
      </section>

      <section className="data-section" aria-label="Garantia, suporte e pos-venda">
        <h2>Garantia, suporte e pos-venda</h2>
        <form className="admin-inline-form" onSubmit={handleRegisterActivity}>
          <label>Tipo
            <select value={activityForm.type} onChange={(event) => setActivityForm({ ...activityForm, type: event.target.value as Activity["type"] })}>
              <option value="warranty">Garantia</option>
              <option value="support">Suporte</option>
              <option value="after_sales">Pos-venda</option>
            </select>
          </label>
          <label>Descricao<input value={activityForm.description} onChange={(event) => setActivityForm({ ...activityForm, description: event.target.value })} placeholder="Descreva o atendimento" /></label>
          <button className="button secondary" type="submit">Registrar</button>
        </form>
        {supportActivities.length ? (
          <ol className="timeline-list">
            {supportActivities.map((activity) => (
              <li key={activity.id}>
                <strong>{formatActivityType(activity.type)}</strong>
                <span>{formatDateTime(activity.occurredAt)}</span>
                <p>{activity.description}</p>
              </li>
            ))}
          </ol>
        ) : (
          <EmptyState title="Nenhum registro de garantia, suporte ou pos-venda" text="Registre um atendimento tecnico quando ocorrer." />
        )}
      </section>

      <section className="data-section timeline-section" aria-label="Linha do tempo comercial">
        <h2>Linha do tempo comercial</h2>
        {commercialActivities.length ? (
          <ol className="timeline-list">
            {commercialActivities.map((activity) => (
              <li key={activity.id}>
                <strong>{formatActivityType(activity.type)}</strong>
                <span>{formatDateTime(activity.occurredAt)}</span>
                <p>{activity.description}</p>
              </li>
            ))}
          </ol>
        ) : (
          <EmptyState title="Nenhuma atividade comercial" text="O historico comercial aparece aqui conforme as oportunidades avancam." />
        )}
      </section>
    </>
  );
}
