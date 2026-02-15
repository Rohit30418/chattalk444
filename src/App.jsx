import React, { Suspense, lazy } from 'react';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ToastContainer } from 'react-toastify';

import { store } from './store';
import AppWrapper from './components/auth/AppWrapper';
import Layout from './Layout';
import DeleteRoom from "./features/DeleteRoom"; // Fixed pathing
import GradientSpinner from './components/common/GradientSpinner';

// 1. Lazy Imports
const HomePage = lazy(() => import('./Home/HomePage'));
const Mainbody = lazy(() => import('./components/AppBody/Mainbody'));
const Room = lazy(() => import('./components/rooms/Room'));
const MyProfile = lazy(() => import('./components/AppBody/MyProfile'));
const AiCharacter = lazy(() => import('./components/ai/AiCharacter'));

// 2. Improved Suspense Wrapper (Component-based)
const SuspenseLayout = ({ children }) => (
  <Suspense fallback={<GradientSpinner />}>
    {children}
  </Suspense>
);

// 3. Router Configuration
const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />, 
    children: [
      {
        index: true,
        element: <SuspenseLayout><HomePage /></SuspenseLayout>
      },
      {
        path: "rooms",
        element: <SuspenseLayout><Mainbody /></SuspenseLayout>
      }
    ]
  },
  {
    path: "/room/:id", // Changed to lowercase
    element: <SuspenseLayout><Room /></SuspenseLayout>
  },
  {
    path: "/profile/:userId", // Simplified path
    element: <SuspenseLayout><MyProfile /></SuspenseLayout>
  },
  {
    path: "/aiBot", // Kebab-case
    element: <SuspenseLayout><AiCharacter /></SuspenseLayout>
  }
]);

function App() {
  return (
    <Provider store={store}>
      {/* AppWrapper handles Global Auth/State logic */}
      <AppWrapper>
        <ToastContainer theme="colored" position="top-right" autoClose={3000} />
        <RouterProvider router={router} />
        {/* If DeleteRoom is a Modal, ensure it's controlled via Redux/Context */}
        <DeleteRoom />
      </AppWrapper>
    </Provider>
  );
}

export default App;