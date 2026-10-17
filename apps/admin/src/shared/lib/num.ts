/** Склонение: plural(5, ['тренер', 'тренера', 'тренеров']) → 'тренеров'. */
const rules = new Intl.PluralRules('ru-RU')
export function plural(
  n: number,
  [one, few, many]: readonly [string, string, string],
) {
  const form = rules.select(n)
  return form === 'one' ? one : form === 'few' ? few : many
}
