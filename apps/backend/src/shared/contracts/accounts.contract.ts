/** Аккаунт: логин генерируется автоматически, вход по 6-значному коду. */
export interface AccountRecord {
  id: string;
  login: string;
  /** Растёт при смене кода: токены со старой версией перестают работать. */
  sessionsVersion: number;
  createdAt: Date;
}

export type CodeCheck =
  | { ok: true; account: AccountRecord }
  | { ok: false; reason: 'invalid' }
  | { ok: false; reason: 'locked'; retryAfterSec: number };

/** Смена кода: при успехе новый код в открытом виде — показывается один раз. */
export type CodeChange =
  | { ok: true; account: AccountRecord; code: string }
  | Exclude<CodeCheck, { ok: true }>;

export const ACCOUNTS = Symbol('ACCOUNTS');

export interface Accounts {
  /** Новый аккаунт. Код в открытом виде возвращается только здесь. */
  create(): Promise<{ account: AccountRecord; code: string }>;
  /** Проверка кода с ограничением попыток. Неизвестный логин — тот же 'invalid'. */
  verifyCode(login: string, code: string): Promise<CodeCheck>;
  /**
   * Новый код после проверки текущего (тот же лимит попыток, что и при входе).
   * sessionsVersion растёт: все выданные токены перестают работать.
   */
  changeCode(id: string, currentCode: string): Promise<CodeChange>;
  findById(id: string): Promise<AccountRecord | null>;
}
