import React from 'react';
import Hero from './Hero';
import FeaturedLanguages from './FeaturedLanguages';
import ActiveRooms from './ActiveRooms';
import HowItWorks from './HowItWorks';
import AiUnlockSection from './AiUnlockSection';
import Testimonials from './Testimonials';
import SupportedBy from './SupportedBy';

const DeferredPaint = ({ children, size = '760px' }) => (
  <div
    style={{
      contentVisibility: 'auto',
      containIntrinsicSize: size,
    }}
  >
    {children}
  </div>
);

const HomePage = () => {
  return (
    <div>
      <Hero />

      <DeferredPaint size="700px">
        <FeaturedLanguages />
      </DeferredPaint>

      <DeferredPaint size="900px">
        <ActiveRooms />
      </DeferredPaint>

      <DeferredPaint size="800px">
        <HowItWorks />
      </DeferredPaint>

      <DeferredPaint size="980px">
        <AiUnlockSection />
      </DeferredPaint>

      <DeferredPaint size="700px">
        <Testimonials />
      </DeferredPaint>

      <DeferredPaint size="620px">
        <SupportedBy />
      </DeferredPaint>
    </div>
  );
};

export default HomePage;
