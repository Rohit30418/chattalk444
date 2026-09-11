import React from 'react';
import HomeBody from './HomeBody';
import SocialNav from '../social/SocialNav';

const Mainbody = () => {
  return (
    <div className="min-h-screen">
      <SocialNav />
      <HomeBody />
    </div>
  );
};

export default Mainbody;
