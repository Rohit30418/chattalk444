import React, { memo } from "react";

// Optimization 1: Wrapped in React.memo so the loading screen doesn't continuously re-render 
// if background data loading causes the parent app component to update.
const Loading = memo(() => {
  return (
    // Optimization 2: Removed `backdrop-blur-xl`. Rendering a full-screen blur over a complex app 
    // is incredibly expensive. Replaced with a slightly more opaque solid color (`/90`) to achieve 
    // a similar focus effect without the massive GPU tax. Added `transform-gpu`.
    <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden bg-[var(--color-bg)]/90 transform-gpu">

      {/* Optimization 3: Completely removed `blur-3xl`. 
          Animating CSS blur forces constant layout repaints. Replaced with mathematically 
          identical radial-gradients. Animating the opacity of a gradient via `animate-pulse` 
          combined with `transform-gpu` is virtually free for the graphics card. */}
      <div className="absolute w-80 h-80 rounded-full bg-[radial-gradient(circle,rgba(20,184,166,0.15)_0%,transparent_70%)] animate-pulse transform-gpu"></div>
      <div className="absolute w-72 h-72 rounded-full bg-[radial-gradient(circle,rgba(14,165,233,0.15)_0%,transparent_70%)] animate-pulse transform-gpu"></div>

      <div className="relative flex flex-col items-center gap-5">

        {/* Premium Spinner */}
        <div className="relative w-20 h-20">

          {/* Glass Ring */}
          <div className="absolute inset-0 rounded-full border border-[var(--color-border)]"></div>

          {/* Rotating Ring */}
          {/* Optimization 4: Added transform-gpu to explicitly hardware-accelerate the spin rotation */}
          <div className="absolute inset-0 animate-spin transform-gpu">
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
            /* Optimization 5: Added transform-gpu to offload the pulse scaling/opacity calculation */
            className="absolute inset-4 rounded-full animate-pulse transform-gpu"
            style={{
              background:
                "linear-gradient(135deg,var(--color-primary),var(--color-secondary),var(--color-accent))",
              boxShadow: "0 0 40px rgba(15,118,110,.35)",
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
});

Loading.displayName = "Loading";

export default Loading;