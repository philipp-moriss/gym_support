"use client";

import clsx from "clsx";
import { ChevronDown, Download, RefreshCw, RotateCcw, ShieldCheck, Sparkles, Trash2, Undo2 } from "lucide-react";
import { useState } from "react";
import { adaptiveEntries, resetAll, useEntries, useSettings } from "@/lib/entries";
import { downloadXlsx } from "@/lib/export-xlsx";
import { num, setsReps } from "@/lib/format";
import {
  CYCLE_WEEKS,
  WEEK_PERCENT,
  addDays,
  exercises,
  mondayOf,
  muscles,
  planFor,
  programWeek,
  rules,
  schedule,
  todayIso,
  weekday,
  weekdayShort,
} from "@/lib/program";
import { nextCycleBases } from "@/lib/suggest";
import { Button, Card, Chip, Input, Stepper } from "./ui";

export function Plan() {
  const { settings, update } = useSettings();
  const { entries } = useEntries();
  const date = todayIso();
  const week = programWeek(settings.startDate, date);
  const shownWeek = Math.min(week, CYCLE_WEEKS);
  const weighted = exercises.filter((e) => e.base !== undefined);
  const other = exercises.filter((e) => e.base === undefined);
  const nextCycle = week > CYCLE_WEEKS ? nextCycleBases(weighted, settings.bases, adaptiveEntries(entries, settings), settings.startDate) : [];

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-3">
        <span className="mono-label text-stage-muted">Первый месяц · {CYCLE_WEEKS} недели</span>
        <h1 className="display text-5xl text-accent sm:text-6xl">План</h1>
      </header>

      {nextCycle.length > 0 && (
        <Card className="rise bg-accent">
          <div className="flex items-start gap-3">
            <Sparkles className="mt-1 size-6 shrink-0" />
            <div className="flex flex-col gap-1">
              <h2 className="display text-2xl">Цикл пройден — пора на новый</h2>
              <p className="text-[15px]">
                Новые базовые веса по 4-й неделе: лучший вес без боли ÷ 85%. Где спина болела — база не меняется.
              </p>
            </div>
          </div>
          <ul className="flex flex-col gap-1 font-mono text-sm">
            {nextCycle.map(({ ex, from, to }) => (
              <li key={ex.id} className="flex justify-between gap-3">
                <span className="truncate">{ex.short}</span>
                <span>
                  {num(from)} → <b>{num(to)} кг</b>
                </span>
              </li>
            ))}
          </ul>
          <Button
            variant="ink"
            className="self-start"
            onClick={() =>
              update({
                bases: { ...settings.bases, ...Object.fromEntries(nextCycle.map((c) => [c.ex.id, c.to])) },
                startDate: mondayOf(date),
              })
            }
          >
            <RefreshCw />
            Начать новый цикл
          </Button>
        </Card>
      )}

      {/* Неделя программы */}
      <Card>
        <div className="flex items-center justify-between gap-3">
          <h2 className="display text-2xl">Неделя {week}</h2>
          <span className="mono-label text-muted-foreground">старт {new Date(`${settings.startDate}T00:00`).toLocaleDateString("ru-RU")}</span>
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          {WEEK_PERCENT.map((p, i) => (
            <div
              key={p}
              className={clsx(
                "flex flex-col items-center gap-1 rounded-md py-3 transition-colors",
                i + 1 === shownWeek ? "bg-ink text-ink-foreground" : i + 1 < shownWeek ? "bg-matcha-cream" : "bg-muted",
              )}
            >
              <span className="mono-label opacity-70">Нед {i + 1}</span>
              <span className="display text-2xl">{Math.round(p * 100)}%</span>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={week <= 1}
            onClick={() => update({ startDate: addDays(settings.startDate, 7) })}
          >
            <RotateCcw />
            Повторить неделю
          </Button>
          <label className="flex items-center gap-2 text-sm">
            <span className="mono-label text-muted-foreground">Начало</span>
            <Input
              type="date"
              className="h-9 w-auto"
              value={settings.startDate}
              onChange={(e) => e.target.value && update({ startDate: mondayOf(e.target.value) })}
            />
          </label>
        </div>
        <p className="text-sm text-muted-foreground">
          Неделя прошла тяжело — повтори её, а не переходи к следующей.
        </p>
      </Card>

      {/* Рабочие веса */}
      <Card className="gap-5">
        <div className="flex flex-col gap-1">
          <h2 className="display text-2xl">Рабочие веса</h2>
          <p className="text-sm text-muted-foreground">
            Меняй «последний вес» — недели пересчитаются сами, с округлением до 2,5 кг.
          </p>
        </div>
        {weighted.map((ex) => {
          const base = settings.bases[ex.id] ?? ex.base!;
          return (
            <div key={ex.id} className="flex flex-col gap-3 border-t border-border pt-4 first:border-t-0 first:pt-0">
              <div className="flex items-center gap-2">
                <span className="size-3 rounded-full" style={{ background: muscles[ex.muscle].color }} />
                <span className="font-semibold">{ex.name}</span>
              </div>
              <div className="grid grid-cols-1 items-end gap-3 sm:grid-cols-[200px_1fr]">
                <Stepper
                  label="Последний вес"
                  unit="кг"
                  step={2.5}
                  value={base}
                  onChange={(v) => update({ bases: { ...settings.bases, [ex.id]: v } })}
                />
                <div className="grid grid-cols-4 gap-1.5">
                  {[1, 2, 3, 4].map((w) => {
                    const p = planFor(ex, w, settings.bases);
                    return (
                      <div
                        key={w}
                        className={clsx(
                          "flex flex-col items-center rounded-md py-2",
                          w === shownWeek ? "bg-accent" : "bg-muted",
                        )}
                      >
                        <span className="font-mono text-base font-bold">{num(p.weight ?? 0)}</span>
                        <span className="font-mono text-[11px] text-muted-foreground">{setsReps(ex, p.sets, p.reps, p.repsMax)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </Card>

      {/* Без базы */}
      <Card>
        <h2 className="display text-2xl">Без веса и лёгкие</h2>
        <div className="flex flex-col">
          {other.map((ex) => {
            const p = planFor(ex, shownWeek, settings.bases);
            return (
              <div key={ex.id} className="flex items-center gap-3 border-t border-border py-3 first:border-t-0">
                <span className="size-3 shrink-0 rounded-full" style={{ background: muscles[ex.muscle].color }} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{ex.short}</span>
                  {p.label && <span className="block text-sm text-muted-foreground">{p.label}</span>}
                </span>
                <span className="shrink-0 font-mono text-sm">{setsReps(ex, p.sets, p.reps, p.repsMax)}</span>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Расписание */}
      <Card>
        <h2 className="display text-2xl">Неделя по дням</h2>
        <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-7">
          {schedule.map((d, i) => {
            const isToday = weekday(date) === i;
            const bg = d.gym === "yes" ? "bg-matcha-cream" : d.gym === "optional" ? "bg-buttery-yellow" : d.title === "Дайвинг" ? "bg-[var(--sky)]" : "bg-muted";
            return (
              <div
                key={i}
                className={clsx(
                  "flex items-center gap-3 rounded-md px-3 py-2.5 sm:min-h-24 sm:flex-col sm:items-center sm:gap-1 sm:px-1.5 sm:text-center",
                  bg,
                  isToday && "ring-[3px] ring-ink",
                )}
              >
                <span className="mono-label w-6 sm:w-auto">{weekdayShort[i]}</span>
                <span className="text-sm leading-tight font-semibold sm:text-xs">{d.title}</span>
                {d.extras.map((x) => (
                  <span key={x} className="ml-auto text-sm leading-tight text-muted-foreground sm:ml-0 sm:text-[11px]">
                    {x}
                  </span>
                ))}
              </div>
            );
          })}
        </div>
        <p className="text-sm text-muted-foreground">
          Между пн и пт три дня отдыха, на выходных дайвинг. Первые 2 недели хватает двух тренировок.
        </p>
      </Card>

      <Rules />

      <ResetCard week={week} />
    </div>
  );
}

type Pending = { kind: "week"; week: number } | { kind: "all" } | null;

/** Переход на неделю со сбросом подстройки и полный сброс. Оба — через подтверждение. */
function ResetCard({ week }: { week: number }) {
  const { settings, update } = useSettings();
  const { entries } = useEntries();
  const [pending, setPending] = useState<Pending>(null);
  const [done, setDone] = useState<string | null>(null);
  const date = todayIso();

  function goToWeek(n: number) {
    update({
      // Сегодняшний понедельник становится понедельником n-й недели
      startDate: addDays(mondayOf(date), -(n - 1) * 7),
      resetAt: date,
      swaps: {},
    });
    setPending(null);
    setDone(`Теперь неделя ${n}. Веса — ровно по плану.`);
  }

  return (
    <Card className="gap-5">
      <div className="flex flex-col gap-1">
        <h2 className="display text-2xl">Сброс</h2>
        <p className="text-sm text-muted-foreground">
          Начни заново с нужной недели: прошлые отметки (боль и сложность) перестанут влиять на веса. Дневник
          сохранится.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <span className="mono-label text-muted-foreground">Перейти на неделю</span>
        <div className="grid grid-cols-4 gap-2">
          {Array.from({ length: CYCLE_WEEKS }, (_, i) => i + 1).map((n) => (
            <Chip
              key={n}
              active={pending?.kind === "week" ? pending.week === n : Math.min(week, CYCLE_WEEKS) === n}
              onClick={() => {
                setDone(null);
                setPending({ kind: "week", week: n });
              }}
              className="h-12 text-base"
            >
              {n}
            </Chip>
          ))}
        </div>
      </div>

      {pending?.kind === "week" && (
        <Confirm
          text={`Перейти на неделю ${pending.week} и сбросить подстройку? Веса будут ровно по плану ${pending.week}-й недели, замены упражнений вернутся к основным.`}
          onCancel={() => setPending(null)}
        >
          <Button variant="ink" size="sm" onClick={() => goToWeek(pending.week)}>
            <Undo2 />
            Перейти на неделю {pending.week}
          </Button>
        </Confirm>
      )}

      <div className="border-t border-border pt-4">
        {pending?.kind === "all" ? (
          <Confirm
            text={`Удалить все записи (${entries.length}) и настройки: базовые веса, дату старта, замены? Это не отменить — лучше сначала выгрузить Excel.`}
            danger
            onCancel={() => setPending(null)}
          >
            <Button variant="outline" size="sm" disabled={!entries.length} onClick={() => downloadXlsx(entries, settings.bases)}>
              <Download />
              Сначала Excel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                resetAll();
                setPending(null);
                setDone("Всё сброшено. Начинаем с первой недели.");
              }}
            >
              <Trash2 />
              Удалить всё
            </Button>
          </Confirm>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive"
            onClick={() => {
              setDone(null);
              setPending({ kind: "all" });
            }}
          >
            <Trash2 />
            Сбросить всё
          </Button>
        )}
      </div>

      {done && (
        <p className="pop-in rounded-md bg-matcha-cream px-3 py-2 text-sm font-semibold">{done}</p>
      )}
    </Card>
  );
}

function Confirm({
  text,
  danger,
  onCancel,
  children,
}: {
  text: string;
  danger?: boolean;
  onCancel: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className={clsx("rise flex flex-col gap-3 rounded-md p-3", danger ? "bg-bubblegum-pink" : "bg-muted")}>
      <p className="text-[15px]">{text}</p>
      <div className="flex flex-wrap gap-2">
        {children}
        <Button variant="ghost" size="sm" onClick={onCancel}>
          Отмена
        </Button>
      </div>
    </div>
  );
}

function Rules() {
  const [open, setOpen] = useState(false);
  return (
    <Card className="gap-0 p-0">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="flex cursor-pointer items-center gap-3 p-[17px] text-left"
      >
        <ShieldCheck className="size-6 shrink-0" />
        <h2 className="display flex-1 text-xl sm:text-2xl">Правила безопасности</h2>
        <ChevronDown className={clsx("size-5 transition-transform duration-300", open && "rotate-180")} />
      </button>
      <div className="collapse-grid" data-open={open}>
        <div>
          <ol className="flex flex-col gap-3 px-[17px] pb-[17px]">
            {rules.map((r, i) => (
              <li key={r} className="flex gap-3 text-[15px] leading-snug">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-ink font-mono text-xs font-bold text-ink-foreground">
                  {i + 1}
                </span>
                <span className="pt-0.5">{r}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </Card>
  );
}
