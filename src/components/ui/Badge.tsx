import type { ReactNode } from "react";

type BadgeTone =
  | "neutral"
  | "warning"
  | "danger"
  | "danger-soft"
  | "positive"
  | "informative"
  | "purple"
  | "brand"
  | "discovery"
  | "critical"
  | "alert-danger"
  | "alert-warning";

const TONE_CLASS: Record<BadgeTone, string> = {
  neutral: "",
  warning: "warning",
  danger: "danger-badge",
  "danger-soft": "badge-danger-soft",
  positive: "badge-positive",
  informative: "badge-informative",
  purple: "badge-purple",
  brand: "badge-purple",
  discovery: "badge-purple",
  critical: "badge-alert-danger",
  "alert-danger": "badge-alert-danger",
  "alert-warning": "badge-alert-warning",
};

export function Badge({ tone = "neutral", className, children }: { tone?: BadgeTone; className?: string; children: ReactNode }) {
  const classes = ["badge", TONE_CLASS[tone], className].filter(Boolean).join(" ");
  return <span className={classes}>{children}</span>;
}
