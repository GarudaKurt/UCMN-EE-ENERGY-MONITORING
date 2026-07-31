
interface StatusIndicatorProps {
  alert: boolean;
}

export default function StatusIndicator({ alert }: StatusIndicatorProps) {
  return (
    <div
      className={
        alert
          ? "inline-flex items-center gap-2 rounded-full bg-red-50 px-4 py-1.5 text-sm font-semibold text-red-600"
          : "inline-flex items-center gap-2 rounded-full bg-green-50 px-4 py-1.5 text-sm font-semibold text-green-600"
      }
    >
      <span className="relative flex h-2.5 w-2.5">
        <span
          className={
            alert
              ? "absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75"
              : "absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-75"
          }
        />
        <span
          className={
            alert
              ? "relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500"
              : "relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500"
          }
        />
      </span>
      {alert ? "SOS Alert Triggered" : "Patient is Stable"}
    </div>
  );
}