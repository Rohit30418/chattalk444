import { util } from 'peerjs';
import api from './api';

const REFRESH_SKEW_MS = 5 * 60 * 1000;

let configuredProvider = 'peerjs-default';
let expiresAtMs = 0;
let inFlight = null;

const hasValidIceServers = (value) => (
  Array.isArray(value)
  && value.some((server) => {
    if (!server || typeof server !== 'object') return false;
    if (typeof server.urls === 'string') return server.urls.length > 0;
    return Array.isArray(server.urls) && server.urls.some((url) => typeof url === 'string' && url.length > 0);
  })
);

const applyIceServers = (iceServers) => {
  if (!hasValidIceServers(iceServers)) return false;

  // PeerJS reads util.defaultConfig when each Peer instance is created.
  // Configure it before RoomMain mounts so every media/data connection uses
  // the managed ICE/TURN list returned by the authenticated backend.
  util.defaultConfig.iceServers = iceServers;
  return true;
};

export const configurePeerIceServers = async ({ force = false } = {}) => {
  const now = Date.now();

  if (!force && configuredProvider === 'cloudflare' && expiresAtMs - REFRESH_SKEW_MS > now) {
    return { provider: configuredProvider, turnAvailable: true };
  }

  if (inFlight) return inFlight;

  inFlight = (async () => {
    try {
      const { data } = await api.get('/api/social/webrtc/ice-servers', {
        timeout: 8000,
      });

      if (data?.turnAvailable && applyIceServers(data.iceServers)) {
        configuredProvider = data.provider || 'cloudflare';
        const parsedExpiry = Date.parse(data.expiresAt || '');
        expiresAtMs = Number.isFinite(parsedExpiry)
          ? parsedExpiry
          : now + (60 * 60 * 1000);

        return {
          provider: configuredProvider,
          turnAvailable: true,
          expiresAt: data.expiresAt || null,
        };
      }

      // During setup, keep PeerJS' existing ICE defaults instead of replacing
      // them with a weaker STUN-only configuration.
      configuredProvider = 'peerjs-default';
      expiresAtMs = 0;
      return { provider: configuredProvider, turnAvailable: false };
    } catch (error) {
      console.warn(
        '[WebRTC] Managed TURN unavailable; keeping PeerJS ICE defaults:',
        error?.userMessage || error?.message || error
      );
      configuredProvider = 'peerjs-default';
      expiresAtMs = 0;
      return { provider: configuredProvider, turnAvailable: false };
    } finally {
      inFlight = null;
    }
  })();

  return inFlight;
};

export default configurePeerIceServers;
