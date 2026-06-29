import React from "react";

const Loading = () => {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden bg-[var(--color-bg)]/80 backdrop-blur-xl">

      {/* Ambient Glow */}
      <div className="absolute w-80 h-80 rounded-full bg-teal-500/10 blur-3xl animate-pulse"></div>
      <div className="absolute w-72 h-72 rounded-full bg-sky-500/10 blur-3xl animate-pulse"></div>

      <div className="relative flex flex-col items-center gap-5">

        {/* Premium Spinner */}
        <div className="relative w-20 h-20">

          {/* Glass Ring */}
          <div className="absolute inset-0 rounded-full border border-[var(--color-border)]"></div>

          {/* Rotating Ring */}
          <div className="absolute inset-0 animate-spin">
            <div
              className="w-full h-full rounded-full border-[3px] border-transparent"
              style={{
                borderTopColor: "var(--color-primary)",
                borderRightColor: "var(--color-secondary)",
                borderBottomColor: "var(--color-accent)",
              }}
            />
          </div>

          {/* Center Orb */}
          <div
            className="absolute inset-4 rounded-full animate-pulse"
            style={{
              background:
                "linear-gradient(135deg,var(--color-primary),var(--color-secondary),var(--color-accent))",
              boxShadow:
                "0 0 40px rgba(15,118,110,.35)",
            }}
          />
        </div>

        {/* Brand Text */}
        <div className="text-center">
          <h3
            className="font-black text-lg tracking-tight"
            style={{
              background:
                "linear-gradient(90deg,var(--color-primary),var(--color-secondary),var(--color-accent))",
              WebkitBackgroundClip: "text",
              color: "transparent",
            }}
          >
            VAANI
          </h3>

          <p className="text-xs uppercase tracking-[0.3em] text-[var(--color-soft)] mt-1">
            Preparing Experience
          </p>
        </div>
      </div>
    </div>
  );
};

export default Loading;