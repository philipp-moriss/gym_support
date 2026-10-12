import { useCallback, useSyncExternalStore } from "react";
import { mondayOf, todayIso } from "./program";

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

/** Маленькое хранилище в localStorage с подпиской для useSyncExternalStore. */
function createStore<T>(key: string, init: () => T) {
  let cache: T | null = null;
  const listeners = new Set<() => void>();

  const get = (): T => {
    if (cache) return cache;
    try {
      const raw = localStorage.getItem(key);
      cache = raw ? (JSON.parse(raw) as T) : init();
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

const entriesStore = createStore<Entry[]>("training-journal:v1", () => []);
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

/** Полный сброс: записи и настройки. */
export function resetAll() {
  entriesStore.set([]);
  settingsStore.set(defaultSettings());
}

const EMPTY: Entry[] = [];

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
