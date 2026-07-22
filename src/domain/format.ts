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

const CRM_ROLE_LABELS: Record<string, string> = {
  gestor: "Gestor",
  vendedor: "Vendedor",
  atendimento: "Atendimento",
};

export function formatCrmRole(role: string): string {
  return CRM_ROLE_LABELS[role] ?? role;
}
