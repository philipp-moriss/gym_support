import {
  createHmac,
  randomBytes,
  randomInt,
  scrypt as scryptCb,
  timingSafeEqual,
} from 'crypto';

const scrypt = (password: string, salt: Buffer, keylen: number) =>
  new Promise<Buffer>((resolve, reject) =>
    scryptCb(password, salt, keylen, (err, key) =>
      err ? reject(err) : resolve(key),
    ),
  );

/** Длина кода новых аккаунтов. У аккаунтов до входа без логина — 6 цифр. */
export const CODE_DIGITS = 8;

/** Случайные цифры, ведущие нули допустимы. */
export const generateCode = (digits = CODE_DIGITS) =>
  randomInt(0, 10 ** digits)
    .toString()
    .padStart(digits, '0');

/**
 * Ключ поиска для входа по одному коду: HMAC с секретом сервера. По нему
 * находим аккаунт, но код из него не восстановить. Уникален среди аккаунтов.
 */
export const codeLookup = (code: string, pepper: string) =>
  createHmac('sha256', pepper).update(code).digest('hex');

/**
 * Хеш кода: scrypt с солью и секретом сервера (pepper). Без секрета из базы
 * код не подобрать перебором даже при утечке таблицы.
 */
export async function hashCode(code: string, pepper: string) {
  const salt = randomBytes(16);
  const hash = await scrypt(`${pepper}:${code}`, salt, 32);
  return `scrypt$${salt.toString('base64url')}$${hash.toString('base64url')}`;
}

export async function verifyCodeHash(
  code: string,
  pepper: string,
  stored: string,
) {
  const [scheme, salt, hash] = stored.split('$');
  if (scheme !== 'scrypt' || !salt || !hash) return false;
  const expected = Buffer.from(hash, 'base64url');
  const actual = await scrypt(
    `${pepper}:${code}`,
    Buffer.from(salt, 'base64url'),
    expected.length,
  );
  return timingSafeEqual(actual, expected);
}

const WORDS = [
  'tiger',
  'panda',
  'otter',
  'falcon',
  'bison',
  'koala',
  'lynx',
  'moose',
  'orca',
  'puma',
  'raven',
  'shark',
  'yak',
  'zebra',
  'gecko',
  'heron',
  'ibex',
  'jaguar',
  'lemur',
  'manta',
  'narwhal',
  'ocelot',
  'panther',
  'quokka',
  'rhino',
  'seal',
  'tapir',
  'walrus',
  'wolf',
  'badger',
  'camel',
  'dingo',
  'eagle',
  'ferret',
  'gorilla',
  'hippo',
  'iguana',
  'kiwi',
  'llama',
  'mole',
];

/** Логин вида «otter-4821»: легко продиктовать и записать. */
export const generateLogin = () =>
  `${WORDS[randomInt(0, WORDS.length)]}-${randomInt(1000, 10_000)}`;
