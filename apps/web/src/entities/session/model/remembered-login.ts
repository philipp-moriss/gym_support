import { storage } from '@/shared/lib'

/** Последний логин на этом устройстве: при входе сразу экран кода. */
const KEY = 'gym.login'

export const rememberedLogin = {
  get: () => storage.get<string>(KEY),
  set: (login: string) => storage.set(KEY, login),
  clear: () => storage.remove(KEY),
}
