import { Express } from 'express';
import archives from '@/api/archives';
import bibliography from '@/api/bibliography';
import cacheStatus from '@/api/cache_status';
import collections from '@/api/collections';
import comments from '@/api/comments';
import dictionaryForm from '@/api/dictionary_form';
import dictionarySpelling from '@/api/dictionary_spelling';
import dictionaryWord from '@/api/dictionary_word';
import environment from '@/api/environment';
import epigraphies from '@/api/epigraphies';
import errors from '@/api/errors';
import field from '@/api/field';
import groupAllowlist from '@/api/group_allowlist';
import groupEditPermissions from '@/api/group_edit_permissions';
import groups from '@/api/groups';
import pageContent from '@/api/page_content';
import periods from '@/api/periods';
import permissions from '@/api/permissions';
import persons from '@/api/persons';
import profile from '@/api/profile';
import properties from '@/api/properties';
import publications from '@/api/publications';
import publicDenylist from '@/api/public_denylist';
import quarantine from '@/api/quarantine';
import register from '@/api/register';
import seals from '@/api/seals';
import search from '@/api/search';
import signReading from '@/api/sign_reading';
import text from '@/api/text';
import textDiscourse from '@/api/text_discourse';
import threads from '@/api/threads';
import userGroups from '@/api/user_groups';
import users from '@/api/users';

/**
 * All API routes are prefixed with this path.
 */
export const API_PATH = '/api/v3';

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
    dictionaryForm,
    dictionarySpelling,
    dictionaryWord,
    environment,
    epigraphies,
    errors,
    field,
    groupAllowlist,
    groupEditPermissions,
    groups,
    pageContent,
    periods,
    permissions,
    persons,
    profile,
    properties,
    publications,
    publicDenylist,
    quarantine,
    register,
    seals,
    search,
    signReading,
    text,
    textDiscourse,
    threads,
    userGroups,
    users,
  ].forEach(route => {
    app.use(API_PATH, route);
  });
};
