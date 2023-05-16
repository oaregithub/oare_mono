import { Request, Response, NextFunction } from 'express';
import { HttpInternalError } from '@/exceptions';
import { LocaleCode } from '@oare/types';

/**
 * Attaches locale to the request object.
 * Functions as an application-level middleware that attaches the locale to the every request object.
 * The locale is already available in the request header, but this middleware attaches directly it to the request object for convenience.
 */
async function attachLocale(req: Request, _res: Response, next: NextFunction) {
  try {
    const { locale } = req.headers;

    // In the event that no locale is attached, it defaults to English.
    req.locale = locale ? (locale as LocaleCode) : 'en';

    next();
  } catch (err) {
    next(new HttpInternalError(err as string));
  }
}

export default attachLocale;
