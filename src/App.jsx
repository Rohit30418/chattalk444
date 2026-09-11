import React, { Suspense, lazy, useEffect } from 'react';
import {
  RouterProvider,
  createBrowserRouter,
  Navigate,
  useLocation,
} from 'react-router-dom';
import { Provider } from 'react-redux';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { store } from './store';
import { AuthProvider } from './components/auth/AppWrapper';
import MemberRoute from './components/auth/MemberRoute';
import Layout from './Layout';
import GradientSpinner from './components/common/GradientSpinner';
import ErrorBoundary from './ErrorBoundary';

const HomePage = lazy(() => import('./Home/HomePage'));
const Mainbody = lazy(() => import('./components/AppBody/Mainbody'));
const Room = lazy(() => import('./room/Room'));
const SocialProfilePage = lazy(() => import('./components/social/SocialProfilePage'));
const ConnectPage = lazy(() => import('./components/social/ConnectPage'));
const MessagesPage = lazy(() => import('./components/social/MessagesPage'));
const AiCharacter = lazy(() => import('./components/ai/AiCharacter'));
const NotFound = lazy(() => import('./NotFound'));

const SuspenseLayout = ({ children }) => {
  const { pathname, search } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [pathname, search]);

  return (
    <Suspense fallback={<GradientSpinner />}>
      {children}
    </Suspense>
  );
};

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    errorElement: <ErrorBoundary />,
    children: [
      {
        index: true,
        element: (
          <SuspenseLayout>
            <HomePage />
          </SuspenseLayout>
        ),
      },
      {
        path: 'rooms',
        element: (
          <SuspenseLayout>
            <Mainbody />
          </SuspenseLayout>
        ),
      },
      {
        path: 'connect',
        element: (
          <SuspenseLayout>
            <ConnectPage />
          </SuspenseLayout>
        ),
      },
      {
        path: 'messages',
        element: (
          <SuspenseLayout>
            <MessagesPage />
          </SuspenseLayout>
        ),
      },
      {
        path: 'room',
        element: <Navigate to="/rooms" replace />,
      },
      {
        path: 'Rooms',
        element: <Navigate to="/rooms" replace />,
      },
      {
        path: 'Room',
        element: <Navigate to="/rooms" replace />,
      },
    ],
  },

  {
    path: '/room/:id',
    element: (
      <SuspenseLayout>
        <Room />
      </SuspenseLayout>
    ),
  },

  {
    path: '/profile/:userId',
    element: (
      <SuspenseLayout>
        <SocialProfilePage />
      </SuspenseLayout>
    ),
  },

  {
    path: '/MyProfile/:userId',
    element: (
      <SuspenseLayout>
        <SocialProfilePage />
      </SuspenseLayout>
    ),
  },

  {
    path: '/aiBot',
    element: (
      <MemberRoute>
        <SuspenseLayout>
          <AiCharacter />
        </SuspenseLayout>
      </MemberRoute>
    ),
  },

  {
    path: '/ai-bot',
    element: <Navigate to="/aiBot" replace />,
  },

  {
    path: '*',
    element: <NotFound />,
  },
]);

function App() {
  return (
    <Provider store={store}>
      <AuthProvider>
        <ToastContainer
          theme="colored"
          position="top-right"
          autoClose={3000}
          newestOnTop
          closeOnClick
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />

        <RouterProvider router={router} />
      </AuthProvider>
    </Provider>
  );
}

export default App;
