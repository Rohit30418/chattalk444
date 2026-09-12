import { useEffect, useRef, useState } from 'react';
import { getProfileBanner } from '../../utils/memberAssets';

/*
 * Historical filename kept to avoid touching every import. The component now
 * renders animated WebP banners with <img>, not video/WebM.
 */
const MemberBannerVideo = ({ bannerId, className = '', eager = false }) => {
  const banner = getProfileBanner(bannerId);
  const rootRef = useRef(null);
  const [shouldLoad, setShouldLoad] = useState(eager);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [banner.id]);

  useEffect(() => {
    if (eager) {
      setShouldLoad(true);
      return undefined;
    }

    const element = rootRef.current;
    if (!element || !('IntersectionObserver' in window)) {
      setShouldLoad(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { rootMargin: '180px' }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [banner.id, eager]);

  return (
    <div
      ref={rootRef}
      className={`relative overflow-hidden bg-[linear-gradient(120deg,#071b2b,#0f766e_55%,#312e81)] ${className}`}
      aria-hidden="true"
    >
      {shouldLoad && !failed && (
        <>
          {/* Fill the wide profile area without stretching the detailed layer. */}
          <img
            src={banner.src}
            alt=""
            loading={eager ? 'eager' : 'lazy'}
            decoding="async"
            fetchPriority={eager ? 'high' : 'auto'}
            onError={() => setFailed(true)}
            className="absolute inset-0 h-full w-full scale-110 object-cover opacity-65 blur-2xl"
          />

          {/* Keep the original artwork sharp and uncropped in the foreground. */}
          <img
            src={banner.src}
            alt=""
            loading={eager ? 'eager' : 'lazy'}
            decoding="async"
            fetchPriority={eager ? 'high' : 'auto'}
            onError={() => setFailed(true)}
            className="absolute inset-0 h-full w-full object-contain"
          />
        </>
      )}
    </div>
  );
};

export default MemberBannerVideo;
