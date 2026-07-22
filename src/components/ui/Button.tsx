import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "destructive";

export function Button({ variant = "secondary", className, children, ...rest }: {
  variant?: ButtonVariant;
  children: ReactNode;
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  const classes = ["button", variant, className].filter(Boolean).join(" ");
  return (
    <button className={classes} {...rest}>
      {children}
    </button>
  );
}
