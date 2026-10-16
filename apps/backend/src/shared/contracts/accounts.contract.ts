/**
 * Аккаунт: логин генерируется автоматически. Вход — по 8-значному коду без
 * логина; старые аккаунты с 6-значным кодом входят по логину и коду.
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
   * sessionsVersion растёт: все выданные токены перестают работать.
   */
  changeCode(id: string, currentCode: string): Promise<CodeChange>;
  /**
   * Перевод старого аккаунта (6 цифр) на вход одним кодом: выдаёт 8-значный код
   * без ввода старого — пользователь уже вошёл. Для аккаунта с 8 цифрами — null.
   */
  upgradeCode(
    id: string,
  ): Promise<{ account: AccountRecord; code: string } | null>;
  findById(id: string): Promise<AccountRecord | null>;
}
