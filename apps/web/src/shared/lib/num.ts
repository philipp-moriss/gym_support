export const num = (n: number) =>
  n.toLocaleString('ru-RU', { maximumFractionDigits: 1 })

/** Склонение: plural(5, ['горилла', 'гориллы', 'горилл']) → 'горилл'. */
const rules = new Intl.PluralRules('ru-RU')
export function plural(
  n: number,
  [one, few, many]: readonly [string, string, string],
) {
  const form = rules.select(n)
  return form === 'one' ? one : form === 'few' ? few : many
}

/** Тоннаж: до тонны — в кг, дальше — в тоннах. */
export const tonnage = (kg: number) =>
  kg >= 1000 ? `${num(kg / 1000)} т` : `${num(kg)} кг`
