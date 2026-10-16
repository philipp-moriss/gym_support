import {
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

/** 6 случайных цифр, ведущие нули допустимы. */
export const generateCode = () =>
  randomInt(0, 1_000_000).toString().padStart(6, '0');

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
