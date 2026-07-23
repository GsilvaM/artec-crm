import { forwardRef } from "react";
import type { ButtonHTMLAttributes, ReactNode } from "react";

export const IconButton = forwardRef<HTMLButtonElement, {
  label: string;
  badge?: ReactNode;
  children: ReactNode;
} & ButtonHTMLAttributes<HTMLButtonElement>>(function IconButton({ label, badge, className, children, ...rest }, ref) {
  const classes = ["icon-button", className].filter(Boolean).join(" ");
  return (
    <button ref={ref} className={classes} type="button" aria-label={label} {...rest}>
      {children}
      {badge != null ? <span>{badge}</span> : null}
    </button>
  );
});
