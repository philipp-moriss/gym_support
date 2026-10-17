import { createBrowserRouter, Navigate } from 'react-router'
import { AwardsPage } from '@/pages/awards'
import { CoachClientPage } from '@/pages/coach-client'
import { CoachClientsPage } from '@/pages/coach-clients'
import { CoachProfilePage } from '@/pages/coach-profile'
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
import { coachPaths, routes } from '@/shared/config'
import { AppShell } from '@/widgets/app-shell'
import { CoachShell } from '@/widgets/coach-shell'
import { CoachClientScope, RequireAuth } from './guards'

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
      {
        // Кабинет тренера: те же страницы «Плана» и «Дневника», но клиента.
        element: <CoachShell />,
        children: [
          { path: routes.coach, element: <CoachClientsPage /> },
          { path: routes.coachProfile, element: <CoachProfilePage /> },
          {
            element: <CoachClientScope />,
            children: [
              { path: coachPaths.client, element: <CoachClientPage /> },
              { path: coachPaths.plan, element: <PlanPage /> },
              {
                path: coachPaths.planExercises,
                element: <PlanExercisesPage />,
              },
              { path: coachPaths.planSchedule, element: <PlanSchedulePage /> },
              { path: coachPaths.planCycle, element: <PlanCyclePage /> },
              { path: coachPaths.planRules, element: <PlanRulesPage /> },
              { path: coachPaths.journal, element: <JournalPage /> },
            ],
          },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to={routes.today} replace /> },
])
