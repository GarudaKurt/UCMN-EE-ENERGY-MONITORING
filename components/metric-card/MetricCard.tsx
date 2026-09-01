import { LucideIcon } from "lucide-react";

interface MetricCardProps {
  icon: LucideIcon;
  label: string;
  value: number;
  unit: string;
  accent: string;
  dim?: boolean;
}

export default function MetricCard({ icon: Icon, label, value, unit, accent, dim }: MetricCardProps) {
  return (
    <div
      className="flex flex-1 flex-col gap-2 rounded-xl bg-white px-3 py-3 shadow-sm transition-opacity"
      style={{ opacity: dim ? 0.5 : 1 }}
    >
      <Icon size={16} strokeWidth={2} style={{ color: accent }} />
      <div>
        <p className="text-lg font-semibold leading-none text-neutral-900">
          {value.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          <span className="ml-1 text-xs font-medium text-neutral-400">{unit}</span>
        </p>
        <p className="mt-1 text-xs text-neutral-500">{label}</p>
      </div>
    </div>
  );
}