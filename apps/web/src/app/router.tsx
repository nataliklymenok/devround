import { createBrowserRouter } from 'react-router'
import { LandingPage } from '../features/auth/LandingPage'
import { AuthGuard } from './AuthGuard'
import { Layout } from './Layout'

export const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [{ path: '/', element: <LandingPage /> }],
  },
  {
    element: <AuthGuard />,
    children: [
      { path: '/dashboard', element: <h1>Dashboard</h1> },
      { path: '/setup', element: <h1>Choose your interview</h1> },
    ],
  },
])
