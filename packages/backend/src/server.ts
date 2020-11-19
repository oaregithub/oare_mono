import sl from '@/serviceLocator';
import DictionaryFormDao from '@/api/daos/DictionaryFormDao';
import DictionaryWordDao from '@/api/daos/DictionaryWordDao';
import DictionarySpellingDao from '@/api/daos/DictionarySpellingDao';
import LoggingEditsDao from '@/api/daos/LoggingEditsDao';
import TextDiscourseDao from '@/api/daos/TextDiscourseDao';
import TextDraftsDao from '@/api/daos/TextDraftsDao';
import OareGroupDao from '@/api/daos/OareGroupDao';
import cache from '@/cache';
import AliasDao from '@/api/daos/AliasDao';
import TextEpigraphyDao from '@/api/daos/TextEpigraphyDao';
import TextGroupDao from '@/api/daos/TextGroupDao';
import HierarchyDao from '@/api/daos/HierarchyDao';
import TextDao from '@/api/daos/TextDao';
import TextMarkupDao from '@/api/daos/TextMarkupDao';
import app from './app';
import UserDao, { UserRow } from './api/daos/UserDao';

declare global {
  namespace Express {
    interface Request {
      user: UserRow | null;
    }
  }
}

sl.set('UserDao', UserDao);
sl.set('DictionaryFormDao', DictionaryFormDao);
sl.set('DictionaryWordDao', DictionaryWordDao);
sl.set('DictionarySpellingDao', DictionarySpellingDao);
sl.set('LoggingEditsDao', LoggingEditsDao);
sl.set('TextDiscourseDao', TextDiscourseDao);
sl.set('TextDraftsDao', TextDraftsDao);
sl.set('OareGroupDao', OareGroupDao);
sl.set('AliasDao', AliasDao);
sl.set('TextEpigraphyDao', TextEpigraphyDao);
sl.set('HierarchyDao', HierarchyDao);
sl.set('TextGroupDao', TextGroupDao);
sl.set('TextDao', TextDao);
sl.set('TextMarkupDao', TextMarkupDao);
sl.set('cache', cache);

app.listen(8081, () => {
  console.log('Listening on port 8081');
});
