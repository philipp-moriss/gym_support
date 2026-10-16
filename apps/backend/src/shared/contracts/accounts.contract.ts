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

export const ACCOUNTS = Symbol('ACCOUNTS');

export interface Accounts {
  /** Новый аккаунт. Код в открытом виде возвращается только здесь. */
  create(): Promise<{ account: AccountRecord; code: string }>;
  /** Проверка кода с ограничением попыток. Неизвестный логин — тот же 'invalid'. */
  verifyCode(login: string, code: string): Promise<CodeCheck>;
  findById(id: string): Promise<AccountRecord | null>;
}
