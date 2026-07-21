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
  note: "Observacao",
  message: "Mensagem",
  call: "Ligacao",
  visit: "Visita",
  meeting: "Reuniao",
  follow_up: "Follow-up",
  quote_sent: "Orcamento enviado",
  stage_change: "Mudanca de etapa",
  owner_change: "Mudanca de responsavel",
  approval: "Aprovacao",
  loss: "Perda",
  warranty: "Garantia",
  support: "Suporte",
  after_sales: "Pos-venda",
  system: "Sistema",
};

export function formatActivityType(type: string): string {
  return ACTIVITY_TYPE_LABELS[type] ?? type;
}
