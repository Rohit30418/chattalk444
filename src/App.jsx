import React, { Suspense, lazy } from 'react';
import {
  RouterProvider,
  createBrowserRouter,
  Navigate,
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

// Lazy-loaded pages
const HomePage = lazy(() => import('./Home/HomePage'));
const Mainbody = lazy(() => import('./components/AppBody/Mainbody'));
const Room = lazy(() => import('./room/Room'));
const MyProfile = lazy(() => import('./components/AppBody/MyProfile'));
const AiCharacter = lazy(() => import('./components/ai/AiCharacter'));
const NotFound = lazy(() => import('./NotFound'));

const SuspenseLayout = ({ children }) => (
  <Suspense fallback={<GradientSpinner />}>
    {children}
  </Suspense>
);

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
        <MyProfile />
      </SuspenseLayout>
    ),
  },

  {
    path: '/MyProfile/:userId',
    element: (
      <SuspenseLayout>
        <MyProfile />
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
