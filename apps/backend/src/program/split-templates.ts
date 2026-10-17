import type {
  DayPlan,
  ExerciseTemplate,
  ProgramTemplateData,
} from './program.types';

/**
 * Шаблоны сплитов для здорового взрослого. Базовые упражнения 3×8–12,
 * изолирующие 3×12–15; стартовые веса скромные — дальше их поднимает
 * двойная прогрессия (docs/training-progression.md). id с префиксом, чтобы
 * не пересекаться с упражнениями шаблона «для спины».
 */

const day = (
  gym: DayPlan['gym'],
  title: string,
  workout: string | null = null,
): DayPlan => ({ gym, title, extras: [], workout });

const compound = { targetSets: 3, repsMin: 8, repsMax: 12 };
const isolation = { targetSets: 3, repsMin: 12, repsMax: 15 };

const plank: ExerciseTemplate = {
  id: 'sp-plank',
  name: 'Планка на предплечьях',
  short: 'Планка',
  muscle: 'core',
  group: 'extra',
  unit: 'sec',
  step: 0,
  weeks: [
    { sets: 3, reps: 30 },
    { sets: 3, reps: 40 },
    { sets: 3, reps: 45 },
    { sets: 3, reps: 60 },
  ],
  tips: [
    'Тело — одна прямая линия, без провиса в пояснице.',
    'Живот и ягодицы напряжены, дыши ровно.',
  ],
};

const upper: ExerciseTemplate[] = [
  {
    id: 'ul-bench',
    name: 'Жим штанги лёжа',
    short: 'Жим лёжа',
    muscle: 'chest',
    group: 'main',
    unit: 'reps',
    base: 30,
    step: 2.5,
    ...compound,
    workouts: ['upper'],
    tips: [
      'Лопатки сведены и прижаты к скамье, стопы на полу.',
      'Опускай штангу к низу груди подконтрольно.',
    ],
  },
  {
    id: 'ul-row',
    name: 'Тяга горизонтального блока',
    short: 'Горизонтальная тяга',
    muscle: 'back',
    group: 'main',
    unit: 'reps',
    base: 30,
    step: 2.5,
    ...compound,
    workouts: ['upper'],
    tips: ['Спина ровная, тянем локтями к поясу, без раскачки.'],
  },
  {
    id: 'ul-ohp',
    name: 'Жим гантелей сидя',
    short: 'Жим гантелей сидя',
    muscle: 'shoulders',
    group: 'main',
    unit: 'reps',
    base: 8,
    step: 1,
    ...compound,
    workouts: ['upper'],
    tips: ['Спина прижата к спинке скамьи, без прогиба в пояснице.'],
  },
  {
    id: 'ul-pulldown',
    name: 'Тяга верхнего блока',
    short: 'Верхний блок',
    muscle: 'back',
    group: 'main',
    unit: 'reps',
    base: 30,
    step: 2.5,
    ...compound,
    workouts: ['upper'],
    tips: ['Тяни к верху груди, плечи вниз, корпус почти вертикально.'],
  },
  {
    id: 'ul-curl',
    name: 'Сгибание рук с гантелями',
    short: 'Бицепс',
    muscle: 'arms',
    group: 'main',
    unit: 'reps',
    base: 6,
    step: 1,
    ...isolation,
    workouts: ['upper'],
    tips: ['Локти прижаты к корпусу, без рывков.'],
  },
  {
    id: 'ul-triceps',
    name: 'Разгибание рук на блоке',
    short: 'Трицепс',
    muscle: 'arms',
    group: 'main',
    unit: 'reps',
    base: 15,
    step: 2.5,
    ...isolation,
    workouts: ['upper'],
    tips: ['Локти неподвижны, разгибай до конца.'],
  },
];

const lower: ExerciseTemplate[] = [
  {
    id: 'ul-goblet',
    name: 'Гоблет-присед с гантелью',
    short: 'Гоблет-присед',
    muscle: 'legs',
    group: 'main',
    unit: 'reps',
    base: 12,
    step: 2,
    ...compound,
    workouts: ['lower'],
    tips: [
      'Гантель у груди, спина прямая, колени по направлению носков.',
      'Глубина — пока поясница не начинает округляться.',
    ],
  },
  {
    id: 'ul-rdl',
    name: 'Румынская тяга с гантелями',
    short: 'Румынская тяга',
    muscle: 'glutes',
    group: 'main',
    unit: 'reps',
    base: 12,
    step: 2,
    ...compound,
    workouts: ['lower'],
    tips: [
      'Таз назад, спина ровная, гантели скользят по бёдрам.',
      'Опускайся до натяжения задней поверхности бедра, не ниже.',
    ],
  },
  {
    id: 'ul-legpress',
    name: 'Жим ногами',
    short: 'Жим ногами',
    muscle: 'legs',
    group: 'main',
    unit: 'reps',
    base: 60,
    step: 5,
    ...compound,
    workouts: ['lower'],
    tips: ['Поясница прижата к спинке, колени не сводить внутрь.'],
  },
  {
    id: 'ul-legcurl',
    name: 'Сгибание ног лёжа',
    short: 'Сгибание ног',
    muscle: 'legs',
    group: 'main',
    unit: 'reps',
    base: 20,
    step: 2.5,
    ...isolation,
    workouts: ['lower'],
    tips: ['Таз прижат к скамье, вниз медленно.'],
  },
  {
    id: 'ul-bridge',
    name: 'Ягодичный мост со штангой',
    short: 'Ягодичный мост',
    muscle: 'glutes',
    group: 'main',
    unit: 'reps',
    base: 40,
    step: 5,
    ...isolation,
    workouts: ['lower'],
    tips: ['Наверху задержка на секунду, без прогиба в пояснице.'],
  },
  {
    id: 'ul-calf',
    name: 'Подъём на носки стоя',
    short: 'Икры',
    muscle: 'legs',
    group: 'main',
    unit: 'reps',
    base: 30,
    step: 5,
    ...isolation,
    workouts: ['lower'],
    tips: ['Полная амплитуда, внизу растяжение на секунду.'],
  },
];

const commonRules = [
  'Разминка 5–10 минут и 1–2 лёгких подхода перед первым упражнением.',
  'Оставляй 1–3 повтора в запасе: до отказа — только в последнем подходе изолирующих.',
  'Отдых между подходами базовых упражнений 2–3 минуты, изолирующих — 1–2.',
  'Боль в суставах или спине — остановиться и снизить вес; мышечная усталость — норма.',
];

/** Верх / низ, 4 дня: пн верх, вт низ, чт верх, пт низ. */
export const upperLower: ProgramTemplateData = {
  workouts: [
    { id: 'upper', title: 'Верх' },
    { id: 'lower', title: 'Низ' },
  ],
  exercises: [...upper, ...lower, { ...plank, workouts: [] }],
  rules: commonRules,
  schedule: [
    day('yes', 'Верх', 'upper'),
    day('yes', 'Низ', 'lower'),
    day('no', 'Отдых'),
    day('yes', 'Верх', 'upper'),
    day('yes', 'Низ', 'lower'),
    day('no', 'Отдых'),
    day('no', 'Отдых'),
  ],
};

const pick = (id: string, from: ExerciseTemplate[], newId: string) => ({
  ...from.find((e) => e.id === id)!,
  id: newId,
  workouts: [],
});

/** Фулбади, 3 дня: всё тело пн, ср, пт. По одному упражнению на группу. */
export const fullBody: ProgramTemplateData = {
  workouts: [{ id: 'full', title: 'Всё тело' }],
  exercises: [
    pick('ul-goblet', lower, 'fb-goblet'),
    pick('ul-bench', upper, 'fb-bench'),
    pick('ul-pulldown', upper, 'fb-pulldown'),
    pick('ul-rdl', lower, 'fb-rdl'),
    pick('ul-ohp', upper, 'fb-ohp'),
    pick('ul-row', upper, 'fb-row'),
    { ...plank, id: 'fb-plank', workouts: [] },
  ],
  rules: commonRules,
  schedule: [
    day('yes', 'Всё тело', 'full'),
    day('no', 'Отдых'),
    day('yes', 'Всё тело', 'full'),
    day('no', 'Отдых'),
    day('yes', 'Всё тело', 'full'),
    day('no', 'Отдых'),
    day('no', 'Отдых'),
  ],
};
