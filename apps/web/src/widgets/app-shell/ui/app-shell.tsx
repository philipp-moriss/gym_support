import { CalendarCheck, ClipboardList, NotebookPen, Trophy } from 'lucide-react'
import { NavLink, Outlet, useLocation } from 'react-router'
import { UpgradeCodeGate } from '@/features/upgrade-code'
import { routes } from '@/shared/config'
import { cn } from '@/shared/lib'

const tabs = [
  { to: routes.today, label: 'Сегодня', icon: CalendarCheck },
  { to: routes.journal, label: 'Дневник', icon: NotebookPen },
  { to: routes.awards, label: 'Награды', icon: Trophy },
  { to: routes.plan, label: 'План', icon: ClipboardList },
]

/** Страница и плавающее меню-«пилюля» снизу. На узком экране подпись только у активной вкладки. */
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
              end
              onClick={() => window.scrollTo({ top: 0 })}
              className={({ isActive }) =>
                cn(
                  'group flex h-12 items-center gap-2 rounded-full px-4 text-sm font-bold transition-[background-color,color] duration-300 sm:px-5',
                  isActive
                    ? 'bg-accent text-accent-foreground'
                    : 'text-bone-white/70 hover:text-bone-white',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <t.icon className="size-5" />
                  <span className={cn(!isActive && 'sr-only sm:not-sr-only')}>
                    {t.label}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      <UpgradeCodeGate />
    </>
  )
}
