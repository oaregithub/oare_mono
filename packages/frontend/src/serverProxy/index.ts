import comments from '@/serverProxy/comments';
import errors from '@/serverProxy/errors';
import threads from '@/serverProxy/threads';
import groups from './groups';
import users from './users';
import userGroups from './user_groups';
import dictionary from './dictionary';
import searchTexts from './search';
import collections from './collections';
import textDrafts from './text_drafts';
import epigraphies from './epigraphies';
import names from './names';
import places from './places';
import words from './words';
import searchDictionary from './search_dictionary';
import permissions from './permissions';
import login from './login';
import register from './register';
import logout from './logout';
import publicDenylist from './public_denylist';
import searchNames from './search_names';
import resetPassword from './reset_password';
import cacheStatus from './cache_status';
import persons from './persons';
import textDiscourse from './text_discourse';
import profile from './profile';
import groupAllowlist from './group_allowlist';
import groupEditPermissions from './group_edit_permissions';
import signReading from './sign_reading';
import publications from './publications';
import archives from './archives';
import pageContent from './page_content';
import wordsInTextsSearch from './search_words_texts';
import properties from './properties';
import environment from './environment';
import text from './text';
import quarantine from './quarantine';
import field from './field';
import bibliography from './bibliography';
import seals from './seals';
import periods from './periods';

const serverProxy = {
  ...groups,
  ...users,
  ...userGroups,
  ...dictionary,
  ...searchTexts,
  ...collections,
  ...textDrafts,
  ...epigraphies,
  ...names,
  ...places,
  ...words,
  ...searchDictionary,
  ...permissions,
  ...login,
  ...register,
  ...logout,
  ...publicDenylist,
  ...searchNames,
  ...resetPassword,
  ...comments,
  ...errors,
  ...threads,
  ...cacheStatus,
  ...persons,
  ...textDiscourse,
  ...profile,
  ...groupAllowlist,
  ...groupEditPermissions,
  ...signReading,
  ...publications,
  ...archives,
  ...pageContent,
  ...wordsInTextsSearch,
  ...properties,
  ...environment,
  ...text,
  ...quarantine,
  ...field,
  ...bibliography,
  ...seals,
  ...periods,
};

export type ServerProxyType = typeof serverProxy;

export default serverProxy;
