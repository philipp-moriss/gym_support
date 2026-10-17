/** Задачи ИИ. У каждой свой промпт (правится в админке) и, при желании, свой агент. */
export const AI_SLOTS = ['journal_analysis', 'program_review'] as const;
export type AiSlot = (typeof AI_SLOTS)[number];

export const AI_AGENT = Symbol('AI_AGENT');

export interface AiAgent {
  /**
   * Один вызов агента: промпт слота + данные. Возвращает разобранный JSON-объект
   * ответа; агент не настроен, не ответил или ответил не JSON — ошибка с текстом.
   */
  run(slot: AiSlot, data: string): Promise<Record<string, unknown>>;
}

export interface PromptInfo {
  slot: AiSlot;
  title: string;
  text: string;
  /** Текст не меняли — действует встроенный. */
  isDefault: boolean;
  defaultText: string;
  updatedAt: Date | null;
}

export const PROMPTS = Symbol('PROMPTS');

export interface Prompts {
  list(): Promise<PromptInfo[]>;
  update(slot: AiSlot, text: string): Promise<PromptInfo>;
  /** Вернуть встроенный текст. */
  reset(slot: AiSlot): Promise<PromptInfo>;
}
