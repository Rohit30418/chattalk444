import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './components/AppBody/Header';
import RoomsPremiumPopup from './components/AppBody/RoomsPremiumPopup';
import Footer from './components/common/Footer';
import MobileBottomNav from './components/common/MobileBottomNav';
import useMobilePwaMode from './hooks/useMobilePwaMode';
import { ScrollToHash } from './ScrollToID';

const Layout = () => {
  const isMobilePwa = useMobilePwaMode();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 transition-colors duration-300 dark:bg-[#050713] dark:text-white">
      <Header />
      <ScrollToHash />

      <main
        className={
          isMobilePwa
            ? 'h-[100dvh] min-h-0 overflow-y-auto pt-[68px] pb-[calc(68px+env(safe-area-inset-bottom))]'
            : 'min-h-screen'
        }
      >
        <Outlet />
      </main>

      {!isMobilePwa && <Footer />}
      <RoomsPremiumPopup />
      <MobileBottomNav />
    </div>
  );
};

export default Layout;
