import { memo } from 'react';

const DeviceSettingsModal = memo(({
  show,
  devices,
  selectedAudioDeviceId,
  selectedVideoDeviceId,
  onClose,
  onChangeAudioDevice,
  onChangeVideoDevice,
}) => {
  if (!show) return null;

  return (
    <>
      <button
        type="button"
        aria-label="Close device settings"
        className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <section
        className="fixed left-1/2 top-1/2 z-[90] w-[min(92vw,32rem)] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[2rem] border border-white/10 bg-[#080d1c]/95 text-white shadow-2xl backdrop-blur-2xl"
        style={{ animation: 'roomPopIn 0.18s ease-out' }}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div>
            <h2 className="text-lg font-black">Device settings</h2>
            <p className="mt-0.5 text-xs text-slate-500">Switch microphone and camera while staying in the room.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/8 text-slate-300 hover:bg-white/12"
            aria-label="Close"
          >
            <i className="fa-solid fa-times text-xs" />
          </button>
        </div>

        <div className="space-y-5 p-5">
          <label className="block">
            <span className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-slate-500">Microphone</span>
            <select
              value={selectedAudioDeviceId || ''}
              onChange={(event) => onChangeAudioDevice?.(event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-sm font-semibold text-white outline-none focus:border-blue-400"
            >
              <option value="" className="text-slate-900">Default microphone</option>
              {devices.audio.map((device, index) => (
                <option key={device.deviceId} value={device.deviceId} className="text-slate-900">
                  {device.label || `Microphone ${index + 1}`}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-slate-500">Camera</span>
            <select
              value={selectedVideoDeviceId || ''}
              onChange={(event) => onChangeVideoDevice?.(event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-sm font-semibold text-white outline-none focus:border-blue-400"
            >
              <option value="" className="text-slate-900">Default camera</option>
              {devices.video.map((device, index) => (
                <option key={device.deviceId} value={device.deviceId} className="text-slate-900">
                  {device.label || `Camera ${index + 1}`}
                </option>
              ))}
            </select>
          </label>

          <div className="rounded-2xl bg-blue-500/10 p-4 text-xs leading-6 text-blue-200 ring-1 ring-blue-400/20">
            Browser speaker output selection is limited on Safari and Firefox. Camera and microphone switching works best on Chrome or Edge.
          </div>
        </div>
      </section>
    </>
  );
});

export default DeviceSettingsModal;
