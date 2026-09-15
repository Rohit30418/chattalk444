import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from './components/AppBody/Header';
import RoomsPremiumPopup from './components/AppBody/RoomsPremiumPopup';
import Footer from './components/common/Footer';
import MobileBottomNav from './components/common/MobileBottomNav';
import useMobilePwaMode from './hooks/useMobilePwaMode';
import { ScrollToHash } from './ScrollToID';

const Layout = () => {
  const isMobilePwa = useMobilePwaMode();
  const { pathname } = useLocation();

  const isProfilePage = pathname.startsWith('/profile/') || pathname.startsWith('/MyProfile/');
  const pwaProfileOffset = isMobilePwa && isProfilePage ? 'pt-[70px]' : '';

  return (
    <div className="min-h-screen bg-slate-50 pb-20 text-slate-950 transition-colors duration-300 dark:bg-[#050713] dark:text-white lg:pb-0">
      <Header />
      <ScrollToHash />

      <main className={`min-h-screen ${pwaProfileOffset}`}>
        <Outlet />
      </main>

      {!isMobilePwa && <Footer />}
      <RoomsPremiumPopup />
      <MobileBottomNav />
    </div>
  );
};

export default Layout;
