import { useEffect, useState } from 'react';
import api from '../../services/api';
import MemberBannerVideo from './MemberBannerVideo';

const ProfilePremiumCover = ({ userId }) => {
  const [member, setMember] = useState(null);

  useEffect(() => {
    let active = true;
    if (!userId) return undefined;

    api.get(`/api/users/${encodeURIComponent(userId)}`)
      .then(({ data }) => {
        if (active) setMember(data?.isMember ? data : null);
      })
      .catch(() => {
        if (active) setMember(null);
      });

    return () => { active = false; };
  }, [userId]);

  if (!member) return null;

  return (
    <div className="pointer-events-none fixed left-0 top-16 -z-10 h-0 w-0 overflow-hidden" aria-hidden="true">
      <MemberBannerVideo bannerId={member.profileBannerId} />
    </div>
  );
};

export default ProfilePremiumCover;
