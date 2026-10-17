import { randomBytes, scrypt as scryptCb, timingSafeEqual } from 'crypto';

const scrypt = (password: string, salt: Buffer, keylen: number) =>
  new Promise<Buffer>((resolve, reject) =>
    scryptCb(password, salt, keylen, (err, key) =>
      err ? reject(err) : resolve(key),
    ),
  );

/** scrypt с солью и секретом сервера: без секрета хеш из базы не перебрать. */
export async function hashPassword(password: string, pepper: string) {
  const salt = randomBytes(16);
  const hash = await scrypt(`${pepper}:${password}`, salt, 32);
  return `scrypt$${salt.toString('base64url')}$${hash.toString('base64url')}`;
}

export async function verifyPassword(
  password: string,
  pepper: string,
  stored: string,
) {
  const [scheme, salt, hash] = stored.split('$');
  if (scheme !== 'scrypt' || !salt || !hash) return false;
  const expected = Buffer.from(hash, 'base64url');
  const actual = await scrypt(
    `${pepper}:${password}`,
    Buffer.from(salt, 'base64url'),
    expected.length,
  );
  return timingSafeEqual(actual, expected);
}
