import archives from '@/serverProxy/archives';
import bibliography from '@/serverProxy/bibliography';
import cacheStatus from '@/serverProxy/cache_status';
import collections from '@/serverProxy/collections';
import comments from '@/serverProxy/comments';
import dictionary from '@/serverProxy/dictionary';
import environment from '@/serverProxy/environment';
import epigraphies from '@/serverProxy/epigraphies';
import errors from '@/serverProxy/errors';
import field from '@/serverProxy/field';
import groupAllowlist from '@/serverProxy/group_allowlist';
import groupEditPermissions from '@/serverProxy/group_edit_permissions';
import groups from '@/serverProxy/groups';
import login from '@/serverProxy/login';
import logout from '@/serverProxy/logout';
import names from '@/serverProxy/names';
import pageContent from '@/serverProxy/page_content';
import periods from '@/serverProxy/periods';
import permissions from '@/serverProxy/permissions';
import persons from '@/serverProxy/persons';
import places from '@/serverProxy/places';
import profile from '@/serverProxy/profile';
import properties from '@/serverProxy/properties';
import publications from '@/serverProxy/publications';
import publicDenylist from '@/serverProxy/public_denylist';
import quarantine from '@/serverProxy/quarantine';
import register from '@/serverProxy/register';
import resetPassword from '@/serverProxy/reset_password';
import seals from '@/serverProxy/seals';
import searchDictionary from '@/serverProxy/search_dictionary';
import searchNames from '@/serverProxy/search_names';
import searchTexts from '@/serverProxy/search';
import signReading from '@/serverProxy/sign_reading';
import textDiscourse from '@/serverProxy/text_discourse';
import textDrafts from '@/serverProxy/text_drafts';
import threads from '@/serverProxy/threads';
import userGroups from '@/serverProxy/user_groups';
import users from '@/serverProxy/users';
import words from '@/serverProxy/words';
import wordsInTextsSearch from '@/serverProxy/search_words_texts';

const serverProxy = {
  ...archives,
  ...bibliography,
  ...cacheStatus,
  ...collections,
  ...comments,
  ...dictionary,
  ...environment,
  ...epigraphies,
  ...errors,
  ...field,
  ...groupAllowlist,
  ...groupEditPermissions,
  ...groups,
  ...login,
  ...logout,
  ...names,
  ...pageContent,
  ...periods,
  ...permissions,
  ...persons,
  ...places,
  ...profile,
  ...properties,
  ...publications,
  ...publicDenylist,
  ...quarantine,
  ...register,
  ...resetPassword,
  ...seals,
  ...searchDictionary,
  ...searchNames,
  ...searchTexts,
  ...signReading,
  ...textDiscourse,
  ...textDrafts,
  ...threads,
  ...userGroups,
  ...users,
  ...words,
  ...wordsInTextsSearch,
};

export type ServerProxyType = typeof serverProxy;

export default serverProxy;
