import { Express } from 'express';
import words from './api/words';
import names from './api/names';
import places from './api/places';
import dictionary from './api/dictionary';
import searchDictionary from './api/search_dictionary';
import search from './api/search';
import textEpigraphies from './api/text_epigraphies';
import register from './api/register';
import groups from './api/groups';
import users from './api/users';
import userGroups from './api/user_groups';
import textDrafts from './api/text_drafts';
import collections from './api/collections';
import collectionInfo from './api/collection_info';
import permissions from './api/permissions';
import publicDenylist from './api/public_denylist';
import searchNames from './api/search_names';
import comments from './api/comments';
import errors from './api/errors';
import threads from './api/threads';
import people from './api/people';
import cacheStatus from './api/cache_status';
import textDiscourse from './api/text_discourse';
import profile from './api/profile';
import groupAllowlist from './api/group_allowlist';
import groupEditPermissions from './api/group_edit_permissions';
import signReading from './api/sign_reading';
import betaAccess from './api/beta_access';
import publications from './api/publications';
import archives from './api/archives';
import pageContent from './api/page_content';
import searchWordsTexts from './api/search_words_texts';
import properties from './api/properties';
import environment from './api/environment';
import text from './api/text';
import bibliography from './api/bibliography';
import quarantine from './api/quarantine';
import field from './api/field';

export const API_PATH = '/api/v2';

export default (app: Express) => {
  [
    words,
    names,
    places,
    dictionary,
    searchDictionary,
    search,
    textEpigraphies,
    register,
    groups,
    users,
    userGroups,
    textDrafts,
    collections,
    collectionInfo,
    permissions,
    publicDenylist,
    searchNames,
    comments,
    errors,
    threads,
    people,
    cacheStatus,
    textDiscourse,
    profile,
    groupAllowlist,
    groupEditPermissions,
    signReading,
    betaAccess,
    publications,
    archives,
    pageContent,
    searchWordsTexts,
    properties,
    environment,
    text,
    bibliography,
    quarantine,
    field,
  ].forEach(route => {
    app.use(API_PATH, route);
  });
};
