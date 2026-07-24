import { z } from "zod";
import { ApiError } from "../errors.js";

const emptyToNull = z
  .string()
  .trim()
  .transform((value) => (value === "" ? null : value));

const optionalText = emptyToNull.optional().nullable();
const moneyValue = z.coerce.number().int().nonnegative().optional().nullable();
const uuid = z.string().uuid();
const metadataSchema = z.record(z.string(), z.unknown()).default({});
const nextActionCategorySchema = z.enum(["commercial", "warranty", "support", "after_sales"]);
const addressKindSchema = z.enum(["service", "billing", "pickup", "installation", "other"]);
const equipmentTypeSchema = z.enum(["split_hi_wall", "cassette", "window_ac", "floor_ceiling", "multi_split", "other"]);
const visitStatusSchema = z.enum(["draft", "awaiting_confirmation", "confirmed", "completed", "cancelled", "no_show"]);
const notificationStatusSchema = z.enum(["unread", "read", "archived", "resolved", "active"]);
const notificationTypeSchema = z.enum([
  "overdue_next_action",
  "due_soon_next_action",
  "opportunity_assigned",
  "next_action_reassigned",
  "missing_next_action",
  "stalled_opportunity",
  "internal_error",
]);
const notificationSeveritySchema = z.enum(["info", "attention", "urgent"]);
const auvoWebhookStatusSchema = z.enum(["received", "processing", "processed", "ignored", "failed"]);

// Categorias reais de demanda comercial da Artec (CONTEXTO-ROTINA-ATENDIMENTO-ARTEC-CRM.md secao 6,
// subsecoes 6.1-6.5 e 6.7 — 6.6 "garantia, suporte e pos-venda" fica de fora: por regra do negocio
// esses casos viram atividade do cliente, nunca oportunidade).
export const TIPO_DEMANDA_OPTIONS = [
  { value: "instalacao", label: "Instalação ou compra de equipamento" },
  { value: "manutencao_corretiva", label: "Manutenção corretiva" },
  { value: "higienizacao", label: "Higienização e limpeza" },
  { value: "acj", label: "Ar-condicionado de janela (ACJ)" },
  { value: "remocao_reinstalacao", label: "Remoção, reinstalação ou mudança de endereço" },
  { value: "corporativo_b2b_pmoc", label: "Atendimento corporativo / B2B / PMOC" },
] as const;
const tipoDemandaSchema = z.enum(TIPO_DEMANDA_OPTIONS.map((option) => option.value) as [string, ...string[]]);

export const customerCreateSchema = z.object({
  tipoPessoa: z.enum(["fisica", "juridica"]).default("fisica"),
  nome: z.string().trim().min(2, "Informe o nome do cliente."),
  nomeFantasia: optionalText,
  telefone: optionalText,
  email: optionalText,
  documento: optionalText,
  empresa: optionalText,
  bairro: optionalText,
  cidade: optionalText,
  estado: optionalText,
  observacoes: optionalText,
  auvoContactId: optionalText,
});

export const customerUpdateSchema = customerCreateSchema.partial().refine((value) => Object.keys(value).length > 0, {
  message: "Informe ao menos um campo para atualizar.",
});

const opportunityBaseSchema = z.object({
  clienteId: uuid,
  titulo: z.string().trim().min(2, "Informe o titulo da oportunidade."),
  descricao: optionalText,
  tipoDemanda: tipoDemandaSchema,
  origem: optionalText,
  responsavelId: uuid,
  etapaId: uuid.optional().nullable(),
  situacao: z.string().trim().min(2, "Informe a situacao."),
  valorEstimado: moneyValue,
  valorOrcamento: moneyValue,
  proximaAcao: optionalText,
  proximaAcaoEm: optionalText,
  status: z.enum(["rascunho", "ativa", "ganha", "perdida", "arquivada"]).default("ativa"),
});

export const opportunityCreateSchema = opportunityBaseSchema
  .superRefine((value, context) => {
    if (value.status === "ativa" && (!value.responsavelId || !value.proximaAcao?.trim() || !value.proximaAcaoEm)) {
      context.addIssue({
        code: "custom",
        message: "Defina a proxima acao e a data antes de manter esta oportunidade ativa.",
        path: ["proximaAcao"],
      });
    }
  });

export const opportunityUpdateSchema = opportunityBaseSchema
  .partial()
  .extend({
    valorAprovado: moneyValue,
    formaPagamento: optionalText,
    quantidadeParcelas: z.coerce.number().int().positive().optional().nullable(),
    previsaoExecucao: optionalText,
    motivoPerdaId: uuid.optional().nullable(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "Informe ao menos um campo para atualizar.",
  });

export const approveOpportunitySchema = z.object({
  valorAprovado: z.coerce.number().int().positive("Informe o valor aprovado."),
  formaPagamento: z.string().trim().min(2, "Informe a forma de pagamento."),
  quantidadeParcelas: z.coerce.number().int().positive("Informe a quantidade de parcelas."),
  previsaoExecucao: z.string().trim().min(1, "Informe a previsao de execucao."),
});

export const loseOpportunitySchema = z.object({
  motivoPerdaId: uuid,
});

export const activityCreateSchema = z.object({
  customerId: uuid,
  opportunityId: uuid.optional().nullable(),
  type: z.enum([
    "note",
    "message",
    "call",
    "visit",
    "meeting",
    "follow_up",
    "quote_sent",
    "stage_change",
    "owner_change",
    "approval",
    "loss",
    "warranty",
    "support",
    "after_sales",
    "system",
  ]),
  title: optionalText,
  description: z.string().trim().min(2, "Informe a descricao da atividade."),
  occurredAt: optionalText,
  source: z.enum(["manual", "system"]).default("manual"),
  metadata: metadataSchema,
});

export const activityUpdateSchema = activityCreateSchema
  .omit({ customerId: true, opportunityId: true, source: true })
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "Informe ao menos um campo para atualizar.",
  });

export const addressCreateSchema = z.object({
  customerId: uuid,
  label: z.string().trim().min(2, "Informe um nome para o endereco."),
  kind: addressKindSchema.default("service"),
  street: optionalText,
  number: optionalText,
  complement: optionalText,
  neighborhood: optionalText,
  city: optionalText,
  state: optionalText,
  postalCode: optionalText,
  reference: optionalText,
  accessNotes: optionalText,
  isPrimary: z.boolean().default(false),
});

export const addressUpdateSchema = addressCreateSchema
  .omit({ customerId: true })
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "Informe ao menos um campo para atualizar.",
  });

export const equipmentCreateSchema = z.object({
  customerId: uuid,
  opportunityId: uuid.optional().nullable(),
  addressId: uuid.optional().nullable(),
  type: equipmentTypeSchema.default("other"),
  brand: optionalText,
  model: optionalText,
  btus: z.coerce.number().int().positive("Informe BTUs validos.").optional().nullable(),
  voltage: optionalText,
  environment: optionalText,
  serialNumber: optionalText,
  installedAt: optionalText,
  warrantyUntil: optionalText,
  notes: optionalText,
});

export const equipmentUpdateSchema = equipmentCreateSchema
  .omit({ customerId: true })
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "Informe ao menos um campo para atualizar.",
  });

const visitBaseSchema = z.object({
  customerId: uuid,
  opportunityId: uuid.optional().nullable(),
  addressId: uuid.optional().nullable(),
  scheduledStartAt: z.string().trim().min(1, "Informe a data da visita."),
  scheduledEndAt: optionalText,
  technicianUserId: uuid.optional().nullable(),
  status: visitStatusSchema.default("awaiting_confirmation"),
  objective: z.string().trim().min(2, "Informe o objetivo da visita."),
  accessNotes: optionalText,
  confirmationNotes: optionalText,
  result: optionalText,
  nextSteps: optionalText,
  equipmentIds: z.array(uuid).default([]),
});

function refineVisitScheduleAndStatus(value: {
  scheduledStartAt?: string;
  scheduledEndAt?: string | null;
  status?: string;
  result?: string | null;
  confirmationNotes?: string | null;
}, context: z.RefinementCtx): void {
    if (value.status === "completed" && !value.result?.trim()) {
      context.addIssue({ code: "custom", message: "Informe o resultado para concluir a visita.", path: ["result"] });
    }
    if (value.status === "cancelled" && !value.confirmationNotes?.trim() && !value.result?.trim()) {
      context.addIssue({ code: "custom", message: "Informe o motivo do cancelamento.", path: ["confirmationNotes"] });
    }
    if (value.scheduledStartAt && value.scheduledEndAt && new Date(value.scheduledEndAt).getTime() < new Date(value.scheduledStartAt).getTime()) {
      context.addIssue({ code: "custom", message: "O fim da visita deve ser depois do inicio.", path: ["scheduledEndAt"] });
    }
}

export const visitCreateSchema = visitBaseSchema.superRefine(refineVisitScheduleAndStatus);

export const visitUpdateSchema = visitBaseSchema
  .omit({ customerId: true })
  .partial()
  .superRefine(refineVisitScheduleAndStatus)
  .refine((value) => Object.keys(value).length > 0, {
    message: "Informe ao menos um campo para atualizar.",
  });

export const visitQuerySchema = z.object({
  customerId: uuid.optional(),
  opportunityId: uuid.optional(),
  from: z.string().trim().min(1).optional(),
  to: z.string().trim().min(1).optional(),
  status: visitStatusSchema.optional(),
  archived: z.enum(["true", "false"]).optional().transform((value) => value === "true"),
});

export const completeVisitSchema = z.object({
  result: z.string().trim().min(2, "Informe o resultado da visita."),
  nextSteps: optionalText,
});

export const cancelVisitSchema = z.object({
  reason: z.string().trim().min(2, "Informe o motivo do cancelamento."),
});

export const nextActionCreateSchema = z.object({
  customerId: uuid,
  opportunityId: uuid.optional().nullable(),
  responsibleUserId: uuid,
  category: nextActionCategorySchema.default("commercial"),
  title: z.string().trim().min(2, "Informe a proxima acao."),
  description: optionalText,
  dueAt: z.string().trim().min(1, "Informe a data da proxima acao."),
  priority: z.enum(["low", "normal", "high"]).default("normal"),
});

export const nextActionUpdateSchema = nextActionCreateSchema.partial().refine((value) => Object.keys(value).length > 0, {
  message: "Informe ao menos um campo para atualizar.",
});

export const completeNextActionSchema = z.object({
  completionResult: z.string().trim().min(2, "Informe o resultado da conclusao."),
  nextAction: nextActionCreateSchema.optional().nullable(),
});

export const postponeNextActionSchema = z.object({
  dueAt: z.string().trim().min(1, "Informe a nova data."),
});

export const cancelNextActionSchema = z.object({
  cancellationReason: z.string().trim().min(2, "Informe o motivo do cancelamento."),
  nextAction: nextActionCreateSchema.optional().nullable(),
});

export const commercialReportQuerySchema = z.object({
  from: optionalText,
  to: optionalText,
  responsibleUserId: uuid.optional(),
  origem: optionalText,
  tipoDemanda: optionalText,
  stageId: uuid.optional(),
});

export const commercialCenterQuerySchema = z.object({
  from: optionalText,
  to: optionalText,
  responsibleUserId: uuid.optional(),
  stageId: uuid.optional(),
  situation: optionalText,
  demandType: optionalText,
  category: nextActionCategorySchema.optional(),
  priority: z.enum(["low", "normal", "high"]).optional(),
});

export const notificationQuerySchema = z.object({
  status: notificationStatusSchema.optional(),
  type: notificationTypeSchema.optional(),
  severity: notificationSeveritySchema.optional(),
  from: optionalText,
  to: optionalText,
  limit: z.coerce.number().int().min(1).max(100).default(20),
  cursor: uuid.optional(),
});

export const notificationSnoozeSchema = z.object({
  snoozedUntil: z.string().trim().min(1, "Informe quando a notificacao deve reaparecer."),
});

export const auvoWebhookEventQuerySchema = z.object({
  status: auvoWebhookStatusSchema.optional(),
  eventType: optionalText,
  from: optionalText,
  to: optionalText,
  limit: z.coerce.number().int().min(1).max(100).default(20),
  cursor: uuid.optional(),
});

export const pipelineStageCreateSchema = z.object({
  nome: z.string().trim().min(2, "Informe o nome da etapa."),
  ordem: z.coerce.number().int().positive("Informe a ordem da etapa."),
});

export const pipelineStageUpdateSchema = z
  .object({
    nome: z.string().trim().min(2, "Informe o nome da etapa.").optional(),
    ordem: z.coerce.number().int().positive("Informe a ordem da etapa.").optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "Informe ao menos um campo para atualizar.",
  });

export const lossReasonCreateSchema = z.object({
  nome: z.string().trim().min(2, "Informe o nome do motivo de perda."),
});

export const lossReasonActiveSchema = z.object({
  isActive: z.boolean(),
});

const quoteStatusSchema = z.enum(["rascunho", "enviado", "revisado", "aprovado", "recusado", "expirado"]);

export const quoteCreateSchema = z.object({
  valor: z.coerce.number().int().positive("Informe o valor do orcamento."),
  resumo: optionalText,
});

export const quoteUpdateSchema = z
  .object({
    valor: z.coerce.number().int().positive("Informe o valor do orcamento.").optional(),
    resumo: optionalText,
    status: quoteStatusSchema.optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "Informe ao menos um campo para atualizar.",
  });

export const resolveAuvoInboxItemSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("create_opportunity"),
    clienteId: uuid,
    titulo: z.string().trim().min(2, "Informe o titulo da oportunidade."),
    tipoDemanda: tipoDemandaSchema,
    origem: optionalText,
    situacao: z.string().trim().min(2, "Informe a situacao."),
    proximaAcao: z.string().trim().min(2, "Informe a proxima acao."),
    proximaAcaoEm: z.string().trim().min(1, "Informe a data da proxima acao."),
    responsavelId: uuid,
  }),
  z.object({
    action: z.literal("link_opportunity"),
    opportunityId: uuid,
  }),
  z.object({
    action: z.literal("warranty"),
    clienteId: uuid,
    description: z.string().trim().min(2, "Informe a descricao."),
  }),
  z.object({
    action: z.literal("support"),
    clienteId: uuid,
    description: z.string().trim().min(2, "Informe a descricao."),
  }),
  z.object({
    action: z.literal("after_sales"),
    clienteId: uuid,
    description: z.string().trim().min(2, "Informe a descricao."),
  }),
  z.object({
    action: z.literal("customer_only"),
    clienteId: uuid,
  }),
  z.object({
    action: z.literal("not_commercial"),
    reason: optionalText,
  }),
  z.object({
    action: z.literal("duplicate"),
    reason: optionalText,
  }),
]);

export const membershipUpsertSchema = z.object({
  role: z.enum(["gestor", "vendedor", "atendimento"]),
  isActive: z.boolean().default(true),
});

export function normalizePhone(phone: string | null | undefined): string | null {
  const digits = phone?.replace(/\D/g, "") ?? "";
  if (!digits) return null;

  if (digits.startsWith("55") && digits.length > 11) {
    return digits;
  }

  return digits.length >= 10 ? `55${digits}` : digits;
}

export function assertActiveOpportunityHasNextAction(input: {
  status?: string | null;
  responsavelId?: string | null;
  proximaAcao?: string | null;
  proximaAcaoEm?: string | null;
}): void {
  if (input.status && input.status !== "ativa") return;

  if (!input.responsavelId || !input.proximaAcao?.trim() || !input.proximaAcaoEm) {
    throw new ApiError(422, "bad_request", "Defina a proxima acao e a data antes de manter esta oportunidade ativa.");
  }
}

export function parseBody<T>(schema: z.ZodType<T>, body: unknown): T {
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    throw new ApiError(400, "bad_request", parsed.error.issues[0]?.message ?? "Dados invalidos.");
  }

  return parsed.data;
}
