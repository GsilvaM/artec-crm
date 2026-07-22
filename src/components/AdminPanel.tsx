import { type FormEvent, useEffect, useState } from "react";
import { Plus } from "lucide-react";
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
      await onStagesChanged();
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
      showToast("Etapa renomeada.");
      setStageToRename(null);
      await onStagesChanged();
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
      showToast("Ordem da etapa atualizada.");
      setStageToReorder(null);
      await onStagesChanged();
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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível atualizar o acesso do usuário.");
    }
  }

  const orderedStages = [...stages].sort((a, b) => a.ordem - b.ordem);

  return (
    <section className="panel admin-panel" aria-label="Administração">
      <header>
        <div>
          <p className="eyebrow">Administração</p>
          <h2>Etapas, motivos de perda e usuários</h2>
        </div>
      </header>

      {error ? <div className="alert danger-alert" role="alert">{error}</div> : null}

      <div className="admin-grid">
        <article className="admin-block">
          <h3>Etapas do funil</h3>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Nome</th><th>Ordem</th><th>Tipo</th><th>Ações</th></tr></thead>
              <tbody>
                {orderedStages.map((stage) => (
                  <tr key={stage.id}>
                    <td>{stage.nome}</td>
                    <td>{stage.ordem}</td>
                    <td>{stage.isTerminal ? <span className="badge">terminal</span> : null}</td>
                    <td className="actions-cell">
                      <button className="button ghost" type="button" onClick={() => setStageToReorder(stage)}>Reordenar</button>
                      <button className="button ghost" type="button" disabled={stage.isTerminal} onClick={() => setStageToRename(stage)}>Renomear</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <form className="admin-inline-form" onSubmit={handleCreateStage}>
            <label>Nova etapa<input required value={newStage.nome} onChange={(event) => setNewStage({ ...newStage, nome: event.target.value })} /></label>
            <label>Ordem<input required type="number" min={1} value={newStage.ordem} onChange={(event) => setNewStage({ ...newStage, ordem: event.target.value })} /></label>
            <button className="button secondary" type="submit"><Plus aria-hidden="true" />Adicionar</button>
          </form>
        </article>

        <article className="admin-block">
          <h3>Motivos de perda</h3>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Nome</th><th>Status</th><th>Ações</th></tr></thead>
              <tbody>
                {lossReasons.map((reason) => (
                  <tr key={reason.id}>
                    <td>{reason.nome}</td>
                    <td><span className={`badge${reason.isActive ? "" : " warning"}`}>{reason.isActive ? "ativo" : "inativo"}</span></td>
                    <td className="actions-cell">
                      <button className="button ghost" type="button" onClick={() => void handleToggleLossReason(reason)}>
                        {reason.isActive ? "Desativar" : "Ativar"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <form className="admin-inline-form" onSubmit={handleCreateLossReason}>
            <label>Novo motivo<input required value={newLossReason} onChange={(event) => setNewLossReason(event.target.value)} /></label>
            <button className="button secondary" type="submit"><Plus aria-hidden="true" />Adicionar</button>
          </form>
        </article>

        <article className="admin-block">
          <h3>Usuários e acesso ao CRM</h3>
          <div className="table-wrap">
            <table>
              <thead><tr><th>E-mail</th><th>Papel</th><th>Ativo</th><th>Ações</th></tr></thead>
              <tbody>
                {users.map((user) => (
                  <UserMembershipRow key={user.userId} user={user} isSelf={user.userId === currentUserId} onSave={handleUpdateMembership} />
                ))}
                {!users.length ? <tr><td colSpan={4}>Nenhum usuário encontrado no Supabase Auth.</td></tr> : null}
              </tbody>
            </table>
          </div>
        </article>
      </div>

      {stageToRename ? (
        <PromptDialog
          title="Renomear etapa"
          label="Novo nome da etapa"
          defaultValue={stageToRename.nome}
          onConfirm={(value) => void handleConfirmRenameStage(value)}
          onCancel={() => setStageToRename(null)}
        />
      ) : null}

      {stageToReorder ? (
        <PromptDialog
          title="Reordenar etapa"
          label="Nova ordem da etapa"
          defaultValue={String(stageToReorder.ordem)}
          onConfirm={(value) => void handleConfirmReorderStage(value)}
          onCancel={() => setStageToReorder(null)}
        />
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
      <td>{user.email ?? user.userId.slice(0, 8)}{isSelf ? <span className="badge">você</span> : null}</td>
      <td>
        <select aria-label={`Papel de ${user.email ?? user.userId}`} value={role} onChange={(event) => setRole(event.target.value as CrmRole)}>
          <option value="gestor">Gestor</option>
          <option value="vendedor">Vendedor</option>
          <option value="atendimento">Atendimento</option>
        </select>
      </td>
      <td>
        <label className="sr-only" htmlFor={`active-${user.userId}`}>Usuário ativo no CRM</label>
        <input id={`active-${user.userId}`} type="checkbox" checked={isActive} disabled={isSelf} onChange={(event) => setIsActive(event.target.checked)} />
      </td>
      <td className="actions-cell">
        <button className="button secondary" type="button" onClick={() => void onSave(user, role, isActive)}>
          {user.hasMembership ? "Salvar" : "Conceder acesso"}
        </button>
      </td>
    </tr>
  );
}
