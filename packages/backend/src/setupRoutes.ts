import { Express } from 'express';
import archives from '@/api/archives';
import bibliography from '@/api/bibliography';
import cacheStatus from '@/api/cache_status';
import collections from '@/api/collections';
import comments from '@/api/comments';
import dictionary from '@/api/dictionary';
import environment from '@/api/environment';
import errors from '@/api/errors';
import field from '@/api/field';
import groupAllowlist from '@/api/group_allowlist';
import groupEditPermissions from '@/api/group_edit_permissions';
import groups from '@/api/groups';
import names from '@/api/names';
import pageContent from '@/api/page_content';
import periods from '@/api/periods';
import permissions from '@/api/permissions';
import persons from '@/api/persons';
import places from '@/api/places';
import profile from '@/api/profile';
import properties from '@/api/properties';
import publications from '@/api/publications';
import publicDenylist from '@/api/public_denylist';
import quarantine from '@/api/quarantine';
import register from '@/api/register';
import seals from '@/api/seals';
import search from '@/api/search';
import searchDictionary from '@/api/search_dictionary';
import searchNames from '@/api/search_names';
import searchWordsTexts from '@/api/search_words_texts';
import signReading from '@/api/sign_reading';
import textDiscourse from '@/api/text_discourse';
import textEpigraphies from '@/api/text_epigraphies';
import threads from '@/api/threads';
import userGroups from '@/api/user_groups';
import users from '@/api/users';
import words from '@/api/words';

/**
 * All API routes are prefixed with this path.
 */
export const API_PATH = '/api/v2';

/**
 * Attaches API routes to the Express app.
 * Should be applied and imported alphabetically.
 */
export default (app: Express) => {
  [
    archives,
    bibliography,
    cacheStatus,
    collections,
    comments,
    dictionary,
    environment,
    errors,
    field,
    groupAllowlist,
    groupEditPermissions,
    groups,
    names,
    pageContent,
    periods,
    permissions,
    persons,
    places,
    profile,
    properties,
    publications,
    publicDenylist,
    quarantine,
    register,
    seals,
    search,
    searchDictionary,
    searchNames,
    searchWordsTexts,
    signReading,
    textDiscourse,
    textEpigraphies,
    threads,
    userGroups,
    users,
    words,
  ].forEach(route => {
    app.use(API_PATH, route);
  });
};
