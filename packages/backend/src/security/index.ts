import crypto from 'crypto';
import cryptoRandomString from 'crypto-random-string';
import jwt from 'jsonwebtoken';
import { Response } from 'express';
import { v4 } from 'uuid';
import RefreshTokenDao from '@/api/daos/RefreshTokenDao';
import firebase from '@/firebase';
import { User } from '@oare/types';

export function hashPassword(password: string, salt?: string): string {
  const pSalt = salt || cryptoRandomString({ length: 8 });

  const pass = crypto
    .createHmac('sha256', pSalt)
    .update(password)
    .digest('hex');

  return `sha256$${pSalt}$${pass}`;
}

export function checkPassword(password: string, checkHash: string) {
  const salt = checkHash.split('$')[1];
  if (hashPassword(password, salt) === checkHash) {
    return true;
  }
  return false;
}

export function createJwt(email: string, expiresIn: number) {
  const signingToken = process.env.OARE_JWT_TOKEN;

  if (!signingToken) {
    throw new Error('Missing signature token');
  }

  const token = jwt.sign({ email }, signingToken, {
    expiresIn,
  });

  return token;
}

export async function sendJwtCookie(
  ip: string,
  res: Response,
  user: Pick<User, 'email' | 'uuid'>
) {
  const expirationSeconds = 15 * 60;
  const token = createJwt(user.email, expirationSeconds);
  const refreshToken = v4();
  const refreshExpire = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

  await RefreshTokenDao.insertToken(
    refreshToken,
    refreshExpire,
    user.email,
    ip
  );
  const customToken = await firebase.auth().createCustomToken(user.uuid);
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV !== 'development',
  };

  return res
    .cookie('refreshToken', refreshToken, {
      ...cookieOptions,
      expires: refreshExpire,
    })
    .cookie('jwt', token, {
      ...cookieOptions,
      expires: new Date(Date.now() + expirationSeconds * 1000),
    })
    .cookie('fbJwt', customToken, {
      ...cookieOptions,
      expires: new Date(Date.now() + 3600 * 1000),
    });
}
