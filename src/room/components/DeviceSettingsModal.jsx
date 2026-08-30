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
        className="fixed inset-0 z-[80] bg-black/35"
        onClick={onClose}
      />

      <section
        className="fixed left-1/2 top-1/2 z-[90] w-[min(92vw,32rem)] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)]"
        style={{ animation: 'roomPopIn 0.18s ease-out' }}
      >
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-4">
          <div>
            <h2 className="text-lg font-black text-[var(--color-text)]">Device settings</h2>
            <p className="mt-0.5 text-xs text-[var(--color-soft)]">Switch microphone and camera while staying in the room.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-muted)] hover:bg-[var(--color-primary-soft)]"
            aria-label="Close"
          >
            <i className="fa-solid fa-times text-xs" />
          </button>
        </div>

        <div className="space-y-5 p-5">
          <label className="block">
            <span className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-[var(--color-soft)]">Microphone</span>
            <select
              value={selectedAudioDeviceId || ''}
              onChange={(event) => onChangeAudioDevice?.(event.target.value)}
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 py-3 text-sm font-semibold text-[var(--color-text)] outline-none focus:border-[var(--color-secondary)]"
            >
              <option value="">Default microphone</option>
              {devices.audio.map((device, index) => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label || `Microphone ${index + 1}`}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-[var(--color-soft)]">Camera</span>
            <select
              value={selectedVideoDeviceId || ''}
              onChange={(event) => onChangeVideoDevice?.(event.target.value)}
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 py-3 text-sm font-semibold text-[var(--color-text)] outline-none focus:border-[var(--color-secondary)]"
            >
              <option value="">Default camera</option>
              {devices.video.map((device, index) => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label || `Camera ${index + 1}`}
                </option>
              ))}
            </select>
          </label>

          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-primary-soft)] p-4 text-xs leading-6 text-[var(--color-muted)]">
            Browser speaker output selection is limited on Safari and Firefox. Camera and microphone switching works best on Chrome or Edge.
          </div>
        </div>
      </section>
    </>
  );
});

export default DeviceSettingsModal;
