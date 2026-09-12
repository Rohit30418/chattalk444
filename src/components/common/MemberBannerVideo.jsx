import { useEffect, useState } from 'react';
import { getProfileBanner } from '../../utils/memberAssets';

const cache = new Map();

const decodeBase64Video = (text) => {
  const binary = window.atob(text.trim());
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return URL.createObjectURL(new Blob([bytes], { type: 'video/webm' }));
};

const MemberBannerVideo = ({ bannerId, className = '', eager = false }) => {
  const banner = getProfileBanner(bannerId);
  const [src, setSrc] = useState(cache.get(banner.id) || '');

  useEffect(() => {
    let cancelled = false;
    if (cache.has(banner.id)) {
      setSrc(cache.get(banner.id));
      return undefined;
    }

    fetch(`${banner.src}.b64.txt`)
      .then((response) => {
        if (!response.ok) throw new Error('Banner asset not found');
        return response.text();
      })
      .then((text) => {
        if (cancelled) return;
        const objectUrl = decodeBase64Video(text);
        cache.set(banner.id, objectUrl);
        setSrc(objectUrl);
      })
      .catch(() => {
        if (!cancelled) setSrc('');
      });

    return () => {
      cancelled = true;
    };
  }, [banner.id, banner.src]);

  if (!src) {
    return <div className={`bg-[linear-gradient(120deg,#071b2b,#0f766e_55%,#312e81)] ${className}`} />;
  }

  return (
    <video
      src={src}
      autoPlay
      muted
      loop
      playsInline
      preload={eager ? 'auto' : 'metadata'}
      aria-hidden="true"
      className={className}
    />
  );
};

export default MemberBannerVideo;
