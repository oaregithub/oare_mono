import { Request, Response, NextFunction } from 'express';
import { HttpInternalError } from '@/exceptions';
import { LocaleCode } from '@oare/types';

// Attach locale object to each request
async function attachLocale(req: Request, _res: Response, next: NextFunction) {
  try {
    const { locale } = req.headers;

    req.locale = locale ? (locale as LocaleCode) : 'en';

    next();
  } catch (err) {
    next(new HttpInternalError(err as string));
  }
}

export default attachLocale;
