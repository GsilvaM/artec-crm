export function formatDateTime(value: string | null): string {
  if (!value) return "";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}

export function formatMoney(valueInCents: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valueInCents / 100);
}

export function formatPercent(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "percent", maximumFractionDigits: 1 }).format(value);
}

const ACTIVITY_TYPE_LABELS: Record<string, string> = {
  note: "Observação",
  message: "Mensagem",
  call: "Ligação",
  visit: "Visita",
  meeting: "Reunião",
  follow_up: "Follow-up",
  quote_sent: "Orçamento enviado",
  stage_change: "Mudança de etapa",
  owner_change: "Mudança de responsável",
  approval: "Aprovação",
  loss: "Perda",
  warranty: "Garantia",
  support: "Suporte",
  after_sales: "Pós-venda",
  system: "Sistema",
};

export function formatActivityType(type: string): string {
  return ACTIVITY_TYPE_LABELS[type] ?? type;
}

const NEXT_ACTION_STATUS_LABELS: Record<string, string> = {
  pending: "Pendente",
  completed: "Concluída",
  cancelled: "Cancelada",
};

export function formatNextActionStatus(status: string): string {
  return NEXT_ACTION_STATUS_LABELS[status] ?? status;
}

const OPPORTUNITY_STATUS_LABELS: Record<string, string> = {
  rascunho: "Rascunho",
  ativa: "Ativa",
  ganha: "Aprovada",
  perdida: "Perdida",
  arquivada: "Arquivada",
};

export function formatOpportunityStatus(status: string): string {
  return OPPORTUNITY_STATUS_LABELS[status] ?? status;
}

// Cores semanticas do kit Venture (Background/Content Positive|Informative|Error
// — ver docs/FIGMA-DESIGN-SYSTEM-MAPPING.md) aplicadas ao status da oportunidade,
// usado em toda superficie que lista oportunidades (Funil, ficha do cliente,
// lista e ficha da oportunidade) para leitura visual consistente do estado.
const OPPORTUNITY_STATUS_BADGE_CLASS: Record<string, string> = {
  ativa: "badge-informative",
  ganha: "badge-positive",
  perdida: "badge-danger-soft",
};

export function opportunityStatusBadgeClass(status: string): string {
  return OPPORTUNITY_STATUS_BADGE_CLASS[status] ?? "";
}

const CRM_ROLE_LABELS: Record<string, string> = {
  gestor: "Gestor",
  vendedor: "Vendedor",
  atendimento: "Atendimento",
};

export function formatCrmRole(role: string): string {
  return CRM_ROLE_LABELS[role] ?? role;
}
