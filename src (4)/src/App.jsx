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
import Layout from './Layout';
import GradientSpinner from './components/common/GradientSpinner';

// Lazy-loaded pages
const HomePage = lazy(() => import('./Home/HomePage'));
const Mainbody = lazy(() => import('./components/AppBody/Mainbody'));
const Room = lazy(() => import('./room/Room'));
const MyProfile = lazy(() => import('./components/AppBody/MyProfile'));
const AiCharacter = lazy(() => import('./components/ai/AiCharacter'));

const SuspenseLayout = ({ children }) => (
  <Suspense fallback={<GradientSpinner />}>
    {children}
  </Suspense>
);

const NotFound = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white px-6 text-center">
    <h1 className="text-4xl font-black mb-3">404</h1>
    <p className="text-slate-400 mb-6">Page not found</p>
    <a
      href="/"
      className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-colors"
    >
      Go Home
    </a>
  </div>
);

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
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

  // Profile route
  {
    path: '/profile/:userId',
    element: (
      <SuspenseLayout>
        <MyProfile />
      </SuspenseLayout>
    ),
  },

  // Alias support because some older code may use /MyProfile/:uid
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
      <SuspenseLayout>
        <AiCharacter />
      </SuspenseLayout>
    ),
  },

  // Optional clean alias
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