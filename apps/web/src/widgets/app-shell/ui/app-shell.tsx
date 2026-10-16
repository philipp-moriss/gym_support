import { CalendarCheck, ClipboardList, UserRound } from 'lucide-react'
import { NavLink, Outlet, useLocation } from 'react-router'
import { routes } from '@/shared/config'
import { cn } from '@/shared/lib'

const tabs = [
  { to: routes.today, label: 'Сегодня', icon: CalendarCheck, end: true },
  { to: routes.plan, label: 'План', icon: ClipboardList, end: false },
  { to: routes.profile, label: 'Профиль', icon: UserRound, end: false },
]

/** Страница и плавающее меню-«пилюля» снизу: «Сегодня», «План», «Профиль». */
export function AppShell() {
  const { pathname } = useLocation()
  return (
    <>
      <main
        key={pathname}
        className="rise mx-auto flex w-full max-w-2xl flex-col px-4 pt-8 pb-32 sm:pt-12"
      >
        <Outlet />
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-20 flex justify-center px-4 pb-[max(16px,env(safe-area-inset-bottom))]">
        <div className="flex gap-1 rounded-full bg-ink p-1.5">
          {tabs.map((t) => (
            <NavLink
              key={t.to}
              to={t.to}
              end={t.end}
              onClick={() => window.scrollTo({ top: 0 })}
              className={({ isActive }) =>
                cn(
                  'flex h-12 items-center gap-2 rounded-full px-4 text-sm font-bold transition-[background-color,color] duration-300 sm:px-5',
                  isActive
                    ? 'bg-accent text-accent-foreground'
                    : 'text-bone-white/70 hover:text-bone-white',
                )
              }
            >
              <t.icon className="size-5" />
              {t.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </>
  )
}
