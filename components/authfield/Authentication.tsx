import { LucideIcon } from "lucide-react";
import { InputHTMLAttributes } from "react";

interface AuthFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon: LucideIcon;
}

export default function AuthField({ label, icon: Icon, value, onChange, ...props }: AuthFieldProps) {
  return (
    <div className="mb-5">
      <label className="mb-2 block text-sm font-medium text-neutral-800">
        {label}
      </label>
      <div className="flex items-center gap-3 rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3.5 focus-within:border-red-400 focus-within:ring-2 focus-within:ring-red-100 transition">
        <Icon className="h-4 w-4 shrink-0 text-neutral-400" strokeWidth={2} />
        <input
          value={value}
          onChange={onChange}
          {...props}
          className="w-full bg-transparent text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none"
        />
      </div>
    </div>
  );
}