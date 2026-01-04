import React, { Suspense, lazy } from 'react'
import { RouterProvider, createBrowserRouter } from 'react-router-dom'
import { store } from './store'
import { Provider } from 'react-redux'
import { ToastContainer } from 'react-toastify'
import AppWrapper from './components/auth/AppWrapper'
import Layout from './Layout'
import DeleteRoom from "../src/features/DeleteRoom"
import GradientSpinner from './components/common/GradientSpinner'

// --- 2. LAZY IMPORT COMPONENTS ---
// Only load these files when the user visits the route
const HomePage = lazy(() => import('./Home/HomePage'));
const Mainbody = lazy(() => import('./components/AppBody/Mainbody'));
const Room = lazy(() => import('./components/rooms/Room'));
const MyProfile = lazy(() => import('./components/AppBody/MyProfile'));
const AiCharacter = lazy(() => import('./components/ai/AiCharacter'));

// --- 3. HELPER FOR SUSPENSE ---
// This saves us from writing <Suspense> over and over
const Load = (Component) => (
  <Suspense fallback={<GradientSpinner />}>
    <Component />
  </Suspense>
);

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />, // Layout usually loads fast, so keep it standard or wrap in Suspense if heavy
    children: [
      {
        index: true,
        element: Load(HomePage) // Lazy Loaded
      },
      {
        path: "rooms",
        element: Load(Mainbody) // Lazy Loaded
      }
    ]
  },
  {
    path: "/Room/:id",
    element: Load(Room) // Lazy Loaded
  },
  {
    path: "/MyProfile/:userId",
    element: Load(MyProfile) // Lazy Loaded
  },
  {
    path: "/AiBot",
    element: Load(AiCharacter) // Lazy Loaded
  }
]);

function App() {
  return (
    <Provider store={store}>
      <AppWrapper>
        <ToastContainer theme="colored" />
        <RouterProvider router={router} />
        <DeleteRoom />
      </AppWrapper>
    </Provider>
  )
}

export default App