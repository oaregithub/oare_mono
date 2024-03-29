import sl from '@/serviceLocator';
import '../envConfig';
import { LocaleCode, User } from '@oare/types';
import DictionaryFormDao from '@/api/daos/DictionaryFormDao';
import DictionaryWordDao from '@/api/daos/DictionaryWordDao';
import FieldDao from '@/api/daos/FieldDao';
import ItemPropertiesDao from '@/api/daos/ItemPropertiesDao';
import DictionarySpellingDao from '@/api/daos/DictionarySpellingDao';
import TextDiscourseDao from '@/api/daos/TextDiscourseDao';
import TextDraftsDao from '@/api/daos/TextDraftsDao';
import OareGroupDao from '@/api/daos/OareGroupDao';
import TextEpigraphyDao from '@/api/daos/TextEpigraphyDao';
import cache from '@/cache';
import HierarchyDao from '@/api/daos/HierarchyDao';
import TextDao from '@/api/daos/TextDao';
import TextMarkupDao from '@/api/daos/TextMarkupDao';
import * as utils from '@/utils';
import { initializeFirebase } from '@/firebase';
import app from './app';
import UserDao from './api/daos/UserDao';
import PublicDenylistDao from './api/daos/PublicDenylistDao';
import SignReadingDao from './api/daos/SignReadingDao';
import PermissionsDao from './api/daos/PermissionsDao';
import UserGroupDao from './api/daos/UserGroupDao';
import CommentsDao from './api/daos/CommentsDao';
import ThreadsDao from './api/daos/ThreadsDao';
import ErrorsDao from './api/daos/ErrorsDao';
import CollectionDao from './api/daos/CollectionDao';
import CollectionTextUtils from './api/daos/CollectionTextUtils';
import CacheStatusDao from './api/daos/CacheStatusDao';
import PersonDao from './api/daos/PersonDao';
import GroupAllowlistDao from './api/daos/GroupAllowlistDao';
import GroupEditPermissionsDao from './api/daos/GroupEditPermissionsDao';
import ResourceDao from './api/daos/ResourceDao';
import AliasDao from './api/daos/AliasDao';
import PublicationDao from './api/daos/PublicationDao';
import ArchiveDao from './api/daos/ArchiveDao';
import NoteDao from './api/daos/NoteDao';
import PageContentDao from './api/daos/PageContentDao';
import SearchFailureDao from './api/daos/SearchFailureDao';
import BibliographyDao from './api/daos/BibliographyDao';
import BibliographyUtils from './api/daos/BibliographyUtils';
import TreeDao from './api/daos/TreeDao';
import QuarantineTextDao from './api/daos/QuarantineTextDao';
import SealDao from './api/daos/SealDao';
import PeriodsDao from './api/daos/PeriodsDao';
import AssetDao from './api/daos/AssetDao';
import ConceptDao from './api/daos/ConceptDao';
import EditTextUtils from './api/daos/EditTextUtils';
import EventDao from './api/daos/EventDao';
import SpatialUnitDao from './api/daos/SpatialUnitDao';

declare global {
  namespace Express {
    interface Request {
      user: User | null;
      locale: LocaleCode;
    }
  }
}

sl.set('UserDao', UserDao);
sl.set('DictionaryFormDao', DictionaryFormDao);
sl.set('DictionaryWordDao', DictionaryWordDao);
sl.set('FieldDao', FieldDao);
sl.set('ItemPropertiesDao', ItemPropertiesDao);
sl.set('DictionarySpellingDao', DictionarySpellingDao);
sl.set('TextDiscourseDao', TextDiscourseDao);
sl.set('TextDraftsDao', TextDraftsDao);
sl.set('OareGroupDao', OareGroupDao);
sl.set('TextEpigraphyDao', TextEpigraphyDao);
sl.set('HierarchyDao', HierarchyDao);
sl.set('TextDao', TextDao);
sl.set('TextMarkupDao', TextMarkupDao);
sl.set('cache', cache);
sl.set('PublicDenylistDao', PublicDenylistDao);
sl.set('SignReadingDao', SignReadingDao);
sl.set('PermissionsDao', PermissionsDao);
sl.set('UserGroupDao', UserGroupDao);
sl.set('CommentsDao', CommentsDao);
sl.set('ThreadsDao', ThreadsDao);
sl.set('ErrorsDao', ErrorsDao);
sl.set('CollectionDao', CollectionDao);
sl.set('CacheStatusDao', CacheStatusDao);
sl.set('CollectionTextUtils', CollectionTextUtils);
sl.set('PersonDao', PersonDao);
sl.set('GroupAllowlistDao', GroupAllowlistDao);
sl.set('GroupEditPermissionsDao', GroupEditPermissionsDao);
sl.set('ResourceDao', ResourceDao);
sl.set('AliasDao', AliasDao);
sl.set('utils', utils);
sl.set('PublicationDao', PublicationDao);
sl.set('ArchiveDao', ArchiveDao);
sl.set('NoteDao', NoteDao);
sl.set('PageContentDao', PageContentDao);
sl.set('SearchFailureDao', SearchFailureDao);
sl.set('BibliographyDao', BibliographyDao);
sl.set('BibliographyUtils', BibliographyUtils);
sl.set('TreeDao', TreeDao);
sl.set('QuarantineTextDao', QuarantineTextDao);
sl.set('SealDao', SealDao);
sl.set('PeriodsDao', PeriodsDao);
sl.set('AssetDao', AssetDao);
sl.set('ConceptDao', ConceptDao);
sl.set('EditTextUtils', EditTextUtils);
sl.set('EventDao', EventDao);
sl.set('SpatialUnitDao', SpatialUnitDao);

initializeFirebase(err => {
  if (err) {
    console.error(err); // eslint-disable-line no-console
  } else {
    app.listen(8081, () => {
      console.log('Listening on port 8081'); // eslint-disable-line no-console
    });
  }
});
