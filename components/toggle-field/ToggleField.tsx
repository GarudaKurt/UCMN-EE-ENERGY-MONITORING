
import { InputHTMLAttributes } from "react";

interface ToggleFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export default function ToggleField({ label, className, ...props }: ToggleFieldProps) {
  return (
    <label className="mb-5 flex items-center justify-between rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3.5">
      <span className="text-sm font-medium text-neutral-800">{label}</span>
      <span className="relative inline-flex h-6 w-11 shrink-0 items-center">
        <input
          type="checkbox"
          {...props}
          className="peer sr-only"
        />
        <span className="absolute inset-0 rounded-full bg-neutral-300 transition peer-checked:bg-red-500" />
        <span className="absolute left-0.5 h-5 w-5 rounded-full bg-white shadow transition peer-checked:translate-x-5" />
      </span>
    </label>
  );
}