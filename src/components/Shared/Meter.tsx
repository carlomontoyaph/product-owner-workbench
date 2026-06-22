import { Tooltip } from "./Tooltip";

interface MeterProps {
  label: string;
  value: number;
  max?: number;
  suffix?: string;
  tone?: "green" | "amber" | "accent";
  tooltip?: string;
}

export function Meter({ label, value, max = 100, suffix = "", tone = "accent", tooltip }: MeterProps) {
  const pct = Math.round((value / max) * 100);
  return (
    <div>
      <div className="meter-row">
        <span className="meter-label">{label}{tooltip && <Tooltip text={tooltip} />}</span>
        <span className="meter-val">{value}{suffix}</span>
      </div>
      <div className="meter">
        <div className={`meter-fill ${tone}`} style={{ width: pct + "%" }} />
      </div>
    </div>
  );
}
