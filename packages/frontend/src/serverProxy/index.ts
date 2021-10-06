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
import people from './people';
import textDiscourse from './text_discourse';
import profile from './profile';
import groupAllowlist from './group_allowlist';
import groupEditPermissions from './group_edit_permissions';
import signReading from './sign_reading';

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
  ...people,
  ...textDiscourse,
  ...profile,
  ...groupAllowlist,
  ...groupEditPermissions,
  ...signReading,
};

export type ServerProxyType = typeof serverProxy;

export default serverProxy;
