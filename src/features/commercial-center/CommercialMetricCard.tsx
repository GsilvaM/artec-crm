import type { ReactNode } from "react";

type MetricTone = "neutral" | "danger" | "warning" | "informative";

export function CommercialMetricCard({ label, value, icon, tone = "neutral", onClick }: {
  label: string;
  value: number;
  icon: ReactNode;
  tone?: MetricTone;
  onClick?: () => void;
}) {
  const toneClass = tone === "neutral" ? "" : ` commercial-metric-card-${tone}`;
  return (
    <button type="button" className={`commercial-metric-card${toneClass}`} onClick={onClick} disabled={!onClick}>
      <span className="commercial-metric-card-icon" aria-hidden="true">{icon}</span>
      <span className="commercial-metric-card-body">
        <span className="commercial-metric-card-value">{value}</span>
        <span className="commercial-metric-card-label">{label}</span>
      </span>
    </button>
  );
}
