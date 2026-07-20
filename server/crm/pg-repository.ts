import pg from "pg";
import type {
  Actor,
  ActivityRecord,
  ApproveOpportunityInput,
  CancelNextActionInput,
  CompleteNextActionInput,
  CreateActivityInput,
  CreateCustomerInput,
  CreateNextActionInput,
  CreateOpportunityInput,
  CrmDataRepository,
  CustomerRecord,
  LossReasonRecord,
  NextActionPriority,
  NextActionRecord,
  NextActionStatus,
  OpportunityRecord,
  PipelineStageRecord,
  PostponeNextActionInput,
  UpdateActivityInput,
  UpdateCustomerInput,
  UpdateNextActionInput,
  UpdateOpportunityInput,
} from "./types.js";
import { assertActiveOpportunityHasNextAction, normalizePhone } from "./validation.js";
import { ApiError } from "../errors.js";

const { Pool } = pg;

type QueryExecutor = pg.Pool | pg.PoolClient;

type CustomerRow = {
  id: string;
  tipo_pessoa: CustomerRecord["tipoPessoa"];
  nome: string;
  nome_fantasia: string | null;
  telefone: string | null;
  telefone_normalizado: string | null;
  email: string | null;
  documento: string | null;
  empresa: string | null;
  bairro: string | null;
  cidade: string | null;
  estado: string | null;
  observacoes: string | null;
  auvo_contact_id: string | null;
  created_at: Date;
  updated_at: Date;
  created_by: string;
  updated_by: string | null;
  archived_at: Date | null;
  opportunities_count: string | number;
  duplicate_phone_customer_ids: string[] | null;
};

type OpportunityRow = {
  id: string;
  cliente_id: string;
  cliente_nome: string;
  titulo: string;
  descricao: string | null;
  tipo_demanda: string;
  origem: string | null;
  responsavel_id: string;
  etapa_id: string;
  etapa_nome: string;
  situacao: string;
  valor_estimado: number | null;
  valor_orcamento: number | null;
  valor_aprovado: number | null;
  forma_pagamento: string | null;
  quantidade_parcelas: number | null;
  previsao_execucao: string | null;
  proxima_acao: string | null;
  proxima_acao_em: Date | null;
  data_entrada: Date;
  data_orcamento: Date | null;
  data_aprovacao: Date | null;
  data_perda: Date | null;
  motivo_perda_id: string | null;
  motivo_perda_nome: string | null;
  status: OpportunityRecord["status"];
  current_next_action_id: string | null;
  created_at: Date;
  updated_at: Date;
  archived_at: Date | null;
};

type ActivityRow = {
  id: string;
  cliente_id: string;
  oportunidade_id: string | null;
  tipo: ActivityRecord["type"];
  title: string | null;
  corpo: string;
  occurred_at: Date;
  created_by: string;
  source: ActivityRecord["source"];
  metadata: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
  archived_at: Date | null;
};

type NextActionRow = {
  id: string;
  customer_id: string;
  customer_name: string;
  opportunity_id: string | null;
  opportunity_title: string | null;
  responsible_user_id: string;
  category: NextActionRecord["category"];
  title: string;
  description: string | null;
  due_at: Date;
  priority: NextActionPriority;
  status: NextActionStatus;
  completed_at: Date | null;
  completed_by: string | null;
  completion_result: string | null;
  postponed_from: Date | null;
  created_by: string;
  created_at: Date;
  updated_at: Date;
  cancelled_at: Date | null;
  cancelled_by: string | null;
  cancellation_reason: string | null;
  archived_at: Date | null;
};

export class PgCrmDataRepository implements CrmDataRepository {
  private readonly pool: pg.Pool;

  constructor(connectionString: string) {
    this.pool = new Pool({
      connectionString,
      max: 8,
      application_name: "artec-crm-api",
    });
  }

  async listCustomers(_actor: Actor, filters: { search?: string; archived?: boolean }): Promise<CustomerRecord[]> {
    const values: unknown[] = [];
    const where = [filters.archived ? "cliente.archived_at IS NOT NULL" : "cliente.archived_at IS NULL"];

    if (filters.search) {
      values.push(`%${filters.search}%`, normalizePhone(filters.search));
      where.push(`(cliente.nome ILIKE $${values.length - 1} OR cliente.empresa ILIKE $${values.length - 1} OR cliente.telefone_normalizado = $${values.length})`);
    }

    const result = await this.pool.query<CustomerRow>(`${customerSelectSql()} WHERE ${where.join(" AND ")} ORDER BY cliente.updated_at DESC LIMIT 100`, values);
    return result.rows.map(mapCustomer);
  }

  async getCustomer(_actor: Actor, id: string): Promise<CustomerRecord | null> {
    const result = await this.pool.query<CustomerRow>(`${customerSelectSql()} WHERE cliente.id = $1 LIMIT 1`, [id]);
    return result.rows[0] ? mapCustomer(result.rows[0]) : null;
  }

  async createCustomer(actor: Actor, input: CreateCustomerInput): Promise<CustomerRecord> {
    const result = await this.pool.query<CustomerRow>(
      `
        INSERT INTO crm.clientes (
          tipo_pessoa, nome, nome_fantasia, telefone, telefone_normalizado, email, documento,
          empresa, bairro, cidade, estado, observacoes, auvo_contact_id, created_by, updated_by
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $14)
        RETURNING *
      `,
      [
        input.tipoPessoa,
        input.nome,
        input.nomeFantasia ?? null,
        input.telefone ?? null,
        normalizePhone(input.telefone),
        input.email ?? null,
        input.documento ?? null,
        input.empresa ?? null,
        input.bairro ?? null,
        input.cidade ?? null,
        input.estado ?? null,
        input.observacoes ?? null,
        input.auvoContactId ?? null,
        actor.id,
      ],
    );

    return (await this.getCustomer(actor, result.rows[0].id)) as CustomerRecord;
  }

  async updateCustomer(actor: Actor, id: string, input: UpdateCustomerInput): Promise<CustomerRecord | null> {
    const fields: string[] = [];
    const values: unknown[] = [];
    const fieldMap: Record<string, unknown> = {
      tipo_pessoa: input.tipoPessoa,
      nome: input.nome,
      nome_fantasia: input.nomeFantasia,
      telefone: input.telefone,
      telefone_normalizado: input.telefone === undefined ? undefined : normalizePhone(input.telefone),
      email: input.email,
      documento: input.documento,
      empresa: input.empresa,
      bairro: input.bairro,
      cidade: input.cidade,
      estado: input.estado,
      observacoes: input.observacoes,
      auvo_contact_id: input.auvoContactId,
    };

    for (const [column, value] of Object.entries(fieldMap)) {
      if (value === undefined) continue;
      values.push(value);
      fields.push(`${column} = $${values.length}`);
    }

    values.push(actor.id);
    fields.push(`updated_by = $${values.length}`);
    values.push(id);

    const result = await this.pool.query<{ id: string }>(
      `UPDATE crm.clientes SET ${fields.join(", ")} WHERE id = $${values.length} RETURNING id`,
      values,
    );

    return result.rows[0] ? this.getCustomer(actor, result.rows[0].id) : null;
  }

  async setCustomerArchived(actor: Actor, id: string, archived: boolean): Promise<CustomerRecord | null> {
    const result = await this.pool.query<{ id: string }>(
      "UPDATE crm.clientes SET archived_at = CASE WHEN $1 THEN now() ELSE NULL END, updated_by = $2 WHERE id = $3 RETURNING id",
      [archived, actor.id, id],
    );
    return result.rows[0] ? this.getCustomer(actor, result.rows[0].id) : null;
  }

  async listOpportunities(actor: Actor, filters: { search?: string; status?: string; etapaId?: string; responsavelId?: string }): Promise<OpportunityRecord[]> {
    const values: unknown[] = [];
    const where = ["oportunidade.archived_at IS NULL"];

    if (actor.role === "vendedor") {
      values.push(actor.id);
      where.push(`oportunidade.responsavel_id = $${values.length}`);
    }

    if (filters.search) {
      values.push(`%${filters.search}%`);
      where.push(`(oportunidade.titulo ILIKE $${values.length} OR cliente.nome ILIKE $${values.length})`);
    }

    for (const [column, value] of [
      ["oportunidade.status", filters.status],
      ["oportunidade.etapa_id", filters.etapaId],
      ["oportunidade.responsavel_id", filters.responsavelId],
    ] as const) {
      if (!value) continue;
      values.push(value);
      where.push(`${column} = $${values.length}`);
    }

    const result = await this.pool.query<OpportunityRow>(`${opportunitySelectSql()} WHERE ${where.join(" AND ")} ORDER BY oportunidade.updated_at DESC LIMIT 100`, values);
    return result.rows.map(mapOpportunity);
  }

  async getOpportunity(actor: Actor, id: string): Promise<OpportunityRecord | null> {
    const values: unknown[] = [id];
    const where = ["oportunidade.id = $1"];
    if (actor.role === "vendedor") {
      values.push(actor.id);
      where.push(`oportunidade.responsavel_id = $${values.length}`);
    }

    const result = await this.pool.query<OpportunityRow>(`${opportunitySelectSql()} WHERE ${where.join(" AND ")} LIMIT 1`, values);
    return result.rows[0] ? mapOpportunity(result.rows[0]) : null;
  }

  async createOpportunity(actor: Actor, input: CreateOpportunityInput): Promise<OpportunityRecord> {
    const status = input.status ?? "ativa";
    assertActiveOpportunityHasNextAction({ ...input, status });
    await this.assertActiveResponsibleUser(input.responsavelId);
    const etapaId = input.etapaId ?? (await this.getFirstStageId());
    const client = await this.pool.connect();

    try {
      await client.query("BEGIN");
      const result = await client.query<{ id: string }>(
        `
          INSERT INTO crm.oportunidades (
            cliente_id, titulo, descricao, tipo_demanda, origem, responsavel_id, etapa_id, situacao,
            valor_estimado, valor_orcamento, proxima_acao, proxima_acao_em, status, created_by, updated_by
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $14)
          RETURNING id
        `,
        [
          input.clienteId,
          input.titulo,
          input.descricao ?? null,
          input.tipoDemanda,
          input.origem ?? null,
          input.responsavelId,
          etapaId,
          input.situacao,
          input.valorEstimado ?? null,
          input.valorOrcamento ?? null,
          input.proximaAcao ?? null,
          input.proximaAcaoEm ?? null,
          status,
          actor.id,
        ],
      );
      const opportunityId = result.rows[0].id;

      if (status === "ativa") {
        const nextAction = await client.query<{ id: string }>(
          `
            INSERT INTO crm.next_actions (
              customer_id, opportunity_id, responsible_user_id, title, due_at, priority, status, created_by, updated_by
            )
            VALUES ($1, $2, $3, $4, $5, 'normal', 'pending', $6, $6)
            RETURNING id
          `,
          [input.clienteId, opportunityId, input.responsavelId, input.proximaAcao, input.proximaAcaoEm, actor.id],
        );
        await client.query("UPDATE crm.oportunidades SET current_next_action_id = $1 WHERE id = $2", [nextAction.rows[0].id, opportunityId]);
      }

      await client.query("COMMIT");
      return (await this.getOpportunity(actor, opportunityId)) as OpportunityRecord;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async updateOpportunity(actor: Actor, id: string, input: UpdateOpportunityInput): Promise<OpportunityRecord | null> {
    const current = await this.getOpportunity(actor, id);
    if (!current) return null;
    assertCanEditOpportunity(current);
    if (input.status === "ganha" || input.status === "perdida" || input.status === "arquivada") {
      throw new ApiError(409, "bad_request", "Use o fluxo proprio para aprovar, perder ou arquivar a oportunidade.");
    }
    if (input.responsavelId) await this.assertActiveResponsibleUser(input.responsavelId);

    const merged = {
      status: input.status ?? current.status,
      responsavelId: input.responsavelId ?? current.responsavelId,
      proximaAcao: input.proximaAcao === undefined ? current.proximaAcao : input.proximaAcao,
      proximaAcaoEm: input.proximaAcaoEm === undefined ? current.proximaAcaoEm : input.proximaAcaoEm,
    };
    assertActiveOpportunityHasNextAction(merged);

    const fields: string[] = [];
    const values: unknown[] = [];
    const fieldMap: Record<string, unknown> = {
      cliente_id: input.clienteId,
      titulo: input.titulo,
      descricao: input.descricao,
      tipo_demanda: input.tipoDemanda,
      origem: input.origem,
      responsavel_id: input.responsavelId,
      etapa_id: input.etapaId,
      situacao: input.situacao,
      valor_estimado: input.valorEstimado,
      valor_orcamento: input.valorOrcamento,
      valor_aprovado: input.valorAprovado,
      forma_pagamento: input.formaPagamento,
      quantidade_parcelas: input.quantidadeParcelas,
      previsao_execucao: input.previsaoExecucao,
      data_aprovacao: input.dataAprovacao,
      data_perda: input.dataPerda,
      proxima_acao: input.proximaAcao,
      proxima_acao_em: input.proximaAcaoEm,
      motivo_perda_id: input.motivoPerdaId,
      status: input.status,
    };

    for (const [column, value] of Object.entries(fieldMap)) {
      if (value === undefined) continue;
      values.push(value);
      fields.push(`${column} = $${values.length}`);
    }

    values.push(actor.id);
    fields.push(`updated_by = $${values.length}`);
    values.push(id);

    const nextActionTouched =
      merged.status === "ativa" &&
      (input.proximaAcao !== undefined || input.proximaAcaoEm !== undefined || input.responsavelId !== undefined || input.clienteId !== undefined);
    const client = await this.pool.connect();

    try {
      await client.query("BEGIN");
      const result = await client.query<{ id: string }>(
        `UPDATE crm.oportunidades SET ${fields.join(", ")} WHERE id = $${values.length} RETURNING id`,
        values,
      );
      if (!result.rows[0]) {
        await client.query("COMMIT");
        return null;
      }

      if (nextActionTouched) {
        const finalCustomerId = input.clienteId ?? current.clienteId;
        const finalTitle = merged.proximaAcao as string;
        const finalDueAt = merged.proximaAcaoEm as string;
        const finalResponsibleUserId = merged.responsavelId as string;

        if (current.currentNextActionId) {
          await client.query(
            `
              UPDATE crm.next_actions
              SET customer_id = $1,
                  responsible_user_id = $2,
                  title = $3,
                  due_at = $4,
                  updated_by = $5
              WHERE id = $6
                AND status = 'pending'
            `,
            [finalCustomerId, finalResponsibleUserId, finalTitle, finalDueAt, actor.id, current.currentNextActionId],
          );
          await this.setCurrentNextAction(actor, id, current.currentNextActionId, finalTitle, finalDueAt, client);
        } else {
          const created = await client.query<{ id: string }>(
            `
              INSERT INTO crm.next_actions (
                customer_id, opportunity_id, responsible_user_id, title, due_at, priority, status, created_by, updated_by
              )
              VALUES ($1, $2, $3, $4, $5, 'normal', 'pending', $6, $6)
              RETURNING id
            `,
            [finalCustomerId, id, finalResponsibleUserId, finalTitle, finalDueAt, actor.id],
          );
          await this.setCurrentNextAction(actor, id, created.rows[0].id, finalTitle, finalDueAt, client);
        }
      }

      await client.query("COMMIT");
      return this.getOpportunity(actor, id);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async approveOpportunity(actor: Actor, id: string, input: ApproveOpportunityInput): Promise<OpportunityRecord | null> {
    const current = await this.getOpportunity(actor, id);
    if (!current) return null;
    assertCanTransition(current, "ganha");
    const stageId = await this.getStageIdByName("Aprovado");
    const installments = input.formaPagamento.toLocaleLowerCase("pt-BR").includes("vista") ? 1 : input.quantidadeParcelas;
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(
        `
          UPDATE crm.oportunidades
          SET status = 'ganha',
              etapa_id = $1,
              valor_aprovado = $2,
              forma_pagamento = $3,
              quantidade_parcelas = $4,
              previsao_execucao = $5,
              data_aprovacao = now(),
              current_next_action_id = NULL,
              proxima_acao = NULL,
              proxima_acao_em = NULL,
              updated_by = $6
          WHERE id = $7
        `,
        [stageId, input.valorAprovado, input.formaPagamento, installments, input.previsaoExecucao, actor.id, id],
      );
      await client.query(
        `
          INSERT INTO crm.atividades (
            cliente_id, oportunidade_id, tipo, title, corpo, occurred_at, created_by, updated_by, source, metadata
          )
          VALUES ($1, $2, 'approval', 'Oportunidade aprovada', $3, now(), $4, $4, 'system', '{}'::jsonb)
        `,
        [current.clienteId, id, `Valor aprovado: ${input.valorAprovado}. Forma de pagamento: ${input.formaPagamento}.`, actor.id],
      );
      await client.query("COMMIT");
      return this.getOpportunity(actor, id);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async loseOpportunity(actor: Actor, id: string, input: { motivoPerdaId: string }): Promise<OpportunityRecord | null> {
    const current = await this.getOpportunity(actor, id);
    if (!current) return null;
    assertCanTransition(current, "perdida");
    const stageId = await this.getStageIdByName("Perdido");
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(
        `
          UPDATE crm.oportunidades
          SET status = 'perdida',
              etapa_id = $1,
              motivo_perda_id = $2,
              data_perda = now(),
              current_next_action_id = NULL,
              proxima_acao = NULL,
              proxima_acao_em = NULL,
              updated_by = $3
          WHERE id = $4
        `,
        [stageId, input.motivoPerdaId, actor.id, id],
      );
      await client.query(
        `
          INSERT INTO crm.atividades (
            cliente_id, oportunidade_id, tipo, title, corpo, occurred_at, created_by, updated_by, source, metadata
          )
          VALUES ($1, $2, 'loss', 'Oportunidade perdida', 'Perda registrada com motivo.', now(), $3, $3, 'system', '{}'::jsonb)
        `,
        [current.clienteId, id, actor.id],
      );
      await client.query("COMMIT");
      return this.getOpportunity(actor, id);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async setOpportunityArchived(actor: Actor, id: string, archived: boolean): Promise<OpportunityRecord | null> {
    const current = await this.getOpportunity(actor, id);
    if (!current) return null;
    if (archived && current.archivedAt) return current;
    if (!archived && !current.archivedAt) return current;
    const result = await this.pool.query<{ id: string }>(
      "UPDATE crm.oportunidades SET archived_at = CASE WHEN $1 THEN now() ELSE NULL END, updated_by = $2 WHERE id = $3 RETURNING id",
      [archived, actor.id, id],
    );
    return result.rows[0] ? this.getOpportunity(actor, result.rows[0].id) : null;
  }

  async listActivities(actor: Actor, filters: { customerId?: string; opportunityId?: string }): Promise<ActivityRecord[]> {
    const values: unknown[] = [];
    const where = ["atividade.archived_at IS NULL"];
    if (filters.customerId) {
      values.push(filters.customerId);
      where.push(`atividade.cliente_id = $${values.length}`);
    }
    if (filters.opportunityId) {
      values.push(filters.opportunityId);
      where.push(`atividade.oportunidade_id = $${values.length}`);
    }
    if (actor.role === "vendedor") {
      values.push(actor.id);
      where.push(`(atividade.created_by = $${values.length} OR oportunidade.responsavel_id = $${values.length})`);
    }

    const result = await this.pool.query<ActivityRow>(`${activitySelectSql()} WHERE ${where.join(" AND ")} ORDER BY atividade.occurred_at DESC LIMIT 150`, values);
    return result.rows.map(mapActivity);
  }

  async createActivity(actor: Actor, input: CreateActivityInput): Promise<ActivityRecord> {
    await this.assertCustomerOpportunityMatch(input.customerId, input.opportunityId ?? null);
    await this.assertCanAccessOpportunity(actor, input.opportunityId ?? null);
    const result = await this.pool.query<ActivityRow>(
      `
        INSERT INTO crm.atividades (
          cliente_id, oportunidade_id, tipo, title, corpo, occurred_at, created_by, updated_by, source, metadata
        )
        VALUES ($1, $2, $3, $4, $5, COALESCE($6::timestamptz, now()), $7, $7, $8, $9)
        RETURNING *
      `,
      [
        input.customerId,
        input.opportunityId ?? null,
        input.type,
        input.title ?? null,
        input.description,
        input.occurredAt ?? null,
        actor.id,
        input.source ?? "manual",
        input.metadata ?? {},
      ],
    );
    return mapActivity(result.rows[0]);
  }

  async updateActivity(actor: Actor, id: string, input: UpdateActivityInput): Promise<ActivityRecord | null> {
    const current = await this.findActivity(actor, id);
    if (!current) return null;
    const fields: string[] = [];
    const values: unknown[] = [];
    const fieldMap: Record<string, unknown> = {
      tipo: input.type,
      title: input.title,
      corpo: input.description,
      occurred_at: input.occurredAt,
      metadata: input.metadata,
    };
    for (const [column, value] of Object.entries(fieldMap)) {
      if (value === undefined) continue;
      values.push(value);
      fields.push(`${column} = $${values.length}`);
    }
    values.push(actor.id);
    fields.push(`updated_by = $${values.length}`);
    values.push(id);
    const result = await this.pool.query<ActivityRow>(
      `UPDATE crm.atividades atividade SET ${fields.join(", ")} WHERE atividade.id = $${values.length} RETURNING *`,
      values,
    );
    return result.rows[0] ? mapActivity(result.rows[0]) : null;
  }

  async setActivityArchived(actor: Actor, id: string, archived: boolean): Promise<ActivityRecord | null> {
    const current = await this.findActivity(actor, id);
    if (!current) return null;
    const result = await this.pool.query<ActivityRow>(
      "UPDATE crm.atividades SET archived_at = CASE WHEN $1 THEN now() ELSE NULL END, updated_by = $2 WHERE id = $3 RETURNING *",
      [archived, actor.id, id],
    );
    return result.rows[0] ? mapActivity(result.rows[0]) : null;
  }

  async listNextActions(
    actor: Actor,
    filters: {
      responsibleUserId?: string;
      status?: NextActionStatus;
      category?: NextActionRecord["category"];
      overdue?: boolean;
      today?: boolean;
      future?: boolean;
      dateFrom?: string;
      dateTo?: string;
      customerId?: string;
      opportunityId?: string;
      priority?: NextActionPriority;
    },
  ): Promise<NextActionRecord[]> {
    const values: unknown[] = [];
    const where: string[] = [];
    if (actor.role === "vendedor") {
      values.push(actor.id);
      where.push(`action.responsible_user_id = $${values.length}`);
    }
    const exactFilters: Array<[string, unknown]> = [
      ["action.responsible_user_id", filters.responsibleUserId],
      ["action.status", filters.status],
      ["action.category", filters.category],
      ["action.customer_id", filters.customerId],
      ["action.opportunity_id", filters.opportunityId],
      ["action.priority", filters.priority],
    ];
    for (const [column, value] of exactFilters) {
      if (!value) continue;
      values.push(value);
      where.push(`${column} = $${values.length}`);
    }
    if (filters.overdue) where.push("action.status = 'pending' AND action.due_at < now()");
    if (filters.today) where.push("action.status = 'pending' AND action.due_at >= date_trunc('day', now() AT TIME ZONE 'America/Sao_Paulo') AT TIME ZONE 'America/Sao_Paulo' AND action.due_at < (date_trunc('day', now() AT TIME ZONE 'America/Sao_Paulo') + interval '1 day') AT TIME ZONE 'America/Sao_Paulo'");
    if (filters.future) where.push("action.status = 'pending' AND action.due_at >= (date_trunc('day', now() AT TIME ZONE 'America/Sao_Paulo') + interval '1 day') AT TIME ZONE 'America/Sao_Paulo'");
    if (filters.dateFrom) {
      values.push(filters.dateFrom);
      where.push(`action.due_at >= $${values.length}`);
    }
    if (filters.dateTo) {
      values.push(filters.dateTo);
      where.push(`action.due_at <= $${values.length}`);
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const result = await this.pool.query<NextActionRow>(`${nextActionSelectSql()} ${whereSql} ORDER BY action.due_at ASC LIMIT 150`, values);
    return result.rows.map(mapNextAction);
  }

  async getNextAction(actor: Actor, id: string): Promise<NextActionRecord | null> {
    const values: unknown[] = [id];
    const where = ["action.id = $1"];
    if (actor.role === "vendedor") {
      values.push(actor.id);
      where.push(`action.responsible_user_id = $${values.length}`);
    }
    const result = await this.pool.query<NextActionRow>(`${nextActionSelectSql()} WHERE ${where.join(" AND ")} LIMIT 1`, values);
    return result.rows[0] ? mapNextAction(result.rows[0]) : null;
  }

  async createNextAction(actor: Actor, input: CreateNextActionInput): Promise<NextActionRecord> {
    await this.assertCustomerOpportunityMatch(input.customerId, input.opportunityId ?? null);
    await this.assertActiveResponsibleUser(input.responsibleUserId);
    await this.assertCanWriteNextAction(actor, input.responsibleUserId, input.opportunityId ?? null);
    const opportunity = input.opportunityId ? await this.getOpportunity(actor, input.opportunityId) : null;
    const client = await this.pool.connect();
    let insertedId: string | null = null;

    try {
      await client.query("BEGIN");
      const result = await client.query<NextActionRow>(
        `
          INSERT INTO crm.next_actions (
            customer_id, opportunity_id, responsible_user_id, category, title, description, due_at, priority, status, created_by, updated_by
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending', $9, $9)
          RETURNING *
        `,
        [
          input.customerId,
          input.opportunityId ?? null,
          input.responsibleUserId,
          input.category ?? "commercial",
          input.title,
          input.description ?? null,
          input.dueAt,
          input.priority ?? "normal",
          actor.id,
        ],
      );
      insertedId = result.rows[0].id;
      if (opportunity?.status === "ativa" && opportunity.archivedAt === null) {
        await this.setCurrentNextAction(actor, input.opportunityId as string, result.rows[0].id, input.title, input.dueAt, client);
      }
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }

    return (await this.getNextAction(actor, insertedId as string)) as NextActionRecord;
  }

  async updateNextAction(actor: Actor, id: string, input: UpdateNextActionInput): Promise<NextActionRecord | null> {
    const current = await this.getNextAction(actor, id);
    if (!current || current.status !== "pending") return null;
    const finalCustomerId = input.customerId ?? current.customerId;
    const finalOpportunityId = input.opportunityId === undefined ? current.opportunityId : input.opportunityId;
    const finalResponsibleUserId = input.responsibleUserId ?? current.responsibleUserId;
    await this.assertCustomerOpportunityMatch(finalCustomerId, finalOpportunityId ?? null);
    await this.assertActiveResponsibleUser(finalResponsibleUserId);
    await this.assertCanWriteNextAction(actor, finalResponsibleUserId, finalOpportunityId ?? null);
    if (current.opportunityId) await this.assertCanMoveCurrentAction(actor, current, finalOpportunityId ?? null);
    const fields: string[] = [];
    const values: unknown[] = [];
    const fieldMap: Record<string, unknown> = {
      customer_id: input.customerId,
      opportunity_id: input.opportunityId,
      responsible_user_id: input.responsibleUserId,
      category: input.category,
      title: input.title,
      description: input.description,
      due_at: input.dueAt,
      priority: input.priority,
    };
    for (const [column, value] of Object.entries(fieldMap)) {
      if (value === undefined) continue;
      values.push(value);
      fields.push(`${column} = $${values.length}`);
    }
    values.push(actor.id);
    fields.push(`updated_by = $${values.length}`);
    values.push(id);
    const result = await this.pool.query<NextActionRow>(`UPDATE crm.next_actions action SET ${fields.join(", ")} WHERE action.id = $${values.length} RETURNING *`, values);
    const updated = result.rows[0] ? mapNextAction(result.rows[0]) : null;
    if (updated?.opportunityId) {
      const opportunity = await this.getOpportunity(actor, updated.opportunityId);
      if (opportunity?.status === "ativa" && opportunity.currentNextActionId === updated.id && opportunity.archivedAt === null) {
        await this.setCurrentNextAction(actor, updated.opportunityId, updated.id, updated.title, updated.dueAt);
      }
    }
    return updated;
  }

  async completeNextAction(actor: Actor, id: string, input: CompleteNextActionInput): Promise<NextActionRecord | null> {
    return this.closePendingNextAction(actor, id, "completed", input);
  }

  async postponeNextAction(actor: Actor, id: string, input: PostponeNextActionInput): Promise<NextActionRecord | null> {
    const current = await this.getNextAction(actor, id);
    if (!current || current.status !== "pending") return null;
    await this.assertCanWriteNextAction(actor, current.responsibleUserId, current.opportunityId);
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const result = await client.query<NextActionRow>(
        "UPDATE crm.next_actions SET postponed_from = due_at, due_at = $1, updated_by = $2 WHERE id = $3 RETURNING *",
        [input.dueAt, actor.id, id],
      );
      const updated = mapNextAction(result.rows[0]);
      if (updated.opportunityId) await this.setCurrentNextAction(actor, updated.opportunityId, updated.id, updated.title, updated.dueAt, client);
      await client.query(
        `
          INSERT INTO crm.atividades (
            cliente_id, oportunidade_id, tipo, title, corpo, occurred_at, created_by, updated_by, source, metadata
          )
          VALUES ($1, $2, 'follow_up', 'Proxima acao reagendada', $3, now(), $4, $4, 'system', '{}'::jsonb)
        `,
        [updated.customerId, updated.opportunityId, `Reagendada para ${updated.dueAt}.`, actor.id],
      );
      await client.query("COMMIT");
      return updated;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async cancelNextAction(actor: Actor, id: string, input: CancelNextActionInput): Promise<NextActionRecord | null> {
    return this.closePendingNextAction(actor, id, "cancelled", input);
  }

  async listPipelineStages(): Promise<PipelineStageRecord[]> {
    const result = await this.pool.query<{ id: string; nome: string; ordem: number; is_terminal: boolean }>(
      "SELECT id, nome, ordem, is_terminal FROM crm.etapas_funil ORDER BY ordem ASC",
    );
    return result.rows.map((row) => ({ id: row.id, nome: row.nome, ordem: row.ordem, isTerminal: row.is_terminal }));
  }

  async listLossReasons(): Promise<LossReasonRecord[]> {
    const result = await this.pool.query<{ id: string; nome: string }>(
      "SELECT id, nome FROM crm.motivos_perda WHERE is_active ORDER BY nome ASC",
    );
    return result.rows;
  }

  async close(): Promise<void> {
    await this.pool.end();
  }

  private async getFirstStageId(): Promise<string> {
    const result = await this.pool.query<{ id: string }>("SELECT id FROM crm.etapas_funil ORDER BY ordem ASC LIMIT 1");
    if (!result.rows[0]) throw new Error("pipeline_stage_missing");
    return result.rows[0].id;
  }

  private async getStageIdByName(nome: string): Promise<string> {
    const result = await this.pool.query<{ id: string }>("SELECT id FROM crm.etapas_funil WHERE nome = $1 LIMIT 1", [nome]);
    if (!result.rows[0]) throw new Error("pipeline_stage_missing");
    return result.rows[0].id;
  }

  private async findActivity(actor: Actor, id: string): Promise<ActivityRecord | null> {
    const values: unknown[] = [id];
    const where = ["atividade.id = $1"];
    if (actor.role === "vendedor") {
      values.push(actor.id);
      where.push(`(atividade.created_by = $${values.length} OR oportunidade.responsavel_id = $${values.length})`);
    }
    const result = await this.pool.query<ActivityRow>(`${activitySelectSql()} WHERE ${where.join(" AND ")} LIMIT 1`, values);
    return result.rows[0] ? mapActivity(result.rows[0]) : null;
  }

  private async assertCustomerOpportunityMatch(customerId: string, opportunityId: string | null): Promise<void> {
    if (!opportunityId) return;
    const result = await this.pool.query<{ id: string }>(
      "SELECT id FROM crm.oportunidades WHERE id = $1 AND cliente_id = $2 LIMIT 1",
      [opportunityId, customerId],
    );
    if (!result.rows[0]) throw new ApiError(400, "bad_request", "A oportunidade informada nao pertence ao cliente.");
  }

  private async assertCanAccessOpportunity(actor: Actor, opportunityId: string | null): Promise<void> {
    if (!opportunityId || actor.role !== "vendedor") return;
    const result = await this.pool.query<{ id: string }>(
      "SELECT id FROM crm.oportunidades WHERE id = $1 AND responsavel_id = $2 LIMIT 1",
      [opportunityId, actor.id],
    );
    if (!result.rows[0]) throw new ApiError(403, "forbidden", "Usuario sem permissao para esta oportunidade.");
  }

  private async assertCanWriteNextAction(actor: Actor, responsibleUserId: string, opportunityId: string | null): Promise<void> {
    if (actor.role === "gestor" || actor.role === "atendimento") return;
    if (responsibleUserId !== actor.id) throw new ApiError(403, "forbidden", "Vendedor nao pode alterar acoes de outro responsavel.");
    await this.assertCanAccessOpportunity(actor, opportunityId);
  }

  private async assertActiveResponsibleUser(userId: string): Promise<void> {
    const result = await this.pool.query<{ user_id: string }>(
      "SELECT user_id FROM crm.user_memberships WHERE user_id = $1 AND is_active LIMIT 1",
      [userId],
    );
    if (!result.rows[0]) throw new ApiError(422, "bad_request", "Informe um responsavel ativo no CRM.");
  }

  private async assertCanMoveCurrentAction(actor: Actor, action: NextActionRecord, nextOpportunityId: string | null): Promise<void> {
    if (!action.opportunityId || action.opportunityId === nextOpportunityId) return;
    const opportunity = await this.getOpportunity(actor, action.opportunityId);
    if (opportunity?.status === "ativa" && opportunity.currentNextActionId === action.id && opportunity.archivedAt === null) {
      throw new ApiError(409, "bad_request", "Nao altere a oportunidade da proxima acao atual. Crie outra acao antes.");
    }
  }

  private async setCurrentNextAction(actor: Actor, opportunityId: string, nextActionId: string | null, title: string | null, dueAt: string | null, executor: QueryExecutor = this.pool): Promise<void> {
    await executor.query(
      `
        UPDATE crm.oportunidades
        SET current_next_action_id = $1,
            proxima_acao = $2,
            proxima_acao_em = $3,
            updated_by = $4
        WHERE id = $5
      `,
      [nextActionId, title, dueAt, actor.id, opportunityId],
    );
  }

  private async closePendingNextAction(
    actor: Actor,
    id: string,
    status: "completed" | "cancelled",
    input: CompleteNextActionInput | CancelNextActionInput,
  ): Promise<NextActionRecord | null> {
    const current = await this.getNextAction(actor, id);
    if (!current || current.status !== "pending") return null;
    await this.assertCanWriteNextAction(actor, current.responsibleUserId, current.opportunityId);

    const opportunity = current.opportunityId ? await this.getOpportunity(actor, current.opportunityId) : null;
    const needsReplacement = opportunity?.status === "ativa" && opportunity.archivedAt === null && opportunity.currentNextActionId === current.id;
    const replacement = "nextAction" in input ? input.nextAction : null;
    if (needsReplacement && !replacement) throw new ApiError(422, "bad_request", "Defina a proxima acao antes de concluir esta atividade.");

    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      let nextActionId: string | null = null;
      let nextTitle: string | null = null;
      let nextDueAt: string | null = null;

      if (replacement) {
        await this.assertCustomerOpportunityMatch(replacement.customerId, replacement.opportunityId ?? null);
        await this.assertActiveResponsibleUser(replacement.responsibleUserId);
        await this.assertCanWriteNextAction(actor, replacement.responsibleUserId, replacement.opportunityId ?? null);
        const created = await client.query<{ id: string }>(
          `
            INSERT INTO crm.next_actions (
              customer_id, opportunity_id, responsible_user_id, category, title, description, due_at, priority, status, created_by, updated_by
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending', $9, $9)
            RETURNING id
          `,
          [
            replacement.customerId,
            replacement.opportunityId ?? null,
            replacement.responsibleUserId,
            replacement.category ?? "commercial",
            replacement.title,
            replacement.description ?? null,
            replacement.dueAt,
            replacement.priority ?? "normal",
            actor.id,
          ],
        );
        nextActionId = created.rows[0].id;
        nextTitle = replacement.title;
        nextDueAt = replacement.dueAt;
      }

      if (current.opportunityId && opportunity?.currentNextActionId === current.id) {
        await client.query(
          "UPDATE crm.oportunidades SET current_next_action_id = $1, proxima_acao = $2, proxima_acao_em = $3, updated_by = $4 WHERE id = $5",
          [nextActionId, nextTitle, nextDueAt, actor.id, current.opportunityId],
        );
      }

      const closed =
        status === "completed"
          ? await client.query<NextActionRow>(
              `
                UPDATE crm.next_actions
                SET status = 'completed', completed_at = now(), completed_by = $1, completion_result = $2, updated_by = $1
                WHERE id = $3
                RETURNING *
              `,
              [actor.id, (input as CompleteNextActionInput).completionResult, id],
            )
          : await client.query<NextActionRow>(
              `
                UPDATE crm.next_actions
                SET status = 'cancelled', cancelled_at = now(), cancelled_by = $1, cancellation_reason = $2, updated_by = $1
                WHERE id = $3
                RETURNING *
              `,
              [actor.id, (input as CancelNextActionInput).cancellationReason, id],
            );

      await client.query(
        `
          INSERT INTO crm.atividades (
            cliente_id, oportunidade_id, tipo, title, corpo, occurred_at, created_by, updated_by, source, metadata
          )
          VALUES ($1, $2, 'follow_up', $3, $4, now(), $5, $5, 'manual', '{}'::jsonb)
        `,
        [
          current.customerId,
          current.opportunityId,
          status === "completed" ? "Proxima acao concluida" : "Proxima acao cancelada",
          status === "completed" ? (input as CompleteNextActionInput).completionResult : (input as CancelNextActionInput).cancellationReason,
          actor.id,
        ],
      );

      await client.query("COMMIT");
      return mapNextAction(closed.rows[0]);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
}

function customerSelectSql(): string {
  return `
    SELECT
      cliente.*,
      (SELECT count(*) FROM crm.oportunidades oportunidade WHERE oportunidade.cliente_id = cliente.id) AS opportunities_count,
      COALESCE(
        (
          SELECT array_agg(duplicado.id)
          FROM crm.clientes duplicado
          WHERE duplicado.telefone_normalizado = cliente.telefone_normalizado
            AND duplicado.id <> cliente.id
            AND cliente.telefone_normalizado IS NOT NULL
        ),
        ARRAY[]::uuid[]
      ) AS duplicate_phone_customer_ids
    FROM crm.clientes cliente
  `;
}

function opportunitySelectSql(): string {
  return `
    SELECT
      oportunidade.*,
      cliente.nome AS cliente_nome,
      etapa.nome AS etapa_nome,
      motivo.nome AS motivo_perda_nome
    FROM crm.oportunidades oportunidade
    JOIN crm.clientes cliente ON cliente.id = oportunidade.cliente_id
    JOIN crm.etapas_funil etapa ON etapa.id = oportunidade.etapa_id
    LEFT JOIN crm.motivos_perda motivo ON motivo.id = oportunidade.motivo_perda_id
  `;
}

function activitySelectSql(): string {
  return `
    SELECT atividade.*
    FROM crm.atividades atividade
    LEFT JOIN crm.oportunidades oportunidade ON oportunidade.id = atividade.oportunidade_id
  `;
}

function nextActionSelectSql(): string {
  return `
    SELECT
      action.*,
      customer.nome AS customer_name,
      opportunity.titulo AS opportunity_title
    FROM crm.next_actions action
    JOIN crm.clientes customer ON customer.id = action.customer_id
    LEFT JOIN crm.oportunidades opportunity ON opportunity.id = action.opportunity_id
  `;
}

function mapCustomer(row: CustomerRow): CustomerRecord {
  return {
    id: row.id,
    tipoPessoa: row.tipo_pessoa,
    nome: row.nome,
    nomeFantasia: row.nome_fantasia,
    telefone: row.telefone,
    telefoneNormalizado: row.telefone_normalizado,
    email: row.email,
    documento: row.documento,
    empresa: row.empresa,
    bairro: row.bairro,
    cidade: row.cidade,
    estado: row.estado,
    observacoes: row.observacoes,
    auvoContactId: row.auvo_contact_id,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
    createdBy: row.created_by,
    updatedBy: row.updated_by,
    archivedAt: row.archived_at?.toISOString() ?? null,
    opportunitiesCount: Number(row.opportunities_count),
    duplicatePhoneCustomerIds: row.duplicate_phone_customer_ids ?? [],
  };
}

function mapOpportunity(row: OpportunityRow): OpportunityRecord {
  return {
    id: row.id,
    clienteId: row.cliente_id,
    clienteNome: row.cliente_nome,
    titulo: row.titulo,
    descricao: row.descricao,
    tipoDemanda: row.tipo_demanda,
    origem: row.origem,
    responsavelId: row.responsavel_id,
    etapaId: row.etapa_id,
    etapaNome: row.etapa_nome,
    situacao: row.situacao,
    valorEstimado: row.valor_estimado,
    valorOrcamento: row.valor_orcamento,
    valorAprovado: row.valor_aprovado,
    formaPagamento: row.forma_pagamento,
    quantidadeParcelas: row.quantidade_parcelas,
    previsaoExecucao: row.previsao_execucao,
    proximaAcao: row.proxima_acao,
    proximaAcaoEm: row.proxima_acao_em?.toISOString() ?? null,
    dataEntrada: row.data_entrada.toISOString(),
    dataOrcamento: row.data_orcamento?.toISOString() ?? null,
    dataAprovacao: row.data_aprovacao?.toISOString() ?? null,
    dataPerda: row.data_perda?.toISOString() ?? null,
    motivoPerdaId: row.motivo_perda_id,
    motivoPerdaNome: row.motivo_perda_nome,
    status: row.status,
    currentNextActionId: row.current_next_action_id,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
    archivedAt: row.archived_at?.toISOString() ?? null,
  };
}

function mapActivity(row: ActivityRow): ActivityRecord {
  return {
    id: row.id,
    customerId: row.cliente_id,
    opportunityId: row.oportunidade_id,
    type: row.tipo,
    title: row.title,
    description: row.corpo,
    occurredAt: row.occurred_at.toISOString(),
    createdBy: row.created_by,
    source: row.source,
    metadata: row.metadata,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
    archivedAt: row.archived_at?.toISOString() ?? null,
  };
}

function mapNextAction(row: NextActionRow): NextActionRecord {
  return {
    id: row.id,
    customerId: row.customer_id,
    customerName: row.customer_name,
    opportunityId: row.opportunity_id,
    opportunityTitle: row.opportunity_title,
    responsibleUserId: row.responsible_user_id,
    category: row.category,
    title: row.title,
    description: row.description,
    dueAt: row.due_at.toISOString(),
    priority: row.priority,
    status: row.status,
    completedAt: row.completed_at?.toISOString() ?? null,
    completedBy: row.completed_by,
    completionResult: row.completion_result,
    postponedFrom: row.postponed_from?.toISOString() ?? null,
    createdBy: row.created_by,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
    cancelledAt: row.cancelled_at?.toISOString() ?? null,
    cancelledBy: row.cancelled_by,
    cancellationReason: row.cancellation_reason,
    archivedAt: row.archived_at?.toISOString() ?? null,
  };
}

function assertCanTransition(current: OpportunityRecord, nextStatus: "ganha" | "perdida"): void {
  if (current.archivedAt) throw new ApiError(409, "bad_request", "Oportunidade arquivada nao pode mudar de status.");
  if (current.status === "ganha" && nextStatus === "perdida") throw new ApiError(409, "bad_request", "Oportunidade aprovada nao pode ser marcada como perdida.");
  if (current.status === "perdida" && nextStatus === "ganha") throw new ApiError(409, "bad_request", "Oportunidade perdida nao pode ser aprovada.");
  if (current.status === nextStatus) throw new ApiError(409, "bad_request", "Esta transicao ja foi registrada.");
}

function assertCanEditOpportunity(current: OpportunityRecord): void {
  if (current.archivedAt || current.status === "arquivada") {
    throw new ApiError(409, "bad_request", "Oportunidade arquivada nao pode ser editada.");
  }
  if (current.status === "ganha") {
    throw new ApiError(409, "bad_request", "Oportunidade aprovada nao pode ser editada por fluxo comum.");
  }
  if (current.status === "perdida") {
    throw new ApiError(409, "bad_request", "Oportunidade perdida nao pode ser editada por fluxo comum.");
  }
}
