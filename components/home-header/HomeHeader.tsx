
import { Bell } from "lucide-react";

interface HomeHeaderProps {
  name: string;
  hasNotification?: boolean;
  onBellClick?: () => void;
}

export default function HomeHeader({ name, hasNotification, onBellClick }: HomeHeaderProps) {
  return (
    <div className="flex items-start justify-between px-5 pt-4">
      <div>
        <p className="text-sm text-neutral-400">Hey!</p>
        <p className="text-xl font-bold text-neutral-900">{name}</p>
      </div>

      <button
        type="button"
        onClick={onBellClick}
        aria-label="Notifications"
        className="relative rounded-full p-1 text-neutral-700 hover:bg-neutral-100"
      >
        <Bell className="h-6 w-6" strokeWidth={1.75} />
        {hasNotification && (
          <span className="absolute right-0.5 top-0.5 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white" />
        )}
      </button>
    </div>
  );
}