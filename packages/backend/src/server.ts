import '../envConfig';
import sl from '@/serviceLocator';
import app from '@/app';
import { initializeFirebase } from '@/firebase';
import { LocaleCode, User } from '@oare/types';

import AliasDao from '@/daos/AliasDao';
import ArchiveDao from '@/daos/ArchiveDao';
import AssetDao from '@/daos/AssetDao';
import BibliographyDao from '@/daos/BibliographyDao';
import BibliographyUtils from '@/daos/BibliographyUtils';
import cache from '@/cache';
import CacheStatusDao from '@/daos/CacheStatusDao';
import CollectionDao from '@/daos/CollectionDao';
import CollectionTextUtils from '@/daos/CollectionTextUtils';
import CommentsDao from '@/daos/CommentsDao';
import ConceptDao from '@/daos/ConceptDao';
import DictionaryFormDao from '@/daos/DictionaryFormDao';
import DictionarySpellingDao from '@/daos/DictionarySpellingDao';
import DictionaryWordDao from '@/daos/DictionaryWordDao';
import EditTextUtils from '@/daos/EditTextUtils';
import ErrorsDao from '@/daos/ErrorsDao';
import EventDao from '@/daos/EventDao';
import FieldDao from '@/daos/FieldDao';
import GroupAllowlistDao from '@/daos/GroupAllowlistDao';
import GroupEditPermissionsDao from '@/daos/GroupEditPermissionsDao';
import HierarchyDao from '@/daos/HierarchyDao';
import ItemPropertiesDao from '@/daos/ItemPropertiesDao';
import NoteDao from '@/daos/NoteDao';
import OareGroupDao from '@/daos/OareGroupDao';
import PageContentDao from '@/daos/PageContentDao';
import PeriodsDao from '@/daos/PeriodsDao';
import PermissionsDao from '@/daos/PermissionsDao';
import PersonDao from '@/daos/PersonDao';
import PublicationDao from '@/daos/PublicationDao';
import PublicDenylistDao from '@/daos/PublicDenylistDao';
import QuarantineTextDao from '@/daos/QuarantineTextDao';
import ResourceDao from '@/daos/ResourceDao';
import SealDao from '@/daos/SealDao';
import SearchFailureDao from '@/daos/SearchFailureDao';
import SignReadingDao from '@/daos/SignReadingDao';
import SpatialUnitDao from '@/daos/SpatialUnitDao';
import TextDao from '@/daos/TextDao';
import TextDiscourseDao from '@/daos/TextDiscourseDao';
import TextDraftsDao from '@/daos/TextDraftsDao';
import TextEpigraphyDao from '@/daos/TextEpigraphyDao';
import TextMarkupDao from '@/daos/TextMarkupDao';
import ThreadsDao from '@/daos/ThreadsDao';
import TreeDao from '@/daos/TreeDao';
import UserDao from '@/daos/UserDao';
import UserGroupDao from '@/daos/UserGroupDao';
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
