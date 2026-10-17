/** Шаг 1 — анализ дневника, шаг 2 — правки программы. */
export type PromptSlot = 'journal_analysis' | 'program_review'

export interface PromptInfo {
  slot: PromptSlot
  title: string
  text: string
  isDefault: boolean
  defaultText: string
  updatedAt: string | null
}

/** Ограничения бэкенда (PromptDto). */
export const PROMPT_MIN = 20
export const PROMPT_MAX = 20000
