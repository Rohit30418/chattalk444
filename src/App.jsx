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
import GlobalMemberVisuals from './components/common/GlobalMemberVisuals';
import PwaManager from './components/common/PwaManager';
import InAppNotifications from './components/common/InAppNotifications';
import useMobilePwaMode from './hooks/useMobilePwaMode';
import ErrorBoundary from './ErrorBoundary';

const CHUNK_RELOAD_KEY = 'vaani_chunk_reload_attempt';

const isChunkLoadError = (error) => {
  const message = String(error?.message || error || '');

  return /Failed to fetch dynamically imported module|Importing a module script failed|ChunkLoadError|Loading chunk|dynamically imported module/i.test(message);
};

const lazyWithRetry = (importer) => lazy(async () => {
  try {
    const module = await importer();
    sessionStorage.removeItem(CHUNK_RELOAD_KEY);
    return module;
  } catch (error) {
    if (typeof window !== 'undefined' && isChunkLoadError(error)) {
      const alreadyReloaded = sessionStorage.getItem(CHUNK_RELOAD_KEY) === '1';

      if (!alreadyReloaded) {
        sessionStorage.setItem(CHUNK_RELOAD_KEY, '1');

        const url = new URL(window.location.href);
        url.searchParams.set('__vaani_refresh', Date.now().toString());
        window.location.replace(url.toString());

        return new Promise(() => {});
      }

      sessionStorage.removeItem(CHUNK_RELOAD_KEY);
    }

    throw error;
  }
});

const HomePage = lazyWithRetry(() => import('./Home/HomePage'));
const Mainbody = lazyWithRetry(() => import('./components/AppBody/Mainbody'));
const Room = lazyWithRetry(() => import('./room/Room'));
const SocialProfilePage = lazyWithRetry(() => import('./components/social/SocialProfilePage'));
const ConnectPage = lazyWithRetry(() => import('./components/social/ConnectPage'));
const MessagesPage = lazyWithRetry(() => import('./components/social/MessagesPage'));
const AiCharacter = lazyWithRetry(() => import('./components/ai/AiCharacter'));
const NotFound = lazyWithRetry(() => import('./NotFound'));

const SuspenseLayout = ({ children }) => {
  const { pathname, search } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [pathname, search]);

  useEffect(() => {
    const url = new URL(window.location.href);

    if (url.searchParams.has('__vaani_refresh')) {
      url.searchParams.delete('__vaani_refresh');
      window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`);
    }
  }, []);

  return (
    <Suspense fallback={<GradientSpinner />}>
      {children}
    </Suspense>
  );
};

const HomeEntry = () => {
  const isMobilePwa = useMobilePwaMode();

  if (isMobilePwa) {
    return <Navigate to="/rooms" replace />;
  }

  return (
    <SuspenseLayout>
      <HomePage />
    </SuspenseLayout>
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
        element: <HomeEntry />,
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
        path: 'profile/:userId',
        element: (
          <SuspenseLayout>
            <SocialProfilePage />
          </SuspenseLayout>
        ),
      },
      {
        path: 'MyProfile/:userId',
        element: (
          <SuspenseLayout>
            <SocialProfilePage />
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
        <GlobalMemberVisuals />
        <PwaManager />
        <InAppNotifications />

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
