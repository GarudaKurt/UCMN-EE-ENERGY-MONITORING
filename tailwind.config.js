// Add this into the `theme.extend` section of your existing tailwind.config.js/ts
// (don't replace your whole config — merge these keys into what's already there)

module.exports = {
  theme: {
    extend: {
      keyframes: {
        "sos-ring": {
          "0%": { transform: "scale(0.75)", opacity: "0.55" },
          "100%": { transform: "scale(1.9)", opacity: "0" },
        },
        "sos-ring-fast": {
          "0%": { transform: "scale(0.85)", opacity: "0.75" },
          "100%": { transform: "scale(1.7)", opacity: "0" },
        },
        "sos-pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(220, 38, 38, 0.55)" },
          "50%": { boxShadow: "0 0 0 18px rgba(220, 38, 38, 0)" },
        },
      },
      animation: {
        "sos-ring": "sos-ring 2.6s ease-out infinite",
        "sos-ring-fast": "sos-ring-fast 1.1s ease-out infinite",
        "sos-pulse-glow": "sos-pulse-glow 1s ease-in-out infinite",
      },
    },
  },
};