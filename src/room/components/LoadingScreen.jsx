const LoadingScreen = ({ roomTitle = 'Meeting Room' }) => (
  <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-6 bg-[#050713] p-8 text-center text-white">
    <div className="relative">
      <div className="h-20 w-20 rounded-full border-4 border-blue-500/20 border-t-blue-400 animate-spin" />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="h-10 w-10 rounded-full border-4 border-violet-500/20 border-b-violet-400 animate-spin" />
      </div>
    </div>
    <div>
      <h2 className="text-2xl font-black text-white">Entering {roomTitle}…</h2>
      <p className="mt-2 text-sm text-slate-500">Setting up camera, microphone, and secure room connection</p>
    </div>
  </div>
);

export default LoadingScreen;
