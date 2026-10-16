"use client";

import { Download, NotebookPen, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { effortOf, sortEntries, useEntries, useSettings, volume, type Entry } from "@/lib/entries";
import { downloadXlsx } from "@/lib/export-xlsx";
import { formatDay, num, setsReps, weightText } from "@/lib/format";
import { exerciseById, muscles } from "@/lib/program";
import { PainDot } from "./exercise-card";
import { Button, Card } from "./ui";


export function Journal() {
  const { entries, remove } = useEntries();
  const { settings } = useSettings();
  const [exporting, setExporting] = useState(false);

  const groups = useMemo(() => {
    const map = new Map<string, Entry[]>();
    for (const e of sortEntries(entries)) map.set(e.date, [...(map.get(e.date) ?? []), e]);
    return [...map.entries()];
  }, [entries]);

  const totalVolume = entries.reduce((s, e) => s + volume(e), 0);

  async function onExport() {
    setExporting(true);
    try {
      await downloadXlsx(entries, settings.bases);
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-3">
          <span className="mono-label text-stage-muted">Всё, что записано</span>
          <h1 className="display text-5xl text-accent sm:text-6xl">Дневник</h1>
        </div>
        <Button variant="highlight" onClick={onExport} disabled={!entries.length || exporting}>
          <Download />
          {exporting ? "Готовлю…" : "Выгрузить в Excel"}
        </Button>
      </header>

      <div className="grid grid-cols-3 gap-2">
        <Stat label="Тренировок" value={groups.length.toString()} />
        <Stat label="Подходов" value={num(entries.reduce((s, e) => s + e.sets, 0))} />
        <Stat label="Объём, кг" value={num(totalVolume)} />
      </div>

      {groups.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-md border-2 border-dashed border-stage-border p-8 text-center text-stage-muted">
          <NotebookPen className="size-8" />
          <p>Пока пусто. Отметь упражнения на вкладке «Сегодня» — они появятся здесь.</p>
        </div>
      ) : (
        <section className="flex flex-col gap-4">
          {groups.map(([date, items]) => (
            <Card key={date} className="gap-3">
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="display min-w-0 text-2xl first-letter:uppercase">{formatDay(date)}</h2>
                <span className="mono-label shrink-0 text-muted-foreground">
                  {items[0].week ? `Нед. ${items[0].week} · ` : ""}
                  {num(items.reduce((s, e) => s + volume(e), 0))} кг
                </span>
              </div>
              <ul className="flex flex-col">
                {items.map((e) => {
                  const ex = e.exerciseId ? exerciseById.get(e.exerciseId) : undefined;
                  return (
                    <li key={e.id} className="flex items-center gap-3 border-t border-border py-3 first:border-t-0">
                      <span
                        className="size-3 shrink-0 rounded-full"
                        style={{ background: ex ? muscles[ex.muscle].color : "var(--border)" }}
                      />
                      <div className="flex min-w-0 flex-1 flex-col gap-1">
                        <span className="truncate font-semibold">{ex?.short ?? e.exercise}</span>
                        <span className="font-mono text-sm text-muted-foreground">
                          {(!ex || ex.step > 0) && `${weightText(e.weight)} · `}
                          {ex ? setsReps(ex, e.sets, e.reps) : `${e.sets} × ${e.reps}`}
                          {effortOf(e) !== undefined && ` · сложн. ${effortOf(e)}/10`}
                        </span>
                        {e.notes && <span className="text-sm text-muted-foreground">{e.notes}</span>}
                      </div>
                      <PainDot pain={e.pain} />
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Удалить «${e.exercise}»`}
                        onClick={() => remove(e.id)}
                      >
                        <Trash2 />
                      </Button>
                    </li>
                  );
                })}
              </ul>
            </Card>
          ))}
        </section>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-2 rounded-md bg-block p-3 sm:p-4">
      <span className="mono-label text-stage-muted">{label}</span>
      <span className="display truncate text-2xl sm:text-3xl">{value}</span>
    </div>
  );
}
