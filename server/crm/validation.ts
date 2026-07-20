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
  tipoDemanda: z.string().trim().min(2, "Informe o tipo de demanda."),
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
