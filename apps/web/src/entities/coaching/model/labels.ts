import type { CoachClient, ProgramChange } from './types'

/** Как показывать клиента тренеру: своё имя, имя при создании, логин. */
export const clientName = (c: Pick<CoachClient, 'alias' | 'name' | 'login'>) =>
  c.alias || c.name || c.login

const FIELDS: Record<string, string> = {
  base: 'Рабочий вес',
  step: 'Шаг веса',
  weeks: 'План по неделям',
  days: 'Дни',
  name: 'Название',
  tips: 'Нюансы',
  added: 'Новое упражнение',
  removed: 'Упражнение убрано',
  schedule: 'Дни тренировок',
  rules: 'Правила',
  startDate: 'Старт цикла',
  swaps: 'Замены',
  resetAt: 'Сброс подстройки',
}

export const changeFieldLabel = (c: Pick<ProgramChange, 'field'>) =>
  FIELDS[c.field] ?? c.field

/** Дней без тренировок, после которых клиент подсвечивается. */
export const IDLE_DAYS = 7
