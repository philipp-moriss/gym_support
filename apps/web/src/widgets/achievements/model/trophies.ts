/**
 * С чем сравниваем поднятый вес. Веса — типичные взрослые особи и модели,
 * округлённо. Формы — для «поднять 1 гориллу / 2 гориллы / 5 горилл».
 */
export type Trophy = {
  id: string
  kg: number
  emoji: string
  name: string
  forms: readonly [string, string, string]
  color: string
}

export const TROPHIES: Trophy[] = [
  {
    id: 'cat',
    kg: 4,
    emoji: '🐈',
    name: 'Кошка',
    forms: ['кошку', 'кошки', 'кошек'],
    color: 'var(--buttery-yellow)',
  },
  {
    id: 'corgi',
    kg: 12,
    emoji: '🐕',
    name: 'Корги',
    forms: ['корги', 'корги', 'корги'],
    color: 'var(--bubblegum-pink)',
  },
  {
    id: 'human',
    kg: 75,
    emoji: '🧍',
    name: 'Человек',
    forms: ['человека', 'человека', 'человек'],
    color: 'var(--sky)',
  },
  {
    id: 'panda',
    kg: 100,
    emoji: '🐼',
    name: 'Панда',
    forms: ['панду', 'панды', 'панд'],
    color: 'var(--matcha-cream)',
  },
  {
    id: 'gorilla',
    kg: 180,
    emoji: '🦍',
    name: 'Горилла',
    forms: ['гориллу', 'гориллы', 'горилл'],
    color: 'var(--lilac)',
  },
  {
    id: 'piano',
    kg: 250,
    emoji: '🎹',
    name: 'Пианино',
    forms: ['пианино', 'пианино', 'пианино'],
    color: 'var(--buttery-yellow)',
  },
  {
    id: 'polar-bear',
    kg: 450,
    emoji: '🐻‍❄️',
    name: 'Белый медведь',
    forms: ['белого медведя', 'белых медведя', 'белых медведей'],
    color: 'var(--sky)',
  },
  {
    id: 'cow',
    kg: 700,
    emoji: '🐄',
    name: 'Корова',
    forms: ['корову', 'коровы', 'коров'],
    color: 'var(--matcha-cream)',
  },
  {
    id: 'giraffe',
    kg: 1200,
    emoji: '🦒',
    name: 'Жираф',
    forms: ['жирафа', 'жирафа', 'жирафов'],
    color: 'var(--buttery-yellow)',
  },
  {
    id: 'car',
    kg: 1400,
    emoji: '🚗',
    name: 'Легковушка',
    forms: ['легковушку', 'легковушки', 'легковушек'],
    color: 'var(--bubblegum-pink)',
  },
  {
    id: 'hippo',
    kg: 2500,
    emoji: '🦛',
    name: 'Бегемот',
    forms: ['бегемота', 'бегемота', 'бегемотов'],
    color: 'var(--lilac)',
  },
  {
    id: 'elephant',
    kg: 6000,
    emoji: '🐘',
    name: 'Слон',
    forms: ['слона', 'слона', 'слонов'],
    color: 'var(--sky)',
  },
  {
    id: 't-rex',
    kg: 8000,
    emoji: '🦖',
    name: 'Тираннозавр',
    forms: ['тираннозавра', 'тираннозавра', 'тираннозавров'],
    color: 'var(--matcha-cream)',
  },
  {
    id: 'bus',
    kg: 12_000,
    emoji: '🚌',
    name: 'Автобус',
    forms: ['автобус', 'автобуса', 'автобусов'],
    color: 'var(--buttery-yellow)',
  },
  {
    id: 'whale',
    kg: 150_000,
    emoji: '🐋',
    name: 'Синий кит',
    forms: ['синего кита', 'синих кита', 'синих китов'],
    color: 'var(--sky)',
  },
  {
    id: 'liberty',
    kg: 225_000,
    emoji: '🗽',
    name: 'Статуя Свободы',
    forms: ['Статую Свободы', 'Статуи Свободы', 'Статуй Свободы'],
    color: 'var(--matcha-cream)',
  },
  {
    id: 'boeing',
    kg: 400_000,
    emoji: '✈️',
    name: 'Боинг-747',
    forms: ['Боинг-747', 'Боинга-747', 'Боингов-747'],
    color: 'var(--lilac)',
  },
  {
    id: 'eiffel',
    kg: 7_300_000,
    emoji: '🗼',
    name: 'Эйфелева башня',
    forms: ['Эйфелеву башню', 'Эйфелевы башни', 'Эйфелевых башен'],
    color: 'var(--bubblegum-pink)',
  },
]

/** Самое крупное, что целиком «поместилось» в вес, и сколько штук. */
export function compareWith(kg: number) {
  const trophy = TROPHIES.findLast((t) => kg >= t.kg)
  return trophy ? { trophy, count: Math.floor(kg / trophy.kg) } : null
}

/** Следующая цель: первое, до чего ещё не дотянули. */
export const nextTrophy = (kg: number) =>
  TROPHIES.find((t) => kg < t.kg) ?? null
