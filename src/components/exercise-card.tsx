"use client";

import clsx from "clsx";
import {
  ArrowDown,
  ArrowUp,
  Check,
  ChevronDown,
  Dumbbell,
  Equal,
  Pencil,
  PersonStanding,
  Repeat2,
  RotateCcw,
  Sparkles,
  Timer,
  Wind,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { EASY_MAX, HARD_MIN, effortLabel, useDraft, type Draft, type Entry } from "@/lib/entries";
import { formatDay, num, setsReps, unitShort, weightText } from "@/lib/format";
import { muscles, type Exercise } from "@/lib/program";
import type { Suggestion, Tone } from "@/lib/suggest";
import { Button, Input, Stepper } from "./ui";

const toneBadge: Record<Exclude<Tone, "plan">, { text: string; icon: typeof ArrowDown; className: string }> = {
  down: { text: "легче", icon: ArrowDown, className: "bg-bubblegum-pink" },
  hold: { text: "повтор", icon: Equal, className: "bg-buttery-yellow" },
  up: { text: "больше", icon: ArrowUp, className: "bg-matcha-cream" },
};

function ExerciseIcon({ ex, className }: { ex: Exercise; className?: string }) {
  if (ex.unit === "sec") return <Timer className={className} />;
  if (ex.unit === "min") return <Wind className={className} />;
  if (ex.step > 0) return <Dumbbell className={className} />;
  return <PersonStanding className={className} />;
}

export function ExerciseCard({
  ex,
  suggestion,
  open,
  onToggle,
  today,
  history,
  swap,
  onLog,
  index,
}: {
  ex: Exercise;
  suggestion: Suggestion;
  open: boolean;
  onToggle: () => void;
  /** Записи этого упражнения за сегодня */
  today: Entry[];
  /** Прошлые записи, новые сверху */
  history: Entry[];
  swap?: { label: string; onSwap: () => void };
  onLog: (values: Pick<Entry, "weight" | "sets" | "reps" | "pain" | "effort" | "notes">) => void;
  index: number;
}) {
  const done = today.length > 0;
  const muscle = muscles[ex.muscle];
  const badge = suggestion.tone !== "plan" ? toneBadge[suggestion.tone] : null;
  const [burst, setBurst] = useState(0);
  const ref = useRef<HTMLElement>(null);

  // Правки формы хранятся в черновике: переживают переход к другому упражнению и перезагрузку
  const { draft, save, clear } = useDraft(ex.id);
  const defaults: Draft = {
    weight: suggestion.weight,
    sets: suggestion.sets,
    reps: suggestion.reps,
    pain: history[0]?.pain ?? 0,
    effort: 5,
    notes: "",
  };
  // Слияние с defaults: черновик старого формата (без effort) не ломает форму
  const values: Draft = { ...defaults, ...draft };
  const modified = !!draft && (Object.keys(defaults) as (keyof Draft)[]).some((k) => values[k] !== defaults[k]);

  // Раскрытую карточку подтягиваем в кадр, когда она открылась сама после «Сделано»
  useEffect(() => {
    if (open) setTimeout(() => ref.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }), 340);
  }, [open]);

  return (
    <article
      ref={ref}
      className={clsx(
        "rise relative rounded-md text-card-foreground transition-colors duration-300",
        done ? "bg-[color-mix(in_srgb,var(--matcha-cream)_45%,var(--bone-white))]" : "bg-card",
      )}
      style={{ animationDelay: `${index * 40}ms` }}
    >
      {burst > 0 && <Confetti key={burst} />}

      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full cursor-pointer items-center gap-3 p-4 text-left"
      >
        <span
          className="relative grid size-11 shrink-0 place-items-center rounded-full text-ink"
          style={{ background: muscle.color }}
        >
          {done ? <Check className="pop-in size-6" strokeWidth={3} /> : <ExerciseIcon ex={ex} className="size-5" />}
        </span>

        <span className="flex min-w-0 flex-1 flex-col gap-1">
          <span className={clsx("line-clamp-2 text-[17px] font-bold leading-tight", done && "line-through decoration-2 opacity-70")}>
            {ex.short}
          </span>
          <span className="flex items-center gap-2">
            <span className="mono-label text-muted-foreground">{muscle.label}</span>
            {badge && (
              <span className={clsx("mono-label inline-flex items-center gap-1 rounded-full px-2 py-1 text-ink", badge.className)}>
                <badge.icon className="size-3" strokeWidth={3} />
                {badge.text}
              </span>
            )}
            {modified && (
              <span className="mono-label inline-flex items-center gap-1 rounded-full bg-[var(--lilac)] px-2 py-1 text-ink">
                <Pencil className="size-3" strokeWidth={3} />
                изменено
              </span>
            )}
          </span>
        </span>

        <span className="flex shrink-0 flex-col items-end gap-1">
          {ex.step > 0 && (
            <span className="display text-2xl tabular-nums">
              {values.weight > 0 ? (
                <>
                  {num(values.weight)}
                  <span className="ml-0.5 text-base">кг</span>
                </>
              ) : (
                <span className="text-lg">без веса</span>
              )}
            </span>
          )}
          <span className={clsx("font-mono text-sm text-muted-foreground", ex.step === 0 && "text-base font-bold text-ink")}>
            {setsReps(ex, values.sets, values.reps)}
          </span>
        </span>

        <ChevronDown
          className={clsx("size-5 shrink-0 text-muted-foreground transition-transform duration-300", open && "rotate-180")}
        />
      </button>

      <div className="collapse-grid" data-open={open}>
        <div>
          {open && (
            <Details
              ex={ex}
              suggestion={suggestion}
              today={today}
              history={history}
              swap={swap}
              values={values}
              defaults={defaults}
              modified={modified}
              onChange={(patch) => save({ ...values, ...patch })}
              onReset={clear}
              onLog={(v) => {
                onLog(v);
                clear();
                setBurst((b) => b + 1);
              }}
            />
          )}
        </div>
      </div>
    </article>
  );
}

function Details({
  ex,
  suggestion,
  today,
  history,
  swap,
  values,
  defaults,
  modified,
  onChange,
  onReset,
  onLog,
}: {
  ex: Exercise;
  suggestion: Suggestion;
  today: Entry[];
  history: Entry[];
  swap?: { label: string; onSwap: () => void };
  values: Draft;
  defaults: Draft;
  modified: boolean;
  onChange: (patch: Partial<Draft>) => void;
  onReset: () => void;
  onLog: (values: Pick<Entry, "weight" | "sets" | "reps" | "pain" | "effort" | "notes">) => void;
}) {
  const { weight, sets, reps, pain, effort, notes } = values;

  const repsStep = ex.unit === "sec" ? 5 : 1;

  return (
    <div className="flex flex-col gap-5 px-[17px] pb-[17px]">
      <div className="flex items-start gap-2 rounded-md bg-muted p-3 text-sm">
        <Sparkles className="mt-0.5 size-4 shrink-0 text-[var(--magenta-punch)]" />
        <span>
          <b>{suggestion.reason}.</b>{" "}
          {suggestion.label && <span className="text-muted-foreground">{suggestion.label}.</span>}
        </span>
      </div>

      <section className="flex flex-col gap-2">
        <h3 className="mono-label text-muted-foreground">Нюансы</h3>
        <ul className="flex flex-col gap-2">
          {ex.tips.map((tip, i) => (
            <li key={tip} className="flex gap-3 text-[15px] leading-snug">
              <span className="grid size-6 shrink-0 place-items-center rounded-full bg-ink font-mono text-xs font-bold text-ink-foreground">
                {i + 1}
              </span>
              <span className="pt-0.5">{tip}</span>
            </li>
          ))}
        </ul>
        {swap && (
          <Button variant="outline" size="sm" className="mt-1 self-start" onClick={swap.onSwap}>
            <Repeat2 />
            {swap.label}
          </Button>
        )}
      </section>

      {history.length > 0 && (
        <section className="flex flex-col gap-2">
          <h3 className="mono-label text-muted-foreground">Прошлые разы</h3>
          <ul className="flex flex-col gap-1.5">
            {history.slice(0, 3).map((e) => (
              <li key={e.id} className="flex items-center justify-between gap-3 font-mono text-sm">
                <span className="text-muted-foreground">{formatDay(e.date, { weekday: undefined, month: "short" })}</span>
                <span className="flex-1 truncate text-right">
                  {ex.step > 0 && `${weightText(e.weight)} · `}
                  {setsReps(ex, e.sets, e.reps)}
                </span>
                <PainDot pain={e.pain} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="flex flex-col gap-4 rounded-md border-2 border-dashed border-border p-3">
        {today.length > 0 && (
          <p className="flex items-center gap-2 text-sm font-semibold">
            <Check className="size-4" strokeWidth={3} />
            Сегодня записано: {today.map((e) => `${ex.step > 0 ? `${num(e.weight)} кг · ` : ""}${e.sets}×${e.reps}`).join(", ")}
          </p>
        )}
        {modified && (
          <div className="pop-in flex flex-wrap items-center justify-between gap-2 rounded-md bg-[color-mix(in_srgb,var(--lilac)_45%,var(--bone-white))] p-2 pl-3">
            <span className="text-sm">
              Изменено вручную. По умолчанию:{" "}
              <b className="font-mono whitespace-nowrap">
                {ex.step > 0 && `${weightText(defaults.weight)} · `}
                {setsReps(ex, defaults.sets, defaults.reps)}
              </b>
            </span>
            <Button variant="outline" size="sm" onClick={onReset}>
              <RotateCcw />
              Вернуть по умолчанию
            </Button>
          </div>
        )}
        <div className={clsx("grid gap-3", ex.step > 0 ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-2")}>
          {ex.step > 0 && <Stepper label="Вес" unit="кг" value={weight} step={ex.step} onChange={(v) => onChange({ weight: v })} />}
          <Stepper label="Подходы" value={sets} min={1} onChange={(v) => onChange({ sets: v })} />
          <Stepper
            label={ex.unit === "reps" ? (ex.perSide ? "Повторы / сторона" : "Повторы") : "Время"}
            unit={ex.unit === "reps" ? undefined : unitShort[ex.unit]}
            value={reps}
            min={1}
            step={repsStep}
            onChange={(v) => onChange({ reps: v })}
          />
        </div>

        <label className="flex flex-col gap-3">
          <span className="flex items-baseline justify-between gap-2">
            <span className="mono-label text-muted-foreground">Сложность</span>
            <span className="text-right font-mono text-sm">
              <b className="text-lg">{effort}</b>/10 · {effortLabel(effort)}
              {effort >= HARD_MIN && <span className="text-muted-foreground"> · повторим вес</span>}
              {effort <= EASY_MAX && <span className="text-muted-foreground"> · добавим повторы</span>}
            </span>
          </span>
          <input
            type="range"
            min={0}
            max={10}
            value={effort}
            onChange={(e) => onChange({ effort: Number(e.target.value) })}
            className="pain-range effort-range"
          />
        </label>

        <label className="flex flex-col gap-3">
          <span className="flex items-baseline justify-between">
            <span className="mono-label text-muted-foreground">Боль в спине</span>
            <span className="font-mono text-sm">
              <b className="text-lg">{pain}</b>/10 {pain >= 4 && <span className="text-destructive">· снизим нагрузку</span>}
            </span>
          </span>
          <input
            type="range"
            min={0}
            max={10}
            value={pain}
            onChange={(e) => onChange({ pain: Number(e.target.value) })}
            className="pain-range"
          />
        </label>

        <Input placeholder="Заметка: техника, самочувствие…" value={notes} onChange={(e) => onChange({ notes: e.target.value })} />

        <Button
          variant="ink"
          className="w-full"
          onClick={() => {
            onLog({ weight: ex.step > 0 ? weight : 0, sets, reps, pain, effort, notes: notes.trim() });
          }}
        >
          <Check strokeWidth={3} />
          {today.length ? "Записать ещё раз" : "Сделано"}
        </Button>
      </section>
    </div>
  );
}

export function PainDot({ pain }: { pain?: number }) {
  if (pain === undefined) return null;
  const color = pain >= 4 ? "var(--firecracker-red)" : pain >= 2 ? "var(--buttery-yellow)" : "var(--matcha-cream)";
  return (
    <span className="inline-flex shrink-0 items-center gap-1 font-mono text-xs" title="Боль в спине">
      <span className="size-2.5 rounded-full" style={{ background: color }} />
      {pain}
    </span>
  );
}

const confettiColors = ["var(--hi-vis-yellow)", "var(--bubblegum-pink)", "var(--matcha-cream)", "var(--dusk-violet)", "var(--sky)"];
const bits = Array.from({ length: 18 }, (_, i) => {
  const angle = (i / 18) * Math.PI * 2;
  const dist = 60 + ((i * 37) % 50);
  return {
    dx: `${Math.cos(angle) * dist}px`,
    dy: `${Math.sin(angle) * dist - 30}px`,
    rot: `${(i * 67) % 360}deg`,
    color: confettiColors[i % confettiColors.length],
  };
});

function Confetti() {
  return (
    <span className="pointer-events-none absolute top-10 left-10 z-10" aria-hidden>
      {bits.map((b, i) => (
        <span
          key={i}
          className="confetti-bit"
          style={{ background: b.color, "--dx": b.dx, "--dy": b.dy, "--rot": b.rot } as React.CSSProperties}
        />
      ))}
    </span>
  );
}
