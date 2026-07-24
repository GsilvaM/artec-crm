export type AuvoMatchCustomer = {
  id: string;
  name: string;
  phoneNormalized: string | null;
  email: string | null;
  auvoContactId: string | null;
};

export type AuvoMatchSignal = {
  auvoContactId: string;
  contactName: string | null;
  phoneNormalized: string | null;
  email: string | null;
  lastInteractionAt: string | null;
};

export type AuvoCustomerMatchConfidence = "alta" | "media" | "baixa";

export type AuvoCustomerMatchCandidate = {
  customerId: string;
  customerName: string;
  auvoContactId: string;
  contactName: string | null;
  score: number;
  confidence: AuvoCustomerMatchConfidence;
  reasons: string[];
  blockers: string[];
};

export type AuvoCustomerMatchReport = {
  scannedCustomers: number;
  scannedSignals: number;
  candidates: AuvoCustomerMatchCandidate[];
  highConfidence: number;
  needsReview: number;
  blocked: number;
};

export function buildAuvoCustomerMatchReport(customers: AuvoMatchCustomer[], signals: AuvoMatchSignal[]): AuvoCustomerMatchReport {
  const customerPhoneCounts = countBy(customers.map((customer) => customer.phoneNormalized).filter(isPresent));
  const signalPhoneCounts = countBy(signals.map((signal) => signal.phoneNormalized).filter(isPresent));
  const customerEmailCounts = countBy(customers.map((customer) => normalizeEmail(customer.email)).filter(isPresent));
  const signalEmailCounts = countBy(signals.map((signal) => normalizeEmail(signal.email)).filter(isPresent));

  const candidates = customers
    .flatMap((customer) =>
      signals
        .map((signal) => scoreAuvoCustomerMatch(customer, signal, {
          customerPhoneCount: customer.phoneNormalized ? customerPhoneCounts.get(customer.phoneNormalized) ?? 0 : 0,
          signalPhoneCount: signal.phoneNormalized ? signalPhoneCounts.get(signal.phoneNormalized) ?? 0 : 0,
          customerEmailCount: customer.email ? customerEmailCounts.get(normalizeEmail(customer.email) ?? "") ?? 0 : 0,
          signalEmailCount: signal.email ? signalEmailCounts.get(normalizeEmail(signal.email) ?? "") ?? 0 : 0,
        }))
        .filter(isPresent),
    )
    .sort((a, b) => b.score - a.score || a.customerName.localeCompare(b.customerName));

  return {
    scannedCustomers: customers.length,
    scannedSignals: signals.length,
    candidates,
    highConfidence: candidates.filter((candidate) => candidate.confidence === "alta" && !candidate.blockers.length).length,
    needsReview: candidates.filter((candidate) => candidate.confidence !== "alta" && !candidate.blockers.length).length,
    blocked: candidates.filter((candidate) => candidate.blockers.length > 0).length,
  };
}

function scoreAuvoCustomerMatch(
  customer: AuvoMatchCustomer,
  signal: AuvoMatchSignal,
  counts: { customerPhoneCount: number; signalPhoneCount: number; customerEmailCount: number; signalEmailCount: number },
): AuvoCustomerMatchCandidate | null {
  const reasons: string[] = [];
  const blockers: string[] = [];
  let score = 0;

  if (customer.auvoContactId && customer.auvoContactId !== signal.auvoContactId) return null;
  if (customer.auvoContactId === signal.auvoContactId) {
    score += 100;
    reasons.push("auvo_contact_id_exato");
  }

  if (customer.phoneNormalized && signal.phoneNormalized && customer.phoneNormalized === signal.phoneNormalized) {
    score += 80;
    reasons.push("telefone_exato");
    if (counts.customerPhoneCount > 1) blockers.push("telefone_duplicado_no_crm");
    if (counts.signalPhoneCount > 1) blockers.push("telefone_duplicado_no_auvo");
  }

  const customerEmail = normalizeEmail(customer.email);
  const signalEmail = normalizeEmail(signal.email);
  if (customerEmail && signalEmail && customerEmail === signalEmail) {
    score += 60;
    reasons.push("email_exato");
    if (counts.customerEmailCount > 1) blockers.push("email_duplicado_no_crm");
    if (counts.signalEmailCount > 1) blockers.push("email_duplicado_no_auvo");
  }

  if (namesLookRelated(customer.name, signal.contactName)) {
    score += 15;
    reasons.push("nome_compativel");
  }

  if (!score) return null;
  const normalizedScore = Math.min(100, score);
  return {
    customerId: customer.id,
    customerName: customer.name,
    auvoContactId: signal.auvoContactId,
    contactName: signal.contactName,
    score: normalizedScore,
    confidence: normalizedScore >= 80 ? "alta" : normalizedScore >= 60 ? "media" : "baixa",
    reasons,
    blockers: [...new Set(blockers)],
  };
}

function namesLookRelated(customerName: string, contactName: string | null): boolean {
  const left = normalizeName(customerName);
  const right = normalizeName(contactName ?? "");
  if (!left || !right) return false;
  return left.includes(right) || right.includes(left) || left.split(" ").some((part) => part.length >= 4 && right.includes(part));
}

function normalizeName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function normalizeEmail(value: string | null): string | null {
  const normalized = value?.trim().toLowerCase();
  return normalized || null;
}

function countBy(values: string[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return counts;
}

function isPresent<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}
