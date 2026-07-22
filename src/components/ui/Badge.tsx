import type { ReactNode } from "react";

type BadgeTone = "neutral" | "warning" | "danger" | "alert-danger" | "alert-warning";

const TONE_CLASS: Record<BadgeTone, string> = {
  neutral: "",
  warning: "warning",
  danger: "danger-badge",
  "alert-danger": "badge-alert-danger",
  "alert-warning": "badge-alert-warning",
};

export function Badge({ tone = "neutral", children }: { tone?: BadgeTone; children: ReactNode }) {
  const classes = ["badge", TONE_CLASS[tone]].filter(Boolean).join(" ");
  return <span className={classes}>{children}</span>;
}
