import { createBrowserRouter } from 'react-router'
import { LandingPage } from '../features/auth/LandingPage'
import { PlanPage } from '../features/plan/PlanPage'
import { SetupPage } from '../features/setup/SetupPage'
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
      { path: '/setup', element: <SetupPage /> },
      { path: '/plan', element: <PlanPage /> },
    ],
  },
])
