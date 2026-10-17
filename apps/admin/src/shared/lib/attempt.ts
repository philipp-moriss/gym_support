/** Выполнить мутацию и ответить, удалась ли она (ошибку покажет сама мутация). */
export async function attempt(run: () => Promise<unknown>) {
  try {
    await run()
    return true
  } catch {
    return false
  }
}
