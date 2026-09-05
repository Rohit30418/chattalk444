import React, { memo } from 'react';

const GradientSpinner = memo(() => {
  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-[var(--color-bg)]/95"
      role="status"
      aria-live="polite"
      aria-label="Loading"
    >
      <div className="flex flex-col items-center gap-3">
        <div
          className="h-9 w-9 animate-spin rounded-full border-[3px] border-[var(--color-border)] border-t-[var(--color-primary)] motion-reduce:animate-none"
          aria-hidden="true"
        />

        <span className="text-xs font-semibold tracking-wide text-[var(--color-soft)]">
          Loading...
        </span>
      </div>
    </div>
  );
});

GradientSpinner.displayName = 'GradientSpinner';

export default GradientSpinner;
