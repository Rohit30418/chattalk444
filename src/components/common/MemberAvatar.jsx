import { useMemo, useState } from 'react';
import { getProfileDecoration } from '../../utils/memberAssets';

const getInitials = (name = 'Vaani User') => (
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'VU'
);

const MemberAvatar = ({
  user,
  src,
  name,
  isMember,
  profileDecorationId,
  profileAnimationId,
  className = 'h-10 w-10',
  avatarClassName = '',
  roundedClass = 'rounded-full',
  fallbackClassName = 'bg-teal-700 text-white',
  loading = 'lazy',
  decoding = 'async',
  referrerPolicy = 'no-referrer',
  alt,
  showDecoration = true,
}) => {
  const [failed, setFailed] = useState(false);

  const finalName = name || user?.displayName || user?.name || 'Vaani User';
  const finalSrc = src || user?.photoURL || user?.photo || user?.avatar || '';
  const member = isMember ?? user?.isMember === true;
  const decoration = useMemo(
    () => getProfileDecoration(
      profileDecorationId || user?.profileDecorationId,
      profileAnimationId || user?.profileAnimationId
    ),
    [profileAnimationId, profileDecorationId, user?.profileAnimationId, user?.profileDecorationId]
  );

  const decorated = Boolean(member && showDecoration && decoration?.src);
  const innerSize = decorated ? 'absolute inset-[11%] h-[78%] w-[78%]' : 'h-full w-full';

  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center overflow-visible ${className}`}
      aria-label={finalName}
    >
      {finalSrc && !failed ? (
        <img
          src={finalSrc}
          alt={alt || finalName}
          loading={loading}
          decoding={decoding}
          referrerPolicy={referrerPolicy}
          onError={() => setFailed(true)}
          className={`${innerSize} ${roundedClass} border border-slate-200 bg-slate-100 object-cover dark:border-white/10 dark:bg-slate-800 ${avatarClassName}`}
        />
      ) : (
        <span
          className={`${innerSize} ${roundedClass} flex items-center justify-center text-[0.72em] font-black ${fallbackClassName} ${avatarClassName}`}
        >
          {getInitials(finalName)}
        </span>
      )}

      {decorated && (
        <img
          src={decoration.src}
          alt=""
          aria-hidden="true"
          loading={loading}
          decoding={decoding}
          className="vaani-avatar-decoration pointer-events-none absolute inset-0 z-20 h-full w-full select-none object-contain"
        />
      )}
    </span>
  );
};

export default MemberAvatar;
