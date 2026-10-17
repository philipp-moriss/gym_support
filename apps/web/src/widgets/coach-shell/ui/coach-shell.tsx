import { UserRound, UsersRound } from 'lucide-react'
import { Link, Outlet, useLocation } from 'react-router'
import { routes } from '@/shared/config'
import { cn, haptic } from '@/shared/lib'
import { HapticOverlay } from '@/shared/ui'

const tabs = [
  { to: routes.coach, label: 'Клиенты', icon: UsersRound },
  { to: routes.coachProfile, label: 'Профиль', icon: UserRound },
]

/** Кабинет тренера: страница и меню-«пилюля» снизу, как у клиента. */
export function CoachShell() {
  const { pathname } = useLocation()
  const active = pathname.startsWith(routes.coachProfile)
    ? routes.coachProfile
    : routes.coach
  return (
    <>
      <main
        key={pathname}
        className="rise mx-auto flex w-full max-w-2xl flex-col px-4 pt-8 pb-40 sm:pt-12"
      >
        <Outlet />
      </main>
      <nav className="fixed inset-x-0 bottom-0 z-20 flex justify-center px-4 pb-[max(16px,env(safe-area-inset-bottom))]">
        <div className="flex gap-1 rounded-full bg-ink p-1.5">
          {tabs.map((t) => (
            <Link
              key={t.to}
              to={t.to}
              onClick={() => {
                haptic()
                window.scrollTo({ top: 0 })
              }}
              aria-current={active === t.to ? 'page' : undefined}
              className={cn(
                'relative flex h-12 items-center gap-2 rounded-full px-4 text-sm font-bold transition-[background-color,color] duration-300 sm:px-5',
                active === t.to
                  ? 'bg-accent text-accent-foreground'
                  : 'text-bone-white/70 hover:text-bone-white',
              )}
            >
              <t.icon className="size-5" />
              {t.label}
              <HapticOverlay />
            </Link>
          ))}
        </div>
      </nav>
    </>
  )
}
