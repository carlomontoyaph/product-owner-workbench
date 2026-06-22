import { Icon } from "./Icons";

interface SecLabelProps {
  icon?: string;
  children: React.ReactNode;
  count?: number;
}

export function SecLabel({ icon, children, count }: SecLabelProps) {
  return (
    <div className="sec-label">
      {icon && (
        <span style={{ color: "var(--faint)", display: "grid", placeItems: "center" }}>
          <Icon name={icon} size={13} />
        </span>
      )}
      <span className="eyebrow">{children}</span>
      {count != null && <span className="sec-count">{count}</span>}
    </div>
  );
}
