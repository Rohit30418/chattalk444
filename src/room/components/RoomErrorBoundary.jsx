import React from 'react';

class RoomErrorBoundary extends React.Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('[RoomErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center gap-6 bg-[#050713] p-8 text-center text-white">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-red-500/15 text-red-300 ring-1 ring-red-400/20">
            <i className="fas fa-triangle-exclamation text-3xl" />
          </div>
          <div>
            <h2 className="text-2xl font-black">Something went wrong</h2>
            <p className="mt-2 max-w-sm text-sm leading-6 text-slate-400">
              A rendering error occurred. Please rejoin the meeting.
            </p>
          </div>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-2xl bg-white px-6 py-3 text-sm font-black text-slate-950 shadow-xl transition hover:scale-[1.02] active:scale-[0.98]"
          >
            Rejoin Room
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default RoomErrorBoundary;
