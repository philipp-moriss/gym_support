/**
 * Аккаунт: логин генерируется автоматически. Новые аккаунты входят 8-значным
 * кодом без логина; старые — логином и своим 6-значным кодом, как паролем.
 * Сменой кода старый аккаунт переходит на 8 цифр.
 */
export interface AccountRecord {
  id: string;
  login: string;
  /** Растёт при смене кода: токены со старой версией перестают работать. */
  sessionsVersion: number;
  /** 8 — можно входить одним кодом, 6 — старый код, нужен логин. */
  codeDigits: 6 | 8;
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
   * Вход одним кодом: аккаунт ищется по HMAC кода. Счётчика попыток нет —
   * неверный код ни к какому аккаунту не относится; подбор режет лимит по IP.
   */
  findByCode(code: string): Promise<CodeCheck>;
  /**
   * Новый код после проверки текущего (тот же лимит попыток, что и при входе).
   * Новый код всегда 8-значный: после смены старый аккаунт входит без логина.
   * sessionsVersion растёт: все выданные токены перестают работать.
   */
  changeCode(id: string, currentCode: string): Promise<CodeChange>;
  findById(id: string): Promise<AccountRecord | null>;
}
