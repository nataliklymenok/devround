import { createBrowserRouter } from 'react-router'
import { LandingPage } from '../features/auth/LandingPage'
import { DashboardPage } from '../features/dashboard/DashboardPage'
import { LessonPage } from '../features/lesson/LessonPage'
import { PlanPage } from '../features/plan/PlanPage'
import { SetupPage } from '../features/setup/SetupPage'
import { TaskPage } from '../features/task/TaskPage'
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
      { path: '/dashboard', element: <DashboardPage /> },
      { path: '/setup', element: <SetupPage /> },
      { path: '/plan', element: <PlanPage /> },
      { path: '/lessons/:lessonId', element: <LessonPage /> },
      { path: '/tasks/:taskId', element: <TaskPage /> },
    ],
  },
])
