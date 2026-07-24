export function formatDateTime(value: string | null): string {
  if (!value) return "";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}

// "Vencida há 2 dias" / "Vencida há 3h" — usa overdueHours ja calculado no backend
// (server/crm/prisma-repository.ts) em vez de recalcular no cliente, evitando
// divergencia de fuso entre o calculo do servidor e o relogio do navegador.
export function formatOverdueLabel(overdueHours: number): string {
  if (overdueHours < 1) return "Vencida agora";
  if (overdueHours < 24) return `Vencida há ${overdueHours}h`;
  const days = Math.floor(overdueHours / 24);
  return `Vencida há ${days} dia${days === 1 ? "" : "s"}`;
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

const ADDRESS_KIND_LABELS: Record<string, string> = {
  service: "Atendimento",
  billing: "Cobranca",
  pickup: "Retirada",
  installation: "Instalacao",
  other: "Outro",
};

export function formatAddressKind(kind: string): string {
  return ADDRESS_KIND_LABELS[kind] ?? kind;
}

const EQUIPMENT_TYPE_LABELS: Record<string, string> = {
  split_hi_wall: "Split hi-wall",
  cassette: "Cassete",
  window_ac: "Janela / ACJ",
  floor_ceiling: "Piso-teto",
  multi_split: "Multi split",
  other: "Outro",
};

export function formatEquipmentType(type: string): string {
  return EQUIPMENT_TYPE_LABELS[type] ?? type;
}

const VISIT_STATUS_LABELS: Record<string, string> = {
  draft: "Rascunho",
  awaiting_confirmation: "Aguardando confirmacao",
  confirmed: "Confirmada",
  completed: "Concluida",
  cancelled: "Cancelada",
  no_show: "No-show",
};

export function formatVisitStatus(status: string): string {
  return VISIT_STATUS_LABELS[status] ?? status;
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
