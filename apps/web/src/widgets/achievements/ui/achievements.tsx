import { Lock, Trophy as TrophyIcon } from 'lucide-react'
import { useMemo } from 'react'
import type { Entry } from '@/entities/entry'
import { cn, formatDay, num, plural, tonnage } from '@/shared/lib'
import { Card } from '@/shared/ui'
import { badges, journalStats } from '../model/stats'
import {
  TROPHIES,
  compareWith,
  nextTrophy,
  type Trophy,
} from '../model/trophies'

/** «Награды»: сколько поднято сегодня и всего, с чем это сравнимо, рекорды и значки. */
export function Achievements({ entries }: { entries: Entry[] }) {
  const stats = useMemo(() => journalStats(entries), [entries])
  const today = compareWith(stats.todayKg)
  const total = compareWith(stats.totalKg)
  const next = nextTrophy(stats.totalKg)
  const list = badges(stats)
  const unlocked = list.filter((b) => b.unlocked).length

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-3">
        <span className="mono-label text-stage-muted">Сколько ты поднял</span>
        <h1 className="display text-5xl text-accent sm:text-6xl">Награды</h1>
      </header>

      <div className="grid gap-3 sm:grid-cols-2">
        <Card className="rise gap-3">
          <span className="mono-label text-muted-foreground">Сегодня</span>
          <span
            className="display text-5xl tabular-nums"
            data-testid="today-kg"
          >
            {tonnage(stats.todayKg)}
          </span>
          {today ? (
            <Comparison
              trophy={today.trophy}
              count={today.count}
              verb="Это как поднять"
            />
          ) : (
            <p className="text-[15px] text-muted-foreground">
              {stats.todayKg > 0
                ? 'Почти кошка — ещё немного!'
                : 'Отметь упражнения с весом на «Сегодня» — посчитаем, кого ты поднял.'}
            </p>
          )}
        </Card>

        <Card
          className="rise gap-3 bg-accent"
          style={{ animationDelay: '60ms' }}
        >
          <span className="mono-label">За всё время</span>
          <span
            className="display text-5xl tabular-nums"
            data-testid="total-kg"
          >
            {tonnage(stats.totalKg)}
          </span>
          {total ? (
            <Comparison
              trophy={total.trophy}
              count={total.count}
              verb="Это как перетаскать"
            />
          ) : (
            <p className="text-[15px]">Первая кошка — на 4 кг.</p>
          )}
        </Card>
      </div>

      {next && (
        <div className="flex flex-col gap-2 rounded-md bg-block p-4">
          <div className="flex items-baseline justify-between gap-3">
            <span className="mono-label text-stage-muted">Следующая цель</span>
            <span className="font-mono text-sm">
              осталось <b>{tonnage(next.kg - stats.totalKg)}</b>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-3xl" aria-hidden>
              {next.emoji}
            </span>
            <div className="flex flex-1 flex-col gap-1.5">
              <span className="font-bold">
                {next.name} · {tonnage(next.kg)}
              </span>
              <div className="h-2.5 overflow-hidden rounded-full bg-stage-border">
                <div
                  className="progress-fill h-full rounded-full bg-accent"
                  style={{
                    width: `${Math.min(100, (stats.totalKg / next.kg) * 100)}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-2">
        <Stat label="Тренировок" value={num(stats.workouts)} />
        <Stat label="Недель подряд" value={num(stats.streak)} />
        <Stat
          label="Лучший день"
          value={stats.best ? tonnage(stats.best.kg) : '—'}
          hint={
            stats.best
              ? formatDay(stats.best.date, {
                  weekday: undefined,
                  month: 'short',
                })
              : undefined
          }
        />
      </div>

      <Card>
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="display text-2xl">Коллекция</h2>
          <span className="mono-label text-muted-foreground">
            {TROPHIES.filter((t) => stats.totalKg >= t.kg).length} из{' '}
            {TROPHIES.length}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">
          Открывается, когда за всё время поднято больше, чем весит находка.
        </p>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {TROPHIES.map((t) => {
            const open = stats.totalKg >= t.kg
            return (
              <div
                key={t.id}
                className={cn(
                  'flex flex-col items-center gap-1 rounded-md p-2 py-3 text-center',
                  open ? '' : 'bg-muted',
                )}
                style={open ? { background: t.color } : undefined}
                title={
                  open
                    ? `${t.name}: ${tonnage(t.kg)}`
                    : `Откроется на ${tonnage(t.kg)}`
                }
              >
                <span
                  className={cn('text-3xl', !open && 'opacity-30 grayscale')}
                  aria-hidden
                >
                  {open ? t.emoji : '❔'}
                </span>
                <span className="text-xs leading-tight font-bold">
                  {open ? t.name : '???'}
                </span>
                <span className="font-mono text-[11px] text-muted-foreground">
                  {open
                    ? `×${num(Math.floor(stats.totalKg / t.kg))}`
                    : tonnage(t.kg)}
                </span>
              </div>
            )
          })}
        </div>
      </Card>

      <Card>
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="display text-2xl">Значки</h2>
          <span className="mono-label text-muted-foreground">
            {unlocked} из {list.length}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {list.map((b) => (
            <div
              key={b.id}
              className={cn(
                'flex items-center gap-3 rounded-md p-3',
                b.unlocked
                  ? 'bg-matcha-cream'
                  : 'bg-muted text-muted-foreground',
              )}
            >
              <span
                className={cn(
                  'text-2xl',
                  !b.unlocked && 'opacity-40 grayscale',
                )}
                aria-hidden
              >
                {b.unlocked ? b.emoji : <Lock className="size-6" />}
              </span>
              <span className="flex min-w-0 flex-col">
                <span className="text-sm leading-tight font-bold">
                  {b.title}
                </span>
                <span className="text-xs leading-tight">{b.text}</span>
              </span>
            </div>
          ))}
        </div>
      </Card>

      {stats.records.length > 0 && (
        <Card>
          <h2 className="display flex items-center gap-2 text-2xl">
            <TrophyIcon className="size-6" />
            Личные рекорды
          </h2>
          <ul className="flex flex-col">
            {stats.records.map((r) => (
              <li
                key={r.exercise}
                className="flex items-center justify-between gap-3 border-t border-border py-2.5 first:border-t-0"
              >
                <span className="min-w-0 truncate font-semibold">
                  {r.exercise}
                </span>
                <span className="shrink-0 font-mono text-sm">
                  <b className="text-base">{num(r.weight)} кг</b>{' '}
                  <span className="text-muted-foreground">
                    ·{' '}
                    {formatDay(r.date, { weekday: undefined, month: 'short' })}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  )
}

function Comparison({
  trophy,
  count,
  verb,
}: {
  trophy: Trophy
  count: number
  verb: string
}) {
  return (
    <div className="pop-in flex items-center gap-3">
      <span
        className="grid size-14 shrink-0 place-items-center rounded-full text-3xl"
        style={{ background: trophy.color }}
        aria-hidden
      >
        {trophy.emoji}
      </span>
      <p className="text-[15px] leading-snug">
        {verb}{' '}
        <b className="text-lg">
          {num(count)} {plural(count, trophy.forms)}
        </b>
      </p>
    </div>
  )
}

function Stat({
  label,
  value,
  hint,
}: {
  label: string
  value: string
  hint?: string
}) {
  return (
    <div className="flex flex-col gap-2 rounded-md bg-block p-3 sm:p-4">
      <span className="mono-label text-stage-muted">{label}</span>
      <span className="display truncate text-2xl sm:text-3xl">{value}</span>
      {hint && (
        <span className="font-mono text-xs text-stage-muted">{hint}</span>
      )}
    </div>
  )
}
