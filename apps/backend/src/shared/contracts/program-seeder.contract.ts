/** С чего начинается программа нового аккаунта. */
export const PROGRAM_TEMPLATES = ['back', 'empty'] as const;
export type ProgramTemplate = (typeof PROGRAM_TEMPLATES)[number];

export const PROGRAM_SEEDER = Symbol('PROGRAM_SEEDER');

export interface ProgramSeeder {
  /** Упражнения, расписание и правила по шаблону. Повторный вызов ничего не меняет. */
  seed(userId: string, template: ProgramTemplate): Promise<void>;
}
