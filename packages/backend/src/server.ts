import '../envConfig';
import sl from '@/serviceLocator';
import app from '@/app';
import { initializeFirebase } from '@/firebase';
import { LocaleCode, User } from '@oare/types';

import AliasDao from '@/api/daos/AliasDao';
import ArchiveDao from '@/api/daos/ArchiveDao';
import AssetDao from '@/api/daos/AssetDao';
import BibliographyDao from '@/api/daos/BibliographyDao';
import BibliographyUtils from '@/api/daos/BibliographyUtils';
import cache from '@/cache';
import CacheStatusDao from '@/api/daos/CacheStatusDao';
import CollectionDao from '@/api/daos/CollectionDao';
import CollectionTextUtils from '@/api/daos/CollectionTextUtils';
import CommentsDao from '@/api/daos/CommentsDao';
import ConceptDao from '@/api/daos/ConceptDao';
import DictionaryFormDao from '@/api/daos/DictionaryFormDao';
import DictionarySpellingDao from '@/api/daos/DictionarySpellingDao';
import DictionaryWordDao from '@/api/daos/DictionaryWordDao';
import EditTextUtils from '@/api/daos/EditTextUtils';
import ErrorsDao from '@/api/daos/ErrorsDao';
import EventDao from '@/api/daos/EventDao';
import FieldDao from '@/api/daos/FieldDao';
import GroupAllowlistDao from '@/api/daos/GroupAllowlistDao';
import GroupEditPermissionsDao from '@/api/daos/GroupEditPermissionsDao';
import HierarchyDao from '@/api/daos/HierarchyDao';
import ItemPropertiesDao from '@/api/daos/ItemPropertiesDao';
import NoteDao from '@/api/daos/NoteDao';
import OareGroupDao from '@/api/daos/OareGroupDao';
import PageContentDao from '@/api/daos/PageContentDao';
import PeriodsDao from '@/api/daos/PeriodsDao';
import PermissionsDao from '@/api/daos/PermissionsDao';
import PersonDao from '@/api/daos/PersonDao';
import PublicationDao from '@/api/daos/PublicationDao';
import PublicDenylistDao from '@/api/daos/PublicDenylistDao';
import QuarantineTextDao from '@/api/daos/QuarantineTextDao';
import ResourceDao from '@/api/daos/ResourceDao';
import SealDao from '@/api/daos/SealDao';
import SearchFailureDao from '@/api/daos/SearchFailureDao';
import SignReadingDao from '@/api/daos/SignReadingDao';
import SpatialUnitDao from '@/api/daos/SpatialUnitDao';
import TextDao from '@/api/daos/TextDao';
import TextDiscourseDao from '@/api/daos/TextDiscourseDao';
import TextDraftsDao from '@/api/daos/TextDraftsDao';
import TextEpigraphyDao from '@/api/daos/TextEpigraphyDao';
import TextMarkupDao from '@/api/daos/TextMarkupDao';
import ThreadsDao from '@/api/daos/ThreadsDao';
import TreeDao from '@/api/daos/TreeDao';
import UserDao from '@/api/daos/UserDao';
import UserGroupDao from '@/api/daos/UserGroupDao';
import * as utils from '@/utils';

declare global {
  namespace Express {
    interface Request {
      user: User | null; // Allows for the user to be set on the request object
      locale: LocaleCode; // Allows for the locale to be set on the request object
    }
  }
}

// Instantiates all the singletons and sets them in the service locator at runtime. Should be set alphabetically.
sl.set('AliasDao', AliasDao);
sl.set('ArchiveDao', ArchiveDao);
sl.set('AssetDao', AssetDao);
sl.set('BibliographyDao', BibliographyDao);
sl.set('BibliographyUtils', BibliographyUtils);
sl.set('cache', cache);
sl.set('CacheStatusDao', CacheStatusDao);
sl.set('CollectionDao', CollectionDao);
sl.set('CollectionTextUtils', CollectionTextUtils);
sl.set('CommentsDao', CommentsDao);
sl.set('ConceptDao', ConceptDao);
sl.set('DictionaryFormDao', DictionaryFormDao);
sl.set('DictionarySpellingDao', DictionarySpellingDao);
sl.set('DictionaryWordDao', DictionaryWordDao);
sl.set('EditTextUtils', EditTextUtils);
sl.set('ErrorsDao', ErrorsDao);
sl.set('EventDao', EventDao);
sl.set('FieldDao', FieldDao);
sl.set('GroupAllowlistDao', GroupAllowlistDao);
sl.set('GroupEditPermissionsDao', GroupEditPermissionsDao);
sl.set('HierarchyDao', HierarchyDao);
sl.set('ItemPropertiesDao', ItemPropertiesDao);
sl.set('NoteDao', NoteDao);
sl.set('OareGroupDao', OareGroupDao);
sl.set('PageContentDao', PageContentDao);
sl.set('PeriodsDao', PeriodsDao);
sl.set('PermissionsDao', PermissionsDao);
sl.set('PersonDao', PersonDao);
sl.set('PublicationDao', PublicationDao);
sl.set('PublicDenylistDao', PublicDenylistDao);
sl.set('QuarantineTextDao', QuarantineTextDao);
sl.set('ResourceDao', ResourceDao);
sl.set('SealDao', SealDao);
sl.set('SearchFailureDao', SearchFailureDao);
sl.set('SignReadingDao', SignReadingDao);
sl.set('SpatialUnitDao', SpatialUnitDao);
sl.set('TextDao', TextDao);
sl.set('TextDiscourseDao', TextDiscourseDao);
sl.set('TextDraftsDao', TextDraftsDao);
sl.set('TextEpigraphyDao', TextEpigraphyDao);
sl.set('TextMarkupDao', TextMarkupDao);
sl.set('ThreadsDao', ThreadsDao);
sl.set('TreeDao', TreeDao);
sl.set('UserDao', UserDao);
sl.set('UserGroupDao', UserGroupDao);
sl.set('utils', utils);

// Only starts the server after Firebase has been initialized for authentication
initializeFirebase(err => {
  if (err) {
    console.error(err); // eslint-disable-line no-console
  } else {
    app.listen(8081, () => {
      console.log('Listening on port 8081'); // eslint-disable-line no-console
    });
  }
});
