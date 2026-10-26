import { createBrowserRouter } from 'react-router'
import { Layout } from './Layout'

export const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [{ path: '/', element: <h1>DevRound</h1> }],
  },
])
