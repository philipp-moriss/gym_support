import { storage } from '@/shared/lib'

/**
 * Что помним об аккаунте на этом устройстве. Новые аккаунты входят одним
 * кодом — достаточно знать, что аккаунт тут был, чтобы сразу открыть экран кода.
 * Логин помним только для старых 6-значных кодов.
 */
const LOGIN_KEY = 'gym.login'
const KNOWN_KEY = 'gym.has-account'

export const rememberedLogin = {
  get: () => storage.get<string>(LOGIN_KEY),
  set: (login: string) => storage.set(LOGIN_KEY, login),
  clear: () => storage.remove(LOGIN_KEY),
}

export const knownDevice = {
  get: () => !!storage.get<boolean>(KNOWN_KEY),
  set: () => storage.set(KNOWN_KEY, true),
  forget: () => {
    storage.remove(KNOWN_KEY)
    storage.remove(LOGIN_KEY)
  },
}

/** Вошли: запоминаем устройство, логин — только если код ещё 6-значный. */
export function rememberAccount(user: { login: string; codeDigits: 6 | 8 }) {
  knownDevice.set()
  if (user.codeDigits === 6) rememberedLogin.set(user.login)
  else rememberedLogin.clear()
}
