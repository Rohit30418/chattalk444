import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './components/AppBody/Header';
import Footer from './components/common/Footer';
import { ScrollToHash } from './ScrollToID';
const Layout = () => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 transition-colors duration-300 dark:bg-[#050713] dark:text-white">
      <Header />
      <ScrollToHash />
      <main className="min-h-screen">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
