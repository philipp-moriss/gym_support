import type { DayPlan, Group, Muscle, Unit, WeekPlan } from './program.types';

export interface ExerciseTemplate {
  id: string;
  name: string;
  short: string;
  muscle: Muscle;
  group: Group;
  unit: Unit;
  perSide?: boolean;
  base?: number;
  step: number;
  weeks?: WeekPlan[];
  alternativeOf?: string;
  tips: string[];
}

const same = (plan: WeekPlan): WeekPlan[] =>
  Array.from({ length: 4 }, () => ({ ...plan }));

/**
 * Программа из «План тренировок.xlsx»: первый месяц для спины с кифозом.
 * id совпадают с ключами прежней версии приложения — на них ссылаются старые записи.
 */
const backExercises: ExerciseTemplate[] = [
  {
    id: 'bench',
    name: 'Жим штанги лёжа',
    short: 'Жим лёжа',
    muscle: 'chest',
    group: 'main',
    unit: 'reps',
    base: 52.5,
    step: 2.5,
    tips: [
      'Лопатки сведены и прижаты к скамье — так плечам безопасно.',
      'Без сильного прогиба в пояснице, стопы стоят на полу.',
      'Опускай штангу к низу груди подконтрольно, примерно 2 секунды.',
      'Первые две недели не до отказа: оставляй 3–4 повтора в запасе.',
    ],
  },
  {
    id: 'row',
    name: 'Тяга горизонтального блока',
    short: 'Горизонтальная тяга',
    muscle: 'back',
    group: 'main',
    unit: 'reps',
    base: 55,
    step: 2.5,
    tips: [
      'Спина ровная, без округления и раскачки корпусом.',
      'Тяни локтями к поясу, в конце сведи лопатки.',
      'Если снова заболит грудной отдел — замени на тягу гантелей лёжа на наклонной скамье.',
    ],
  },
  {
    id: 'bridge',
    name: 'Ягодичный мост',
    short: 'Ягодичный мост',
    muscle: 'glutes',
    group: 'main',
    unit: 'reps',
    base: 115,
    step: 2.5,
    tips: [
      'Лопатки упираются в скамью, голени вертикально в верхней точке.',
      'Наверху рёбра вниз, без прогиба в пояснице — работают ягодицы, не спина.',
      'Пауза 1 секунда наверху, сожми ягодицы.',
    ],
  },
  {
    id: 'adduction',
    name: 'Сведение ног',
    short: 'Сведение ног',
    muscle: 'legs',
    group: 'main',
    unit: 'reps',
    base: 45,
    step: 2.5,
    tips: [
      'Спина прижата к спинке тренажёра.',
      'Плавно, без рывков — особенно когда разводишь ноги обратно.',
    ],
  },
  {
    id: 'pulldown',
    name: 'Тяга вертикального блока',
    short: 'Вертикальная тяга',
    muscle: 'back',
    group: 'main',
    unit: 'reps',
    base: 45,
    step: 2.5,
    tips: [
      'Тяни к верху груди, не за голову.',
      'Корпус почти вертикально, без раскачки.',
      'Начинай движение с опускания лопаток.',
    ],
  },
  {
    id: 'legcurl',
    name: 'Сгибание ног лёжа',
    short: 'Сгибание ног',
    muscle: 'legs',
    group: 'main',
    unit: 'reps',
    base: 20,
    step: 2.5,
    tips: [
      'Таз прижат к скамье, не отрывай его.',
      'Вверх энергично, вниз медленно — 2–3 секунды.',
    ],
  },
  {
    id: 'bridge1',
    name: 'Ягодичный мост на одной ноге',
    short: 'Мост на одной ноге',
    muscle: 'glutes',
    group: 'main',
    unit: 'reps',
    perSide: true,
    step: 2.5,
    alternativeOf: 'bridge',
    weeks: [
      { sets: 3, reps: 12, weight: 0, label: 'Без веса' },
      { sets: 3, reps: 15, weight: 0, label: 'Без веса' },
      { sets: 3, reps: 12, weight: 5, label: 'Блин 5 кг' },
      { sets: 3, reps: 12, weight: 5, label: 'Блин 5–10 кг' },
    ],
    tips: [
      'Свободную ногу держи согнутой.',
      'Таз ровно, не заваливай его в сторону.',
      'Повторы — на каждую ногу.',
    ],
  },
  {
    id: 'revfly',
    name: 'Разведения рук лёжа на животе',
    short: 'Разведения на животе',
    muscle: 'posture',
    group: 'main',
    unit: 'reps',
    step: 0.5,
    weeks: [
      { sets: 3, reps: 15, weight: 0, label: 'Без веса' },
      { sets: 3, reps: 15, weight: 1, label: 'Гантели 1–2 кг' },
      { sets: 3, reps: 15, weight: 2, label: 'Гантели 2 кг' },
      { sets: 3, reps: 15, weight: 2, label: 'Гантели 2–3 кг' },
    ],
    tips: [
      'Грудь опирается на наклонную скамью.',
      'Разводи руки за счёт лопаток, плечи не тянутся к ушам.',
      'Вес лёгкий намеренно: это работа на осанку.',
    ],
  },
  {
    id: 'hyper',
    name: 'Гиперэкстензия',
    short: 'Гиперэкстензия',
    muscle: 'back',
    group: 'extra',
    unit: 'reps',
    step: 0,
    weeks: [
      { sets: 2, reps: 12, label: 'На полу, держать 2 сек' },
      { sets: 3, reps: 12, label: 'На полу' },
      { sets: 2, reps: 12, label: 'Тренажёр до 45°' },
      { sets: 3, reps: 12, repsMax: 15, label: 'Тренажёр до 45°' },
    ],
    tips: [
      'Без веса.',
      'Вниз до 45°, вверх только до прямой линии.',
      'Без прогиба назад в верхней точке.',
    ],
  },
  {
    id: 'plank',
    name: 'Планка',
    short: 'Планка',
    muscle: 'core',
    group: 'extra',
    unit: 'sec',
    step: 0,
    weeks: [
      { sets: 3, reps: 20 },
      { sets: 3, reps: 30 },
      { sets: 3, reps: 40 },
      { sets: 3, reps: 45 },
    ],
    tips: [
      'Тело одной линией: таз не проваливается и не задирается.',
      'Дыши ровно, не задерживай дыхание.',
    ],
  },
  {
    id: 'birddog',
    name: 'Bird dog (птица-собака)',
    short: 'Bird dog',
    muscle: 'core',
    group: 'extra',
    unit: 'reps',
    perSide: true,
    step: 0,
    weeks: [
      { sets: 2, reps: 8 },
      { sets: 3, reps: 8 },
      { sets: 3, reps: 10 },
      { sets: 3, reps: 10 },
    ],
    tips: [
      'Спина неподвижна, как столешница.',
      'Вытягивай руку и противоположную ногу, задержись на 2 секунды.',
      'Повторы — на каждую сторону.',
    ],
  },
  {
    id: 'chest',
    name: 'Растяжка грудных мышц',
    short: 'Растяжка груди',
    muscle: 'mobility',
    group: 'extra',
    unit: 'sec',
    step: 0,
    weeks: same({ sets: 2, reps: 30 }),
    tips: [
      'В дверном проёме, локти чуть ниже плеч.',
      'Мягкое натяжение без боли, дыши спокойно.',
    ],
  },
  {
    id: 'breath',
    name: 'Дыхательная гимнастика',
    short: 'Дыхание',
    muscle: 'mobility',
    group: 'extra',
    unit: 'min',
    step: 0,
    weeks: same({ sets: 1, reps: 5 }),
    tips: ['Вдох носом в нижние рёбра, выдох длиннее вдоха.'],
  },
];

const backRules = [
  'Без осевой нагрузки на позвоночник: никаких приседаний со штангой, становой тяги, жима стоя.',
  'Силовые упражнения по возможности лёжа или сидя с опорой для спины.',
  'Первые две недели не работать до отказа, оставлять 3–4 повтора в запасе.',
  'Боль в позвоночнике во время упражнения: остановиться, снизить вес или убрать упражнение.',
  'Тяга горизонтального блока: спина ровная, без округления и раскачки. Если грудной отдел снова болит, заменить на тягу гантелей лёжа на наклонной скамье.',
  'Гиперэкстензия: без веса, вниз до 45°, вверх до прямой линии, без прогиба назад.',
  'Жим лёжа: лопатки сведены и прижаты к скамье, без сильного прогиба.',
  'По рекомендации врача противопоказаны бег, прыжки и физический труд с подъёмом тяжестей.',
  'Если неделя прошла тяжело, повторить её, а не переходить к следующей.',
  'Регулярно показываться ортопеду: угол кифоза нужно отслеживать.',
];

const backSchedule: DayPlan[] = [
  { gym: 'yes', title: 'Зал', extras: [] },
  { gym: 'no', title: 'Отдых', extras: ['Испанский вечером'] },
  { gym: 'optional', title: 'Зал по желанию', extras: ['Бачата вечером'] },
  { gym: 'no', title: 'Отдых', extras: ['Испанский вечером'] },
  { gym: 'yes', title: 'Зал', extras: [] },
  { gym: 'no', title: 'Дайвинг', extras: [] },
  { gym: 'no', title: 'Дайвинг', extras: [] },
];

/** Пустая программа: три дня в зале, упражнения пользователь добавит сам. */
export const defaultSchedule = (): DayPlan[] =>
  [0, 1, 2, 3, 4, 5, 6].map((i) =>
    i % 2 === 0 && i < 6
      ? { gym: 'yes', title: 'Зал', extras: [] }
      : { gym: 'no', title: 'Отдых', extras: [] },
  );

export const templates = {
  back: { exercises: backExercises, rules: backRules, schedule: backSchedule },
  empty: {
    exercises: [] as ExerciseTemplate[],
    rules: [] as string[],
    schedule: defaultSchedule(),
  },
};
