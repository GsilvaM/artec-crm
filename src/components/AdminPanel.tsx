import { type FormEvent, useEffect, useMemo, useState } from "react";
import { Edit3, GripVertical, Link2, Plus, ShieldCheck, SlidersHorizontal, UserRoundCog, XCircle, Zap } from "lucide-react";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";
import { PromptDialog } from "./ui/PromptDialog";
import { useToast } from "./ui/Toast";
import {
  createLossReason,
  createPipelineStage,
  loadAdminLossReasons,
  loadAdminUsers,
  setLossReasonActive,
  updatePipelineStage,
  upsertMembership,
  type CrmRole,
  type LossReasonAdmin,
  type MembershipCandidate,
  type PipelineStage,
} from "../domain/crm";

type AdminTab = "etapas" | "motivos" | "usuarios" | "integracoes";

const ADMIN_TABS: Array<{ id: AdminTab; label: string; icon: typeof SlidersHorizontal }> = [
  { id: "etapas", label: "Etapas do funil", icon: SlidersHorizontal },
  { id: "motivos", label: "Motivos de perda", icon: XCircle },
  { id: "usuarios", label: "Usuários e permissões", icon: UserRoundCog },
  { id: "integracoes", label: "Integrações", icon: Zap },
];

export function AdminPanel({ stages, onStagesChanged, currentUserId }: {
  stages: PipelineStage[];
  onStagesChanged: () => void | Promise<void>;
  currentUserId: string;
}) {
  const { showToast } = useToast();
  const [error, setError] = useState<string | null>(null);
  const [lossReasons, setLossReasons] = useState<LossReasonAdmin[]>([]);
  const [users, setUsers] = useState<MembershipCandidate[]>([]);
  const [newStage, setNewStage] = useState({ nome: "", ordem: "" });
  const [newLossReason, setNewLossReason] = useState("");
  const [stageToRename, setStageToRename] = useState<PipelineStage | null>(null);
  const [stageToReorder, setStageToReorder] = useState<PipelineStage | null>(null);
  const [activeTab, setActiveTab] = useState<AdminTab>("etapas");
  const [showCreateStage, setShowCreateStage] = useState(false);

  useEffect(() => {
    void refreshAdminData();
  }, []);

  async function refreshAdminData() {
    setError(null);
    try {
      const [reasons, memberList] = await Promise.all([loadAdminLossReasons(), loadAdminUsers()]);
      setLossReasons(reasons);
      setUsers(memberList);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível carregar dados de administração.");
    }
  }

  async function handleCreateStage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    try {
      await createPipelineStage({ nome: newStage.nome, ordem: Number(newStage.ordem) });
      setNewStage({ nome: "", ordem: "" });
      setShowCreateStage(false);
      await onStagesChanged();
      showToast("Etapa criada.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível criar a etapa.");
    }
  }

  async function handleConfirmRenameStage(nome: string) {
    if (!stageToRename || nome === stageToRename.nome) {
      setStageToRename(null);
      return;
    }
    setError(null);
    try {
      await updatePipelineStage(stageToRename.id, { nome });
      setStageToRename(null);
      await onStagesChanged();
      showToast("Etapa renomeada.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível renomear a etapa.");
      setStageToRename(null);
    }
  }

  async function handleConfirmReorderStage(ordem: string) {
    if (!stageToReorder || !Number.isFinite(Number(ordem)) || Number(ordem) === stageToReorder.ordem) {
      setStageToReorder(null);
      return;
    }
    setError(null);
    try {
      await updatePipelineStage(stageToReorder.id, { ordem: Number(ordem) });
      setStageToReorder(null);
      await onStagesChanged();
      showToast("Ordem da etapa atualizada.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível reordenar a etapa.");
      setStageToReorder(null);
    }
  }

  async function handleCreateLossReason(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    try {
      await createLossReason({ nome: newLossReason });
      setNewLossReason("");
      await refreshAdminData();
      showToast("Motivo de perda criado.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível criar o motivo de perda.");
    }
  }

  async function handleToggleLossReason(reason: LossReasonAdmin) {
    setError(null);
    try {
      await setLossReasonActive(reason.id, !reason.isActive);
      await refreshAdminData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível atualizar o motivo de perda.");
    }
  }

  async function handleUpdateMembership(user: MembershipCandidate, role: CrmRole, isActive: boolean) {
    setError(null);
    try {
      await upsertMembership(user.userId, { role, isActive });
      await refreshAdminData();
      showToast("Acesso atualizado.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível atualizar o acesso do usuário.");
    }
  }

  const orderedStages = useMemo(() => [...stages].sort((a, b) => a.ordem - b.ordem), [stages]);

  return (
    <section className="admin-design-panel admin-panel" aria-label="Administração">
      {error ? <div className="alert danger-alert" role="alert">{error}</div> : null}

      <div className="design-tabs admin-design-tabs" role="tablist" aria-label="Seções da Administração">
        {ADMIN_TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              className={activeTab === tab.id ? "active" : ""}
              onClick={() => setActiveTab(tab.id)}
            >
              <Icon size={15} aria-hidden="true" /> {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === "etapas" ? (
        <section className="admin-design-card" role="tabpanel" aria-label="Etapas do funil">
          <header>
            <div>
              <h2>Etapas do funil comercial</h2>
              <p>Arraste para reordenar. Alterações impactam relatórios.</p>
            </div>
            <Button variant="primary" type="button" onClick={() => setShowCreateStage((open) => !open)}>
              <Plus size={16} aria-hidden="true" /> Nova etapa
            </Button>
          </header>

          {showCreateStage ? (
            <form className="admin-design-form" onSubmit={handleCreateStage}>
              <label>Nova etapa<input required value={newStage.nome} onChange={(event) => setNewStage({ ...newStage, nome: event.target.value })} /></label>
              <label>Ordem<input required type="number" min={1} value={newStage.ordem} onChange={(event) => setNewStage({ ...newStage, ordem: event.target.value })} /></label>
              <Button variant="secondary" type="submit"><Plus size={16} aria-hidden="true" /> Adicionar</Button>
            </form>
          ) : null}

          <ol className="admin-stage-list">
            {orderedStages.map((stage, index) => (
              <li key={stage.id}>
                <GripVertical size={16} aria-hidden="true" />
                <span>{index + 1}.</span>
                <div>
                  <strong>{stage.nome}</strong>
                  <small>{stageHint(stage, index)}</small>
                </div>
                <Badge tone={stageTone(stage)}>{stageStatus(stage)}</Badge>
                <button className="icon-button" type="button" aria-label={`Reordenar ${stage.nome}`} onClick={() => setStageToReorder(stage)}>
                  <Edit3 size={16} aria-hidden="true" />
                </button>
                <button className="icon-button" type="button" aria-label={`Renomear ${stage.nome}`} disabled={stage.isTerminal} onClick={() => setStageToRename(stage)}>
                  <Edit3 size={16} aria-hidden="true" />
                </button>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {activeTab === "motivos" ? (
        <section className="admin-design-card" role="tabpanel" aria-label="Motivos de perda">
          <header>
            <div>
              <h2>Motivos de perda</h2>
              <p>Padronize encerramentos para melhorar leitura dos relatórios.</p>
            </div>
          </header>
          <form className="admin-design-form" onSubmit={handleCreateLossReason}>
            <label>Novo motivo<input required value={newLossReason} onChange={(event) => setNewLossReason(event.target.value)} /></label>
            <Button variant="secondary" type="submit"><Plus size={16} aria-hidden="true" /> Adicionar</Button>
          </form>
          <div className="table-wrap mobile-cards admin-design-table">
            <table>
              <thead><tr><th>Nome</th><th>Status</th><th>Ações</th></tr></thead>
              <tbody>
                {lossReasons.map((reason) => (
                  <tr key={reason.id}>
                    <td data-label="Nome">{reason.nome}</td>
                    <td data-label="Status"><Badge tone={reason.isActive ? "positive" : "warning"}>{reason.isActive ? "Ativo" : "Inativo"}</Badge></td>
                    <td data-label="Ações"><Button variant="secondary" type="button" onClick={() => void handleToggleLossReason(reason)}>{reason.isActive ? "Desativar" : "Ativar"}</Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {activeTab === "usuarios" ? (
        <section className="admin-design-card" role="tabpanel" aria-label="Usuários e permissões">
          <header>
            <div>
              <h2>Usuários e permissões</h2>
              <p>Controle quem acessa gestão, relatórios e integrações.</p>
            </div>
          </header>
          <div className="table-wrap mobile-cards admin-design-table">
            <table>
              <thead><tr><th>E-mail</th><th>Papel</th><th>Ativo</th><th>Ações</th></tr></thead>
              <tbody>
                {users.map((user) => <UserMembershipRow key={user.userId} user={user} isSelf={user.userId === currentUserId} onSave={handleUpdateMembership} />)}
                {!users.length ? <tr><td colSpan={4}>Nenhum usuário encontrado no Supabase Auth.</td></tr> : null}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {activeTab === "integracoes" ? (
        <section className="admin-design-card" role="tabpanel" aria-label="Integrações">
          <header>
            <div>
              <h2>Integrações</h2>
              <p>Configurações técnicas sensíveis ficam em painéis dedicados.</p>
            </div>
          </header>
          <div className="admin-integration-row">
            <Link2 size={18} aria-hidden="true" />
            <div>
              <strong>Integração Auvo</strong>
              <span>Webhook, eventos recentes e dead-letter.</span>
            </div>
            <Badge tone="informative">Separada</Badge>
          </div>
        </section>
      ) : null}

      {stageToRename ? (
        <PromptDialog title="Renomear etapa" label="Novo nome da etapa" defaultValue={stageToRename.nome} onConfirm={(value) => void handleConfirmRenameStage(value)} onCancel={() => setStageToRename(null)} />
      ) : null}

      {stageToReorder ? (
        <PromptDialog title="Reordenar etapa" label="Nova ordem da etapa" defaultValue={String(stageToReorder.ordem)} onConfirm={(value) => void handleConfirmReorderStage(value)} onCancel={() => setStageToReorder(null)} />
      ) : null}
    </section>
  );
}

function UserMembershipRow({ user, isSelf, onSave }: {
  user: MembershipCandidate;
  isSelf: boolean;
  onSave: (user: MembershipCandidate, role: CrmRole, isActive: boolean) => void | Promise<void>;
}) {
  const [role, setRole] = useState<CrmRole>(user.role ?? "vendedor");
  const [isActive, setIsActive] = useState(user.isActive ?? true);

  return (
    <tr>
      <td data-label="E-mail">{user.email ?? user.userId.slice(0, 8)} {isSelf ? <Badge tone="neutral">você</Badge> : null}</td>
      <td data-label="Papel">
        <select aria-label={`Papel de ${user.email ?? user.userId}`} value={role} onChange={(event) => setRole(event.target.value as CrmRole)}>
          <option value="gestor">Gestor</option>
          <option value="vendedor">Vendedor</option>
          <option value="atendimento">Atendimento</option>
        </select>
      </td>
      <td data-label="Ativo">
        <label className="sr-only" htmlFor={`active-${user.userId}`}>Usuário ativo no CRM</label>
        <input id={`active-${user.userId}`} type="checkbox" checked={isActive} disabled={isSelf} onChange={(event) => setIsActive(event.target.checked)} />
      </td>
      <td data-label="Ações">
        <Button variant="secondary" type="button" onClick={() => void onSave(user, role, isActive)}>
          {user.hasMembership ? "Salvar" : "Conceder acesso"}
        </Button>
      </td>
    </tr>
  );
}

function stageHint(stage: PipelineStage, index: number): string {
  if (isWonStage(stage)) return "Ganho";
  if (isLostStage(stage)) return "Encerrada";
  if (index === 0) return "Aguardando triagem";
  if (stage.nome.toLowerCase().includes("atendimento")) return "Contato ativo";
  if (stage.nome.toLowerCase().includes("visita")) return "Visita agendada";
  if (stage.nome.toLowerCase().includes("orçamento") || stage.nome.toLowerCase().includes("orcamento")) return "Aguardando retorno";
  return "Ajustes finais";
}

function stageTone(stage: PipelineStage): "positive" | "informative" | "neutral" {
  if (isWonStage(stage)) return "positive";
  if (isLostStage(stage)) return "neutral";
  return "informative";
}

function stageStatus(stage: PipelineStage): string {
  if (isWonStage(stage)) return "Ganho";
  if (isLostStage(stage)) return "Perda";
  return "Ativo";
}

function isWonStage(stage: PipelineStage): boolean {
  return stage.nome.toLowerCase().includes("aprov") || stage.nome.toLowerCase().includes("ganh");
}

function isLostStage(stage: PipelineStage): boolean {
  return stage.nome.toLowerCase().includes("perd");
}
