import React, { Suspense, lazy } from 'react';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ToastContainer } from 'react-toastify';

import { store } from './store';
import { AuthProvider } from './components/auth/AppWrapper'; // FIXED
import Layout from './Layout';
import DeleteRoom from './features/DeleteRoom';
import GradientSpinner from './components/common/GradientSpinner';


// Lazy-loaded pages
const HomePage = lazy(() => import('./Home/HomePage'));
const Mainbody = lazy(() => import('./components/AppBody/Mainbody'));
const Room = lazy(() => import('./components/rooms/Room'));
const MyProfile = lazy(() => import('./components/AppBody/MyProfile'));
const AiCharacter = lazy(() => import('./components/ai/AiCharacter'));


// Suspense wrapper
const SuspenseLayout = ({ children }) => (
  <Suspense fallback={<GradientSpinner />}>
    {children}
  </Suspense>
);


// Router config
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
    path: '/aiBot',
    element: (
      <SuspenseLayout>
        <AiCharacter />
      </SuspenseLayout>
    ),
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
        />

        <RouterProvider router={router} />

        <DeleteRoom />
      </AuthProvider>
    </Provider>
  );
}

export default App;