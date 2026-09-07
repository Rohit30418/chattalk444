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
    <div className="vaani-home">
      <style>{`
        .vaani-home {
          font-size: 15px;
        }

        .vaani-home h1 {
          font-size: clamp(2.65rem, 5vw, 4rem) !important;
          font-weight: 800 !important;
          letter-spacing: -0.045em !important;
          line-height: 1.08 !important;
        }

        .vaani-home h2 {
          font-size: clamp(1.85rem, 3.1vw, 2.55rem) !important;
          font-weight: 800 !important;
          letter-spacing: -0.035em !important;
          line-height: 1.12 !important;
        }

        .vaani-home h1 + p {
          font-size: clamp(0.95rem, 1.2vw, 1.05rem) !important;
          line-height: 1.72 !important;
        }

        .vaani-home h2 + p {
          font-size: 0.95rem !important;
          line-height: 1.7 !important;
        }

        .vaani-home article h3 {
          font-size: clamp(1rem, 1.2vw, 1.15rem) !important;
          line-height: 1.28 !important;
          letter-spacing: -0.025em !important;
        }

        .vaani-home #pricing article h3 {
          font-size: 1.25rem !important;
        }

        .vaani-home > section:first-of-type a {
          font-size: 0.925rem !important;
        }

        @media (max-width: 640px) {
          .vaani-home h1 {
            font-size: 2.4rem !important;
            letter-spacing: -0.04em !important;
          }

          .vaani-home h2 {
            font-size: 1.8rem !important;
          }

          .vaani-home h1 + p,
          .vaani-home h2 + p {
            font-size: 0.925rem !important;
            line-height: 1.65 !important;
          }
        }
      `}</style>

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
