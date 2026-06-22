import { Icon } from "./Icons";

interface BadgeProps {
  variant?: "neutral" | "ready" | "review" | "risk-med" | "risk-high" | "risk-low" | "info" | "accent";
  icon?: string;
  children: React.ReactNode;
}

export function Badge({ variant = "neutral", icon, children }: BadgeProps) {
  return (
    <span className={`badge ${variant}`}>
      {icon && <span className="ico"><Icon name={icon} size={11} /></span>}
      {children}
    </span>
  );
}
