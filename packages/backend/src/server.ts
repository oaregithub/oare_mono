import sl from '@/serviceLocator';
import AliasDao from '@/api/daos/AliasDao';
import DictionaryFormDao from '@/api/daos/DictionaryFormDao';
import DictionaryWordDao from '@/api/daos/DictionaryWordDao';
import FieldDao from '@/api/daos/FieldDao';
import ItemPropertiesDao from '@/api/daos/ItemPropertiesDao';
import DictionarySpellingDao from '@/api/daos/DictionarySpellingDao';
import LoggingEditsDao from '@/api/daos/LoggingEditsDao';
import TextDiscourseDao from '@/api/daos/TextDiscourseDao';
import TextDraftsDao from '@/api/daos/TextDraftsDao';
import OareGroupDao from '@/api/daos/OareGroupDao';
import TextEpigraphyDao from '@/api/daos/TextEpigraphyDao';
import TextGroupDao from '@/api/daos/TextGroupDao';
import cache from '@/cache';
import HierarchyDao from '@/api/daos/HierarchyDao';
import TextDao from '@/api/daos/TextDao';
import TextMarkupDao from '@/api/daos/TextMarkupDao';
import utils from '@/utils';
import app from './app';
import mailer from './mailer';
import UserDao, { UserRow } from './api/daos/UserDao';
import PublicBlacklistDao from './api/daos/PublicBlacklistDao';
import SignReadingDao from './api/daos/SignReadingDao';
import CollectionGroupDao from './api/daos/CollectionGroupDao';
import ResetPasswordLinksDao from './api/daos/ResetPasswordLinksDao';
import PermissionsDao from './api/daos/PermissionsDao';
import UserGroupDao from './api/daos/UserGroupDao';
import CommentsDao from './api/daos/CommentsDao';
import ThreadsDao from './api/daos/ThreadsDao';
import ErrorsDao from './api/daos/ErrorsDao';

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
sl.set('FieldDao', FieldDao);
sl.set('ItemPropertiesDao', ItemPropertiesDao);
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
sl.set('PublicBlacklistDao', PublicBlacklistDao);
sl.set('SignReadingDao', SignReadingDao);
sl.set('CollectionGroupDao', CollectionGroupDao);
sl.set('ResetPasswordLinksDao', ResetPasswordLinksDao);
sl.set('PermissionsDao', PermissionsDao);
sl.set('UserGroupDao', UserGroupDao);
sl.set('CommentsDao', CommentsDao);
sl.set('ThreadsDao', ThreadsDao);
sl.set('ErrorsDao', ErrorsDao);
sl.set('utils', utils);
sl.set('mailer', mailer);

app.listen(8081, () => {
  console.log('Listening on port 8081');
});
