import sl from '@/serviceLocator';
import DictionaryFormDao from '@/api/daos/DictionaryFormDao';
import DictionaryWordDao from '@/api/daos/DictionaryWordDao';
import LoggingEditsDao from '@/api/daos/LoggingEditsDao';
import TextDiscourseDao from '@/api/daos/TextDiscourseDao';
import cache from '@/cache';
import app from './app';
import { UserRow } from './api/daos/UserDao';

declare global {
  namespace Express {
    interface Request {
      user: UserRow | null;
    }
  }
}

sl.set('DictionaryFormDao', DictionaryFormDao);
sl.set('DictionaryWordDao', DictionaryWordDao);
sl.set('LoggingEditsDao', LoggingEditsDao);
sl.set('TextDiscourseDao', TextDiscourseDao);
sl.set('cache', cache);

app.listen(8081, () => {
  console.log('Listening on port 8081');
});
