import { useParams } from 'react-router'

export const routes = {
  today: '/',
  plan: '/plan',
  planExercises: '/plan/exercises',
  planSchedule: '/plan/schedule',
  planCycle: '/plan/cycle',
  planRules: '/plan/rules',
  profile: '/profile',
  journal: '/profile/journal',
  awards: '/profile/awards',
  login: '/login',
  coach: '/coach',
  coachProfile: '/coach/profile',
  coachClient: (id: string) => `/coach/c/${id}`,
} as const

/** Шаблоны адресов кабинета тренера для роутера. */
export const coachPaths = {
  client: '/coach/c/:clientId',
  plan: '/coach/c/:clientId/plan',
  planExercises: '/coach/c/:clientId/plan/exercises',
  planSchedule: '/coach/c/:clientId/plan/schedule',
  planCycle: '/coach/c/:clientId/plan/cycle',
  planRules: '/coach/c/:clientId/plan/rules',
  journal: '/coach/c/:clientId/journal',
} as const

/**
 * Адреса «Плана» и «Дневника» для текущей страницы: свои у клиента, а у
 * тренера — внутри открытого клиента (`/coach/c/:clientId/...`). Одни и те же
 * страницы плана служат обоим.
 */
export function useScopedRoutes() {
  const { clientId } = useParams()
  if (!clientId)
    return {
      clientId: null,
      plan: routes.plan,
      planExercises: routes.planExercises,
      planSchedule: routes.planSchedule,
      planCycle: routes.planCycle,
      planRules: routes.planRules,
      journal: routes.journal,
      journalBack: { to: routes.profile, label: 'Профиль' },
      /** Куда вернуться с «Плана»: у клиента это корень раздела. */
      planBack: undefined,
    }
  const base = routes.coachClient(clientId)
  return {
    clientId,
    plan: `${base}/plan`,
    planExercises: `${base}/plan/exercises`,
    planSchedule: `${base}/plan/schedule`,
    planCycle: `${base}/plan/cycle`,
    planRules: `${base}/plan/rules`,
    journal: `${base}/journal`,
    journalBack: { to: base, label: 'Клиент' },
    planBack: { to: base, label: 'Клиент' },
  }
}
