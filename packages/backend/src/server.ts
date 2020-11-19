import sl from '@/serviceLocator';
import AliasDao from '@/api/daos/AliasDao';
import DictionaryFormDao from '@/api/daos/DictionaryFormDao';
import DictionaryWordDao from '@/api/daos/DictionaryWordDao';
import DictionarySpellingDao from '@/api/daos/DictionarySpellingDao';
import LoggingEditsDao from '@/api/daos/LoggingEditsDao';
import TextDiscourseDao from '@/api/daos/TextDiscourseDao';
import TextDraftsDao from '@/api/daos/TextDraftsDao';
import OareGroupDao from '@/api/daos/OareGroupDao';
import TextEpigraphyDao from '@/api/daos/TextEpigraphyDao';
import TextGroupDao from '@/api/daos/TextGroupDao';
import cache from '@/cache';
import app from './app';
import UserDao, { UserRow } from './api/daos/UserDao';

declare global {
  namespace Express {
    interface Request {
      user: UserRow | null;
    }
  }
}

sl.set('AliasDao', AliasDao);
sl.set('UserDao', UserDao);
sl.set('DictionaryFormDao', DictionaryFormDao);
sl.set('DictionaryWordDao', DictionaryWordDao);
sl.set('DictionarySpellingDao', DictionarySpellingDao);
sl.set('LoggingEditsDao', LoggingEditsDao);
sl.set('TextDiscourseDao', TextDiscourseDao);
sl.set('TextDraftsDao', TextDraftsDao);
sl.set('OareGroupDao', OareGroupDao);
sl.set('TextGroupDao', TextGroupDao);
sl.set('TextEpigraphyDao', TextEpigraphyDao);
sl.set('cache', cache);

app.listen(8081, () => {
  console.log('Listening on port 8081');
});
