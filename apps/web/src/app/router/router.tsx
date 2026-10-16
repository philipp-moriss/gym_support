import { createBrowserRouter, Navigate } from 'react-router'
import { AwardsPage } from '@/pages/awards'
import { JournalPage } from '@/pages/journal'
import { LoginPage } from '@/pages/login'
import {
  PlanCyclePage,
  PlanExercisesPage,
  PlanPage,
  PlanRulesPage,
  PlanSchedulePage,
} from '@/pages/plan'
import { ProfilePage } from '@/pages/profile'
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
          { path: routes.plan, element: <PlanPage /> },
          { path: routes.planExercises, element: <PlanExercisesPage /> },
          { path: routes.planSchedule, element: <PlanSchedulePage /> },
          { path: routes.planCycle, element: <PlanCyclePage /> },
          { path: routes.planRules, element: <PlanRulesPage /> },
          { path: routes.profile, element: <ProfilePage /> },
          { path: routes.journal, element: <JournalPage /> },
          { path: routes.awards, element: <AwardsPage /> },
          // Старые адреса вкладок.
          {
            path: '/journal',
            element: <Navigate to={routes.journal} replace />,
          },
          { path: '/awards', element: <Navigate to={routes.awards} replace /> },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to={routes.today} replace /> },
])
