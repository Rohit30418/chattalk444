import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../auth/AppWrapper';
import api from '../../services/api';
import {
  requestVaaniNotifications,
  syncPushSubscription,
} from '../../services/pwa';

const formatLastUsed = (value) => {
  if (!value) return 'Recently';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Recently';

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
};

const getCurrentEndpoint = async () => {
  if (!('serviceWorker' in navigator)) return '';

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager?.getSubscription?.();
    return subscription?.endpoint || '';
  } catch {
    return '';
  }
};

const NotificationDevicesManager = () => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busyDeviceId, setBusyDeviceId] = useState('');
  const [currentEndpoint, setCurrentEndpoint] = useState('');
  const [permission, setPermission] = useState(
    typeof Notification === 'undefined' ? 'unsupported' : Notification.permission
  );

  const currentDevice = useMemo(
    () => devices.find((device) => device.isCurrent) || null,
    [devices]
  );

  const loadDevices = useCallback(async ({ ensureCurrent = true } = {}) => {
    if (!user?.uid) return;

    setLoading(true);
    try {
      if (ensureCurrent && Notification.permission === 'granted') {
        await syncPushSubscription().catch(() => {});
      }

      const endpoint = await getCurrentEndpoint();
      setCurrentEndpoint(endpoint);
      setPermission(Notification.permission);

      const { data } = await api.get('/api/social/push/devices', {
        params: endpoint ? { currentEndpoint: endpoint } : undefined,
      });

      setDevices(Array.isArray(data?.devices) ? data.devices : []);
    } catch (error) {
      console.warn('[PWA] Could not load notification devices:', error?.message || error);
      toast.error('Could not load notification devices');
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    if (!open || !user?.uid) return;
    loadDevices();
  }, [loadDevices, open, user?.uid]);

  const openManager = () => {
    setOpen(true);
  };

  const registerThisDevice = async () => {
    setLoading(true);
    try {
      const result = await requestVaaniNotifications();
      setPermission(result.permission);

      if (result.permission !== 'granted') {
        toast.info('Allow Vaani notifications in your browser settings first');
        return;
      }

      if (!result.subscribed) {
        toast.error('Could not register this device yet');
        return;
      }

      toast.success('This device is registered for Vaani notifications');
      await loadDevices({ ensureCurrent: false });
    } finally {
      setLoading(false);
    }
  };

  const testDevice = async (device) => {
    if (!device?.id) return;

    setBusyDeviceId(device.id);
    try {
      const { data } = await api.post(
        `/api/social/push/devices/${encodeURIComponent(device.id)}/test`
      );

      if (data?.sent > 0 && data?.failed === 0) {
        toast.success(`Test sent to ${device.label}`);
      } else {
        toast.error(`Push failed on ${device.label}`);
        await loadDevices({ ensureCurrent: false });
      }
    } catch (error) {
      toast.error(error?.userMessage || 'Could not send test notification');
    } finally {
      setBusyDeviceId('');
    }
  };

  const removeDevice = async (device) => {
    if (!device?.id || device.isCurrent) return;

    const shouldRemove = window.confirm(
      `Remove ${device.label} from Vaani notifications?`
    );
    if (!shouldRemove) return;

    setBusyDeviceId(device.id);
    try {
      await api.delete(`/api/social/push/devices/${encodeURIComponent(device.id)}`);
      setDevices((current) => current.filter((item) => item.id !== device.id));
      toast.success('Notification device removed');
    } catch (error) {
      toast.error(error?.userMessage || 'Could not remove notification device');
    } finally {
      setBusyDeviceId('');
    }
  };

  if (!user?.uid) return null;

  return (
    <>
      <button
        type="button"
        onClick={openManager}
        className="fixed bottom-20 right-4 z-[205] flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-lg transition hover:-translate-y-0.5 hover:text-indigo-600 dark:border-white/10 dark:bg-[#101626] dark:text-slate-200 dark:hover:text-indigo-300 sm:bottom-5 sm:right-5"
        title="Notification devices"
        aria-label="Manage notification devices"
      >
        <i className="fa-solid fa-mobile-screen-button text-sm" aria-hidden="true" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[260] flex items-end justify-center bg-slate-950/60 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="notification-devices-title"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setOpen(false);
          }}
        >
          <div className="max-h-[88vh] w-full max-w-lg overflow-hidden rounded-t-[1.75rem] border border-slate-200 bg-white shadow-2xl dark:border-white/10 dark:bg-[#0b1120] sm:rounded-[1.75rem]">
            <div className="flex items-start justify-between border-b border-slate-200 px-5 py-4 dark:border-white/10">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">
                  <i className="fa-solid fa-bell text-sm" aria-hidden="true" />
                </span>
                <div>
                  <h2
                    id="notification-devices-title"
                    className="text-base font-black text-slate-950 dark:text-white"
                  >
                    Notification devices
                  </h2>
                  <p className="mt-1 text-xs font-medium leading-5 text-slate-500 dark:text-slate-400">
                    See every browser registered for your Vaani push notifications.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/10 dark:hover:text-white"
                aria-label="Close notification devices"
              >
                <i className="fa-solid fa-xmark" aria-hidden="true" />
              </button>
            </div>

            <div className="max-h-[calc(88vh-150px)] overflow-y-auto px-5 py-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-slate-50 p-3 dark:bg-white/[0.04]">
                <div>
                  <p className="text-xs font-black text-slate-900 dark:text-white">
                    This browser
                  </p>
                  <p className="mt-0.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    {permission === 'granted'
                      ? currentDevice
                        ? 'Registered and ready for push'
                        : currentEndpoint
                          ? 'Push exists locally; syncing with Vaani'
                          : 'Permission allowed, device not registered yet'
                      : permission === 'denied'
                        ? 'Notifications are blocked in browser settings'
                        : 'Notifications are not enabled yet'}
                  </p>
                </div>

                {!currentDevice && permission !== 'denied' && permission !== 'unsupported' && (
                  <button
                    type="button"
                    onClick={registerThisDevice}
                    disabled={loading}
                    className="rounded-xl bg-indigo-600 px-3 py-2 text-[11px] font-black text-white disabled:opacity-50"
                  >
                    <i className="fa-solid fa-bell mr-1.5" aria-hidden="true" />
                    Register this device
                  </button>
                )}
              </div>

              <div className="mb-3 flex items-center justify-between">
                <p className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-400">
                  Registered devices ({devices.length})
                </p>
                <button
                  type="button"
                  onClick={() => loadDevices()}
                  disabled={loading}
                  className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[11px] font-black text-indigo-600 hover:bg-indigo-50 disabled:opacity-50 dark:text-indigo-300 dark:hover:bg-indigo-500/10"
                >
                  <i
                    className={`fa-solid fa-rotate-right ${loading ? 'fa-spin' : ''}`}
                    aria-hidden="true"
                  />
                  Refresh
                </button>
              </div>

              {loading && devices.length === 0 ? (
                <div className="flex justify-center py-10 text-slate-400">
                  <i className="fa-solid fa-spinner fa-spin text-xl" aria-hidden="true" />
                </div>
              ) : devices.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 px-5 py-9 text-center dark:border-white/10">
                  <i className="fa-solid fa-bell-slash text-xl text-slate-300 dark:text-slate-600" aria-hidden="true" />
                  <p className="mt-3 text-sm font-black text-slate-900 dark:text-white">
                    No devices registered yet
                  </p>
                  <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                    Register this browser, then repeat on your Android phone.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {devices.map((device) => {
                    const busy = busyDeviceId === device.id;
                    const mobile = device.icon === 'mobile';

                    return (
                      <div
                        key={device.id}
                        className="rounded-2xl border border-slate-200 p-4 dark:border-white/10 dark:bg-white/[0.025]"
                      >
                        <div className="flex items-start gap-3">
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 dark:bg-white/[0.07] dark:text-slate-300">
                            <i
                              className={`fa-solid ${mobile ? 'fa-mobile-screen-button' : 'fa-desktop'} text-sm`}
                              aria-hidden="true"
                            />
                          </span>

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="truncate text-sm font-black text-slate-950 dark:text-white">
                                {device.label}
                              </p>
                              {device.isCurrent && (
                                <span className="rounded-full bg-emerald-50 px-2 py-1 text-[9px] font-black uppercase tracking-wider text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                                  This device
                                </span>
                              )}
                            </div>
                            <p className="mt-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                              Last synced {formatLastUsed(device.lastUsedAt)}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2 pl-0 sm:pl-13">
                          <button
                            type="button"
                            onClick={() => testDevice(device)}
                            disabled={Boolean(busyDeviceId)}
                            className="rounded-xl bg-indigo-600 px-3 py-2 text-[11px] font-black text-white disabled:opacity-50"
                          >
                            <i
                              className={`fa-solid ${busy ? 'fa-spinner fa-spin' : 'fa-paper-plane'} mr-1.5`}
                              aria-hidden="true"
                            />
                            Send test
                          </button>

                          {!device.isCurrent && (
                            <button
                              type="button"
                              onClick={() => removeDevice(device)}
                              disabled={Boolean(busyDeviceId)}
                              className="rounded-xl border border-red-200 px-3 py-2 text-[11px] font-black text-red-600 disabled:opacity-50 dark:border-red-400/20 dark:text-red-300"
                            >
                              <i className="fa-regular fa-trash-can mr-1.5" aria-hidden="true" />
                              Remove
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default NotificationDevicesManager;
