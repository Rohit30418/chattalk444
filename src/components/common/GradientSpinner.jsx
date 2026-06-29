import React from "react";

const GradientSpinner = () => {
  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-[var(--color-bg)]/80 backdrop-blur-xl">

      <div className="relative flex items-center justify-center">

        {/* Outer Glow */}
        <div
          className="absolute w-28 h-28 rounded-full blur-3xl animate-pulse"
          style={{
            background:
              "radial-gradient(circle, rgba(15,118,110,.25), rgba(2,132,199,.15), transparent 70%)",
          }}
        />

        {/* Spinner */}
        <div className="relative w-16 h-16">

          {/* Track */}
          <div
            className="absolute inset-0 rounded-full border-[3px]"
            style={{
              borderColor: "var(--color-border)",
            }}
          />

          {/* Animated Arc */}
          <div
            className="absolute inset-0 rounded-full border-[3px] border-transparent animate-spin"
            style={{
              borderTopColor: "var(--color-primary)",
              borderRightColor: "var(--color-secondary)",
            }}
          />

          {/* Inner Ring */}
          <div
            className="absolute inset-2 rounded-full border"
            style={{
              borderColor: "rgba(52,211,153,.25)",
            }}
          />

          {/* Center Core */}
          <div
            className="absolute top-1/2 left-1/2 w-3 h-3 -translate-x-1/2 -translate-y-1/2 rounded-full animate-pulse"
            style={{
              background:
                "linear-gradient(135deg,var(--color-primary),var(--color-accent))",
              boxShadow:
                "0 0 20px rgba(15,118,110,.45), 0 0 40px rgba(52,211,153,.25)",
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default GradientSpinner;