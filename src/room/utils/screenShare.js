// Own one capture request and one server lease. Never publish without approval.
export const createScreenShareSession = ({ capture, publish, release, onError, stopTracks }) => {
  let current = null;
  let capturePending = false;
  let sequence = 0;
  const cancel = (notify = true) => {
    const attempt = current;
    if (!attempt) return;
    current = null;
    clearTimeout(attempt.timer);
    stopTracks(attempt.stream);
    if (notify) release(attempt.id);
  };
  const publishIfReady = (attempt) => {
    if (current !== attempt || !attempt.approved || !attempt.stream || attempt.published) return;
    attempt.published = true;
    publish(attempt.stream);
  };
  return {
    start() {
      if (current || capturePending) return null;
      const attempt = { id: `${Date.now()}-${++sequence}`, approved: false, stream: null, published: false };
      current = attempt;
      capturePending = true;
      // Run getDisplayMedia synchronously inside the user's click gesture.
      let promise;
      try { promise = capture(); } catch (error) { promise = Promise.reject(error); }
      attempt.timer = setTimeout(() => {
        if (current !== attempt) return;
        cancel();
        onError(new Error('Screen sharing approval timed out. Please try again.'));
      }, 15000);
      Promise.resolve(promise).then((stream) => {
        if (current !== attempt) { stopTracks(stream); return; }
        if (!stream?.getVideoTracks?.().some((track) => track.readyState !== 'ended')) {
          stopTracks(stream);
          throw new Error('No screen video track was selected.');
        }
        attempt.stream = stream;
        stream.getVideoTracks()[0].addEventListener('ended', () => {
          if (current === attempt) cancel();
        }, { once: true });
        publishIfReady(attempt);
      }).catch((error) => {
        if (current !== attempt) return;
        cancel();
        onError(error);
      }).finally(() => { capturePending = false; });
      return attempt.id;
    },
    approve(id) {
      if (!current || current.id !== id) return;
      current.approved = true;
      clearTimeout(current.timer);
      publishIfReady(current);
    },
    deny(id) {
      if (!current || current.id !== id) return false;
      cancel(false);
      return true;
    },
    cancel,
  };
};
