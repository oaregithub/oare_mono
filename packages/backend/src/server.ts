import serverless from 'serverless-http';
import express from 'express';
import sl from '@/serviceLocator';
import { User } from '@oare/types';
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
import * as utils from '@/utils';
import { initializeFirebase } from '@/firebase';
import app from './app';
import UserDao from './api/daos/UserDao';
import PublicBlacklistDao from './api/daos/PublicBlacklistDao';
import SignReadingDao from './api/daos/SignReadingDao';
import CollectionGroupDao from './api/daos/CollectionGroupDao';
import PermissionsDao from './api/daos/PermissionsDao';
import UserGroupDao from './api/daos/UserGroupDao';
import CommentsDao from './api/daos/CommentsDao';
import ThreadsDao from './api/daos/ThreadsDao';
import ErrorsDao from './api/daos/ErrorsDao';
import CollectionDao from './api/daos/CollectionDao';
import CollectionTextUtils from './api/daos/CollectionTextUtils';
import CacheStatusDao from './api/daos/CacheStatusDao';
import PersonDao from './api/daos/PersonDao';
import PersonTextOccurrencesDao from './api/daos/PersonTextOccurrences';

declare global {
  namespace Express {
    interface Request {
      user: User | null;
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
sl.set('TextEpigraphyDao', TextEpigraphyDao);
sl.set('HierarchyDao', HierarchyDao);
sl.set('TextGroupDao', TextGroupDao);
sl.set('TextDao', TextDao);
sl.set('TextMarkupDao', TextMarkupDao);
sl.set('cache', cache);
sl.set('PublicBlacklistDao', PublicBlacklistDao);
sl.set('SignReadingDao', SignReadingDao);
sl.set('CollectionGroupDao', CollectionGroupDao);
sl.set('PermissionsDao', PermissionsDao);
sl.set('UserGroupDao', UserGroupDao);
sl.set('CommentsDao', CommentsDao);
sl.set('ThreadsDao', ThreadsDao);
sl.set('ErrorsDao', ErrorsDao);
sl.set('CollectionDao', CollectionDao);
sl.set('CacheStatusDao', CacheStatusDao);
sl.set('CollectionTextUtils', CollectionTextUtils);
sl.set('PersonDao', PersonDao);
sl.set('PersonTextOccurrencesDao', PersonTextOccurrencesDao);
sl.set('utils', utils);

initializeFirebase(err => {
  if (err) {
    console.error(err); // eslint-disable-line no-console
  } else {
    console.log('success');
    // app.listen(8081, () => {
    //   console.log('Listening on port 8081'); // eslint-disable-line no-console
    // });
  }
});

const router = express.Router();

router.get('/hello', (req, res) => {
  res.json({
    response: 'hi',
  });
});

app.use('./netlify/functions/server', router);

export const handler = serverless(app);
