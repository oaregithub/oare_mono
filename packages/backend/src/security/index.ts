import crypto from 'crypto';
import cryptoRandomString from 'crypto-random-string';
import jwt from 'jsonwebtoken';

export function hashPassword(password: string, salt?: string): string {
  const pSalt = salt || cryptoRandomString({ length: 8 });

  const pass = crypto.createHmac('sha256', pSalt).update(password).digest('hex');

  return `sha256$${pSalt}$${pass}`;
}

export function checkPassword(password: string, checkHash: string) {
  const salt = checkHash.split('$')[1];
  if (hashPassword(password, salt) === checkHash) {
    return true;
  }
  return false;
}

export function createJwt(email: string) {
  const signingToken = process.env.OARE_JWT_TOKEN;

  if (!signingToken) {
    throw new Error('Missing signature token');
  }

  return jwt.sign({ email }, signingToken, {
    expiresIn: '1d',
  });
}
