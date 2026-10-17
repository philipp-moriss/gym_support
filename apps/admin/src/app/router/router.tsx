import { createBrowserRouter, Navigate } from 'react-router'
import { AdminsPage } from '@/pages/admins'
import { AiPage } from '@/pages/ai'
import { ClientsPage } from '@/pages/clients'
import { CoachesPage } from '@/pages/coaches'
import { LoginPage } from '@/pages/login'
import { PromptsPage } from '@/pages/prompts'
import { routes } from '@/shared/config'
import { AppShell } from '@/widgets/app-shell'
import { RequireAdmin } from './guards'

export const router = createBrowserRouter([
  { path: routes.login, element: <LoginPage /> },
  {
    element: <RequireAdmin />,
    children: [
      {
        element: <AppShell />,
        children: [
          { path: routes.coaches, element: <CoachesPage /> },
          { path: routes.clients, element: <ClientsPage /> },
          { path: routes.prompts, element: <PromptsPage /> },
          { path: routes.ai, element: <AiPage /> },
          { path: routes.admins, element: <AdminsPage /> },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to={routes.coaches} replace /> },
])
