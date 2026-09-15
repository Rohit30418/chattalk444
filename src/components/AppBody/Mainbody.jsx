import React from 'react';
import HomeBody from './HomeBody';
import SocialNav from '../social/SocialNav';
import useMobilePwaMode from '../../hooks/useMobilePwaMode';

const Mainbody = () => {
  const isMobilePwa = useMobilePwaMode();

  return (
    <div className="min-h-screen">
      <SocialNav />
      <div className={isMobilePwa ? '-mt-[86px]' : ''}>
        <HomeBody />
      </div>
    </div>
  );
};

export default Mainbody;
