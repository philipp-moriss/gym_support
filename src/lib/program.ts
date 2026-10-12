/*
 * Программа из «План тренировок.xlsx»: упражнения, базовые веса,
 * проценты по неделям, расписание и правила безопасности.
 */

export type Unit = "reps" | "sec" | "min";
export type Group = "main" | "extra";

export type Muscle = "chest" | "back" | "glutes" | "legs" | "posture" | "core" | "mobility";

export const muscles: Record<Muscle, { label: string; color: string }> = {
  chest: { label: "Грудь", color: "var(--bubblegum-pink)" },
  back: { label: "Спина", color: "var(--dusk-violet)" },
  glutes: { label: "Ягодицы", color: "var(--buttery-yellow)" },
  legs: { label: "Ноги", color: "var(--matcha-cream)" },
  posture: { label: "Осанка", color: "var(--sky)" },
  core: { label: "Кор", color: "var(--hi-vis-yellow)" },
  mobility: { label: "Мобильность", color: "var(--lilac)" },
};

export type WeekPlan = {
  sets: number;
  reps: number;
  repsMax?: number;
  /** кг; для упражнений без базы — из плана */
  weight?: number;
  /** подпись из плана: «Гантели 1–2 кг», «На полу» */
  label?: string;
};

export type Exercise = {
  id: string;
  name: string;
  short: string;
  muscle: Muscle;
  group: Group;
  unit: Unit;
  perSide?: boolean;
  /** Последний рабочий вес — от него считаются недели. */
  base?: number;
  /** Шаг изменения веса в степпере */
  step: number;
  /** План по неделям, если вес не считается от базы */
  weeks?: WeekPlan[];
  /** id упражнения, которое это заменяет */
  alternativeOf?: string;
  tips: string[];
};

/** Проценты от последнего веса и схема подходов для упражнений с базой. */
export const WEEK_PERCENT = [0.55, 0.65, 0.75, 0.85];
const MAIN_SCHEME: WeekPlan[] = [
  { sets: 3, reps: 12, repsMax: 15 },
  { sets: 3, reps: 12, repsMax: 15 },
  { sets: 4, reps: 12, repsMax: 15 },
  { sets: 4, reps: 15 },
];
export const CYCLE_WEEKS = 4;

export const exercises: Exercise[] = [
  {
    id: "bench",
    name: "Жим штанги лёжа",
    short: "Жим лёжа",
    muscle: "chest",
    group: "main",
    unit: "reps",
    base: 52.5,
    step: 2.5,
    tips: [
      "Лопатки сведены и прижаты к скамье — так плечам безопасно.",
      "Без сильного прогиба в пояснице, стопы стоят на полу.",
      "Опускай штангу к низу груди подконтрольно, примерно 2 секунды.",
      "Первые две недели не до отказа: оставляй 3–4 повтора в запасе.",
    ],
  },
  {
    id: "row",
    name: "Тяга горизонтального блока",
    short: "Горизонтальная тяга",
    muscle: "back",
    group: "main",
    unit: "reps",
    base: 55,
    step: 2.5,
    tips: [
      "Спина ровная, без округления и раскачки корпусом.",
      "Тяни локтями к поясу, в конце сведи лопатки.",
      "Если снова заболит грудной отдел — замени на тягу гантелей лёжа на наклонной скамье.",
    ],
  },
  {
    id: "bridge",
    name: "Ягодичный мост",
    short: "Ягодичный мост",
    muscle: "glutes",
    group: "main",
    unit: "reps",
    base: 115,
    step: 2.5,
    tips: [
      "Лопатки упираются в скамью, голени вертикально в верхней точке.",
      "Наверху рёбра вниз, без прогиба в пояснице — работают ягодицы, не спина.",
      "Пауза 1 секунда наверху, сожми ягодицы.",
    ],
  },
  {
    id: "adduction",
    name: "Сведение ног",
    short: "Сведение ног",
    muscle: "legs",
    group: "main",
    unit: "reps",
    base: 45,
    step: 2.5,
    tips: [
      "Спина прижата к спинке тренажёра.",
      "Плавно, без рывков — особенно когда разводишь ноги обратно.",
    ],
  },
  {
    id: "pulldown",
    name: "Тяга вертикального блока",
    short: "Вертикальная тяга",
    muscle: "back",
    group: "main",
    unit: "reps",
    base: 45,
    step: 2.5,
    tips: [
      "Тяни к верху груди, не за голову.",
      "Корпус почти вертикально, без раскачки.",
      "Начинай движение с опускания лопаток.",
    ],
  },
  {
    id: "legcurl",
    name: "Сгибание ног лёжа",
    short: "Сгибание ног",
    muscle: "legs",
    group: "main",
    unit: "reps",
    base: 20,
    step: 2.5,
    tips: [
      "Таз прижат к скамье, не отрывай его.",
      "Вверх энергично, вниз медленно — 2–3 секунды.",
    ],
  },
  {
    id: "bridge1",
    name: "Ягодичный мост на одной ноге",
    short: "Мост на одной ноге",
    muscle: "glutes",
    group: "main",
    unit: "reps",
    perSide: true,
    step: 2.5,
    alternativeOf: "bridge",
    weeks: [
      { sets: 3, reps: 12, weight: 0, label: "Без веса" },
      { sets: 3, reps: 15, weight: 0, label: "Без веса" },
      { sets: 3, reps: 12, weight: 5, label: "Блин 5 кг" },
      { sets: 3, reps: 12, weight: 5, label: "Блин 5–10 кг" },
    ],
    tips: [
      "Свободную ногу держи согнутой.",
      "Таз ровно, не заваливай его в сторону.",
      "Повторы — на каждую ногу.",
    ],
  },
  {
    id: "revfly",
    name: "Разведения рук лёжа на животе",
    short: "Разведения на животе",
    muscle: "posture",
    group: "main",
    unit: "reps",
    step: 0.5,
    weeks: [
      { sets: 3, reps: 15, weight: 0, label: "Без веса" },
      { sets: 3, reps: 15, weight: 1, label: "Гантели 1–2 кг" },
      { sets: 3, reps: 15, weight: 2, label: "Гантели 2 кг" },
      { sets: 3, reps: 15, weight: 2, label: "Гантели 2–3 кг" },
    ],
    tips: [
      "Грудь опирается на наклонную скамью.",
      "Разводи руки за счёт лопаток, плечи не тянутся к ушам.",
      "Вес лёгкий намеренно: это работа на осанку.",
    ],
  },
  {
    id: "hyper",
    name: "Гиперэкстензия",
    short: "Гиперэкстензия",
    muscle: "back",
    group: "extra",
    unit: "reps",
    step: 0,
    weeks: [
      { sets: 2, reps: 12, label: "На полу, держать 2 сек" },
      { sets: 3, reps: 12, label: "На полу" },
      { sets: 2, reps: 12, label: "Тренажёр до 45°" },
      { sets: 3, reps: 12, repsMax: 15, label: "Тренажёр до 45°" },
    ],
    tips: [
      "Без веса.",
      "Вниз до 45°, вверх только до прямой линии.",
      "Без прогиба назад в верхней точке.",
    ],
  },
  {
    id: "plank",
    name: "Планка",
    short: "Планка",
    muscle: "core",
    group: "extra",
    unit: "sec",
    step: 0,
    weeks: [
      { sets: 3, reps: 20 },
      { sets: 3, reps: 30 },
      { sets: 3, reps: 40 },
      { sets: 3, reps: 45 },
    ],
    tips: [
      "Тело одной линией: таз не проваливается и не задирается.",
      "Дыши ровно, не задерживай дыхание.",
    ],
  },
  {
    id: "birddog",
    name: "Bird dog (птица-собака)",
    short: "Bird dog",
    muscle: "core",
    group: "extra",
    unit: "reps",
    perSide: true,
    step: 0,
    weeks: [
      { sets: 2, reps: 8 },
      { sets: 3, reps: 8 },
      { sets: 3, reps: 10 },
      { sets: 3, reps: 10 },
    ],
    tips: [
      "Спина неподвижна, как столешница.",
      "Вытягивай руку и противоположную ногу, задержись на 2 секунды.",
      "Повторы — на каждую сторону.",
    ],
  },
  {
    id: "chest",
    name: "Растяжка грудных мышц",
    short: "Растяжка груди",
    muscle: "mobility",
    group: "extra",
    unit: "sec",
    step: 0,
    weeks: Array.from({ length: 4 }, () => ({ sets: 2, reps: 30 })),
    tips: [
      "В дверном проёме, локти чуть ниже плеч.",
      "Мягкое натяжение без боли, дыши спокойно.",
    ],
  },
  {
    id: "breath",
    name: "Дыхательная гимнастика",
    short: "Дыхание",
    muscle: "mobility",
    group: "extra",
    unit: "min",
    step: 0,
    weeks: Array.from({ length: 4 }, () => ({ sets: 1, reps: 5 })),
    tips: ["Вдох носом в нижние рёбра, выдох длиннее вдоха."],
  },
];

export const exerciseById = new Map(exercises.map((e) => [e.id, e]));

export const rules = [
  "Без осевой нагрузки на позвоночник: никаких приседаний со штангой, становой тяги, жима стоя.",
  "Силовые упражнения по возможности лёжа или сидя с опорой для спины.",
  "Первые две недели не работать до отказа, оставлять 3–4 повтора в запасе.",
  "Боль в позвоночнике во время упражнения: остановиться, снизить вес или убрать упражнение.",
  "Тяга горизонтального блока: спина ровная, без округления и раскачки. Если грудной отдел снова болит, заменить на тягу гантелей лёжа на наклонной скамье.",
  "Гиперэкстензия: без веса, вниз до 45°, вверх до прямой линии, без прогиба назад.",
  "Жим лёжа: лопатки сведены и прижаты к скамье, без сильного прогиба.",
  "По рекомендации врача противопоказаны бег, прыжки и физический труд с подъёмом тяжестей.",
  "Если неделя прошла тяжело, повторить её, а не переходить к следующей.",
  "Регулярно показываться ортопеду: угол кифоза нужно отслеживать.",
];

/** Расписание по дням недели (0 — понедельник). */
export type DayPlan = { gym: "yes" | "optional" | "no"; title: string; extras: string[] };
export const schedule: DayPlan[] = [
  { gym: "yes", title: "Зал", extras: [] },
  { gym: "no", title: "Отдых", extras: ["Испанский вечером"] },
  { gym: "optional", title: "Зал по желанию", extras: ["Бачата вечером"] },
  { gym: "no", title: "Отдых", extras: ["Испанский вечером"] },
  { gym: "yes", title: "Зал", extras: [] },
  { gym: "no", title: "Дайвинг", extras: [] },
  { gym: "no", title: "Дайвинг", extras: [] },
];
export const weekdayShort = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

/* ——— даты ——— */

export const toIso = (d: Date) =>
  new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
export const fromIso = (iso: string) => new Date(`${iso}T00:00:00`);
export const todayIso = () => toIso(new Date());
/** 0 — понедельник */
export const weekday = (iso: string) => (fromIso(iso).getDay() + 6) % 7;
export const mondayOf = (iso: string) => {
  const d = fromIso(iso);
  d.setDate(d.getDate() - weekday(iso));
  return toIso(d);
};
export const addDays = (iso: string, days: number) => {
  const d = fromIso(iso);
  d.setDate(d.getDate() + days);
  return toIso(d);
};

/** Номер недели программы, начиная с 1. */
export function programWeek(startIso: string, dateIso: string) {
  const days = Math.round((fromIso(dateIso).getTime() - fromIso(startIso).getTime()) / 86_400_000);
  return Math.max(1, Math.floor(days / 7) + 1);
}

/* ——— веса ——— */

export const mround = (n: number, step = 2.5) => Math.round(n / step) * step;

export function planFor(ex: Exercise, week: number, bases: Record<string, number>): WeekPlan {
  const i = Math.min(week, CYCLE_WEEKS) - 1;
  if (ex.weeks) return ex.weeks[i];
  const base = bases[ex.id] ?? ex.base ?? 0;
  return { ...MAIN_SCHEME[i], weight: mround(base * WEEK_PERCENT[i]) };
}
