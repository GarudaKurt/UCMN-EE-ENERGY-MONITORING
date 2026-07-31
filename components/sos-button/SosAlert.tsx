
interface SosButtonProps {
  active: boolean;
  onPress: () => void;
}

export default function SosButton({ active, onPress }: SosButtonProps) {
  // Stable: same spreading-ring animation as SOS, in green — non-interactive,
  // since this state is fully driven by Supabase (`hasFall = false`).
  if (!active) {
    return (
      <div
        role="status"
        aria-live="polite"
        aria-label="Patient is stable"
        className="relative flex h-72 w-72 items-center justify-center"
      >
        <span className="absolute inset-0 rounded-full bg-green-400/40 animate-[ping_1s_ease-out_infinite]" />
        <span className="absolute inset-0 rounded-full bg-green-400/30 animate-[ping_1s_ease-out_infinite] [animation-delay:0.35s]" />
        <span className="absolute inset-0 rounded-full bg-green-400/20 animate-[ping_1s_ease-out_infinite] [animation-delay:0.7s]" />

        <span className="relative z-10 flex h-44 w-44 items-center justify-center rounded-full bg-green-500 text-lg font-extrabold tracking-wide text-white shadow-xl animate-[stable-glow_1.6s_ease-in-out_infinite]">
          Stable
        </span>
      </div>
    );
  }

  // Active/emergency: the red pulsing SOS circle — still tappable to cancel.
  return (
    <div className="relative flex h-72 w-72 items-center justify-center">
      <span className="absolute inset-0 rounded-full bg-red-400/40 animate-[ping_1s_ease-out_infinite]" />
      <span className="absolute inset-0 rounded-full bg-red-400/30 animate-[ping_1s_ease-out_infinite] [animation-delay:0.35s]" />
      <span className="absolute inset-0 rounded-full bg-red-400/20 animate-[ping_1s_ease-out_infinite] [animation-delay:0.7s]" />

      <button
        type="button"
        onClick={onPress}
        className="relative z-10 flex h-44 w-44 flex-col items-center justify-center rounded-full bg-red-600 text-lg font-extrabold tracking-wide text-white shadow-xl transition-transform active:scale-95 animate-[sos-glow_1s_ease-in-out_infinite]"
      >
        <span>SOS</span>
        <span className="mt-1 text-[11px] font-semibold uppercase tracking-widest">
          Tap when help is done.
        </span>
      </button>
    </div>
  );
}