import { useCallback, useSyncExternalStore } from "react";
import { mondayOf, todayIso } from "./program";

/** Старый формат «как пошло» — встречается в ранних записях. */
export type Feel = "easy" | "ok" | "hard";

export type Entry = {
  id: string;
  /** YYYY-MM-DD */
  date: string;
  /** Неделя программы на момент записи */
  week?: number;
  exerciseId?: string;
  exercise: string;
  sets: number;
  /** Повторы, секунды или минуты — смотря что у упражнения */
  reps: number;
  /** кг, 0 — без веса */
  weight: number;
  /** Боль в спине 0–10 */
  pain?: number;
  /** Сложность 0–10 */
  effort?: number;
  /** @deprecated старый формат; при загрузке переводится в effort */
  feel?: Feel;
  notes: string;
};

export type Settings = {
  /** Понедельник первой недели цикла */
  startDate: string;
  /** Последний рабочий вес по упражнениям */
  bases: Record<string, number>;
  /** Упражнение заменено альтернативой: bridge → bridge1 */
  swaps: Record<string, string>;
  /** С этой даты записи снова влияют на подстройку весов; более ранние игнорируются */
  resetAt?: string;
};

/**
 * Маленькое хранилище в localStorage с подпиской для useSyncExternalStore.
 * migrate приводит старые данные к текущему формату; если он что-то поменял,
 * результат сразу записывается обратно — миграция проходит один раз.
 */
function createStore<T>(key: string, init: () => T, migrate?: (data: T) => T) {
  let cache: T | null = null;
  const listeners = new Set<() => void>();

  const get = (): T => {
    if (cache) return cache;
    try {
      const raw = localStorage.getItem(key);
      const parsed = raw ? (JSON.parse(raw) as T) : init();
      cache = migrate ? migrate(parsed) : parsed;
      if (raw && cache !== parsed) localStorage.setItem(key, JSON.stringify(cache));
    } catch {
      cache = init();
    }
    return cache;
  };

  const set = (next: T) => {
    cache = next;
    try {
      localStorage.setItem(key, JSON.stringify(next));
    } catch {
      // Хранилище недоступно (приватный режим) — данные живут до перезагрузки.
    }
    listeners.forEach((l) => l());
  };

  const subscribe = (listener: () => void) => {
    listeners.add(listener);
    const onStorage = (e: StorageEvent) => {
      if (e.key !== key) return;
      cache = null;
      listener();
    };
    window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(listener);
      window.removeEventListener("storage", onStorage);
    };
  };

  return { get, set, subscribe };
}

/** «Легко / норм / тяжело» из ранних версий → сложность 0–10. */
const legacyEffort: Record<Feel, number> = { easy: 3, ok: 5, hard: 9 };

/** Убирает feel, переводя его в effort. Возвращает тот же объект, если менять нечего. */
function migrateFeel<T extends { feel?: Feel; effort?: number }>(item: T): T {
  if (!("feel" in item)) return item;
  const { feel, ...rest } = item;
  return { ...rest, effort: item.effort ?? (feel ? legacyEffort[feel] : 5) } as T;
}

const entriesStore = createStore<Entry[]>(
  "training-journal:v1",
  () => [],
  (entries) => (entries.some((e) => "feel" in e) ? entries.map(migrateFeel) : entries),
);
const defaultSettings = (): Settings => ({
  startDate: mondayOf(todayIso()),
  bases: {},
  swaps: {},
});
const settingsStore = createStore<Settings>("training-settings:v1", defaultSettings);

/** Записи, которые учитывает автоподстройка: всё после последнего сброса. */
export function adaptiveEntries(entries: Entry[], settings: Settings) {
  return settings.resetAt ? entries.filter((e) => e.date >= settings.resetAt!) : entries;
}

/** Несохранённые правки формы упражнения за сегодня. */
export type Draft = Pick<Entry, "weight" | "sets" | "reps" | "notes"> & { pain: number; effort: number };
type Drafts = { date: string; items: Record<string, Draft> };
const draftsStore = createStore<Drafts>(
  "training-drafts:v1",
  () => ({ date: todayIso(), items: {} }),
  (drafts) =>
    Object.values(drafts.items).some((d) => "feel" in d)
      ? { ...drafts, items: Object.fromEntries(Object.entries(drafts.items).map(([id, d]) => [id, migrateFeel(d as Draft & { feel?: Feel })])) }
      : drafts,
);

/** Черновики живут только в свой день: вчерашние правки сегодня не подставляем. */
const todaysDrafts = () => {
  const cur = draftsStore.get();
  return cur.date === todayIso() ? cur.items : {};
};

export function useDraft(exerciseId: string) {
  const drafts = useSyncExternalStore(draftsStore.subscribe, draftsStore.get, draftsStore.get);
  const draft = drafts.date === todayIso() ? drafts.items[exerciseId] : undefined;

  const save = useCallback(
    (d: Draft) => draftsStore.set({ date: todayIso(), items: { ...todaysDrafts(), [exerciseId]: d } }),
    [exerciseId],
  );
  const clear = useCallback(() => {
    const items = Object.fromEntries(Object.entries(todaysDrafts()).filter(([id]) => id !== exerciseId));
    draftsStore.set({ date: todayIso(), items });
  }, [exerciseId]);

  return { draft, save, clear };
}

/** Полный сброс: записи, настройки и черновики. */
export function resetAll() {
  entriesStore.set([]);
  settingsStore.set(defaultSettings());
  draftsStore.set({ date: todayIso(), items: {} });
}

const EMPTY: Entry[] = [];

/** Сложность 0–10; feel встречается, только если запись пришла в обход хранилища. */
export function effortOf(e: Pick<Entry, "effort" | "feel">) {
  return e.effort ?? (e.feel ? legacyEffort[e.feel] : undefined);
}

/** Пороги сложности: до 4 — легко, от 8 — тяжело. */
export const EASY_MAX = 4;
export const HARD_MIN = 8;

export function effortLabel(n: number) {
  if (n <= 2) return "очень легко";
  if (n <= EASY_MAX) return "легко";
  if (n < HARD_MIN) return "норм";
  if (n < 10) return "тяжело";
  return "на пределе";
}

/** Новые сверху: по дате, затем по порядку добавления. */
export function sortEntries(entries: Entry[]) {
  return entries.toSorted((a, b) => b.date.localeCompare(a.date));
}

export function volume(e: Entry) {
  return e.sets * e.reps * e.weight;
}

export function useEntries() {
  const entries = useSyncExternalStore(entriesStore.subscribe, entriesStore.get, () => EMPTY);

  const add = useCallback((entry: Omit<Entry, "id">) => {
    entriesStore.set([{ ...entry, id: crypto.randomUUID() }, ...entriesStore.get()]);
  }, []);

  const remove = useCallback((id: string) => {
    entriesStore.set(entriesStore.get().filter((e) => e.id !== id));
  }, []);

  return { entries, add, remove };
}

export function useSettings() {
  const settings = useSyncExternalStore(settingsStore.subscribe, settingsStore.get, settingsStore.get);
  const update = useCallback((patch: Partial<Settings>) => {
    settingsStore.set({ ...settingsStore.get(), ...patch });
  }, []);
  return { settings, update };
}
