import { createBrowserRouter, Navigate } from 'react-router'
import { AwardsPage } from '@/pages/awards'
import { JournalPage } from '@/pages/journal'
import { LoginPage } from '@/pages/login'
import { PlanPage } from '@/pages/plan'
import { TodayPage } from '@/pages/today'
import { routes } from '@/shared/config'
import { AppShell } from '@/widgets/app-shell'
import { RequireAuth } from './guards'

export const router = createBrowserRouter([
  { path: routes.login, element: <LoginPage /> },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <AppShell />,
        children: [
          { path: routes.today, element: <TodayPage /> },
          { path: routes.journal, element: <JournalPage /> },
          { path: routes.awards, element: <AwardsPage /> },
          { path: routes.plan, element: <PlanPage /> },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to={routes.today} replace /> },
])
