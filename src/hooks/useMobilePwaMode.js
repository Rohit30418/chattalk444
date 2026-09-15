import { useEffect, useState } from 'react';
import { isStandalonePwa } from '../services/pwa';

const MOBILE_WIDTH_QUERY = '(max-width: 900px)';
const COARSE_POINTER_QUERY = '(pointer: coarse)';

const looksLikeMobileDevice = () => {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;

  if (navigator.userAgentData?.mobile === true) return true;

  const ua = navigator.userAgent || '';
  if (/Android|iPhone|iPad|iPod|IEMobile|Opera Mini|Mobile/i.test(ua)) return true;

  return Boolean(
    window.matchMedia?.(MOBILE_WIDTH_QUERY).matches
    && window.matchMedia?.(COARSE_POINTER_QUERY).matches
  );
};

export const getMobilePwaMode = () => {
  if (typeof window === 'undefined') return false;
  return Boolean(isStandalonePwa() && looksLikeMobileDevice());
};

const useMobilePwaMode = () => {
  const [enabled, setEnabled] = useState(getMobilePwaMode);

  useEffect(() => {
    const widthQuery = window.matchMedia?.(MOBILE_WIDTH_QUERY);
    const pointerQuery = window.matchMedia?.(COARSE_POINTER_QUERY);
    const standaloneQuery = window.matchMedia?.('(display-mode: standalone)');

    const update = () => setEnabled(getMobilePwaMode());

    widthQuery?.addEventListener?.('change', update);
    pointerQuery?.addEventListener?.('change', update);
    standaloneQuery?.addEventListener?.('change', update);
    window.addEventListener('resize', update);
    window.addEventListener('appinstalled', update);

    update();

    return () => {
      widthQuery?.removeEventListener?.('change', update);
      pointerQuery?.removeEventListener?.('change', update);
      standaloneQuery?.removeEventListener?.('change', update);
      window.removeEventListener('resize', update);
      window.removeEventListener('appinstalled', update);
    };
  }, []);

  return enabled;
};

export default useMobilePwaMode;
