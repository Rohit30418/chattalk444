import Peer from 'peerjs';
import socket from './socket';

const INSTALL_FLAG = '__vaaniPeerAutoReconnectInstalled';
const stateByPeer = new WeakMap();

const getCurrentRoomId = () => {
  const match = window.location.pathname.match(/^\/room\/([^/?#]+)/i);
  return match ? decodeURIComponent(match[1]) : '';
};

const requestRoomSync = (delay = 0) => {
  window.setTimeout(() => {
    const roomId = getCurrentRoomId();
    if (!roomId || !socket.connected) return;
    socket.emit('request-room-sync', { roomId });
  }, delay);
};

const getConnections = (peer) => {
  const groups = peer?.connections ? Object.values(peer.connections) : [];
  return groups.flatMap((group) => (Array.isArray(group) ? group : []));
};

const connectionState = (connection) => {
  const pc = connection?.peerConnection;
  return {
    connection: pc?.connectionState || '',
    ice: pc?.iceConnectionState || '',
  };
};

const cleanupStaleConnections = (peer, forceDisconnected = false) => {
  let closedAny = false;
  const now = Date.now();

  getConnections(peer).forEach((connection) => {
    const pc = connection?.peerConnection;
    if (!pc) return;

    const { connection: pcState, ice: iceState } = connectionState(connection);
    const failed = ['failed', 'closed'].includes(pcState)
      || ['failed', 'closed'].includes(iceState);
    const disconnected = pcState === 'disconnected' || iceState === 'disconnected';

    if (disconnected) {
      connection.__vaaniDisconnectedAt ||= now;
    } else {
      delete connection.__vaaniDisconnectedAt;
    }

    const disconnectedTooLong = disconnected
      && (forceDisconnected || now - Number(connection.__vaaniDisconnectedAt || now) > 6000);

    if (!failed && !disconnectedTooLong) return;

    try {
      connection.close?.();
      closedAny = true;
    } catch (error) {
      console.warn('[Peer recovery] Failed to close stale connection:', error?.message || error);
    }
  });

  if (closedAny) requestRoomSync(250);
  return closedAny;
};

const isRecoverablePeerError = (error) => [
  'network',
  'server-error',
  'socket-error',
  'disconnected-browser',
].includes(error?.type);

export const installPeerAutoReconnect = () => {
  if (typeof window === 'undefined' || Peer[INSTALL_FLAG]) return;
  Peer[INSTALL_FLAG] = true;

  const originalReconnect = Peer.prototype.reconnect;
  const originalCall = Peer.prototype.call;
  const originalConnect = Peer.prototype.connect;
  const originalDestroy = Peer.prototype.destroy;

  const clearRetry = (state) => {
    if (state.retryTimer) {
      window.clearTimeout(state.retryTimer);
      state.retryTimer = null;
    }
  };

  const teardownState = (peer) => {
    const state = stateByPeer.get(peer);
    if (!state) return;

    clearRetry(state);
    if (state.monitorTimer) window.clearInterval(state.monitorTimer);
    window.removeEventListener('online', state.onOnline);
    document.removeEventListener('visibilitychange', state.onVisibilityChange);
    stateByPeer.delete(peer);
  };

  const ensureState = (peer) => {
    const existing = stateByPeer.get(peer);
    if (existing) return existing;

    const state = {
      attempt: 0,
      retryTimer: null,
      monitorTimer: null,
      hadDisconnected: false,
      reconnectInProgress: false,
      onOnline: null,
      onVisibilityChange: null,
    };

    const scheduleReconnect = (immediate = false) => {
      if (peer.destroyed || peer.open) {
        clearRetry(state);
        state.attempt = 0;
        state.reconnectInProgress = false;
        return;
      }

      clearRetry(state);

      const delay = immediate
        ? 0
        : Math.min(8000, 700 * (2 ** Math.min(state.attempt, 4)));

      state.retryTimer = window.setTimeout(() => {
        state.retryTimer = null;

        if (peer.destroyed || peer.open) return;

        if (navigator.onLine === false) {
          state.attempt = Math.min(state.attempt + 1, 6);
          scheduleReconnect(false);
          return;
        }

        try {
          state.reconnectInProgress = true;
          originalReconnect.call(peer);
        } catch (error) {
          // PeerJS can throw while an earlier reconnect attempt is still opening.
          // Keep retrying with backoff instead of surfacing an app error.
          console.warn('[Peer recovery] reconnect attempt:', error?.message || error);
        }

        state.attempt = Math.min(state.attempt + 1, 6);

        // If no `open` event arrives, retry again. A successful open clears this timer.
        scheduleReconnect(false);
      }, delay);
    };

    peer.on('open', (peerId) => {
      const recovered = state.hadDisconnected || state.reconnectInProgress || state.attempt > 0;

      clearRetry(state);
      state.attempt = 0;
      state.hadDisconnected = false;
      state.reconnectInProgress = false;

      if (!recovered) return;

      // Keep healthy WebRTC calls. Drop only failed/stuck ones so the normal
      // room-participants sync in useRoomController can create fresh calls.
      cleanupStaleConnections(peer, true);
      requestRoomSync(150);

      window.dispatchEvent(new CustomEvent('vaani-peer-reconnected', {
        detail: { peerId },
      }));
    });

    peer.on('disconnected', () => {
      state.hadDisconnected = true;
      scheduleReconnect(true);
    });

    peer.on('error', (error) => {
      if (!isRecoverablePeerError(error)) return;
      state.hadDisconnected = true;
      scheduleReconnect(false);
    });

    state.onOnline = () => {
      if (peer.destroyed) return;

      if (!peer.open) {
        state.hadDisconnected = true;
        scheduleReconnect(true);
      } else {
        cleanupStaleConnections(peer, true);
        requestRoomSync(200);
      }
    };

    state.onVisibilityChange = () => {
      if (document.visibilityState !== 'visible' || peer.destroyed) return;

      if (!peer.open) {
        state.hadDisconnected = true;
        scheduleReconnect(true);
        return;
      }

      // Mobile browsers can suspend WebRTC while backgrounded. Re-check calls
      // when the room becomes visible again and rebuild only broken links.
      cleanupStaleConnections(peer, false);
      requestRoomSync(250);
    };

    window.addEventListener('online', state.onOnline);
    document.addEventListener('visibilitychange', state.onVisibilityChange);

    state.monitorTimer = window.setInterval(() => {
      if (peer.destroyed) {
        teardownState(peer);
        return;
      }

      if (!peer.open) {
        if (navigator.onLine !== false) scheduleReconnect(false);
        return;
      }

      cleanupStaleConnections(peer, false);
    }, 3000);

    state.scheduleReconnect = scheduleReconnect;
    stateByPeer.set(peer, state);
    return state;
  };

  Peer.prototype.reconnect = function vaaniReconnect(...args) {
    const state = ensureState(this);

    if (this.destroyed) return undefined;
    if (this.open) return undefined;

    state.hadDisconnected = true;
    state.scheduleReconnect(true);
    return undefined;
  };

  Peer.prototype.call = function vaaniCall(...args) {
    ensureState(this);
    return originalCall.apply(this, args);
  };

  Peer.prototype.connect = function vaaniConnect(...args) {
    ensureState(this);
    return originalConnect.apply(this, args);
  };

  Peer.prototype.destroy = function vaaniDestroy(...args) {
    teardownState(this);
    return originalDestroy.apply(this, args);
  };
};

export default installPeerAutoReconnect;
