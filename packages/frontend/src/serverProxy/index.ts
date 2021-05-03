import comments from '@/serverProxy/comments';
import errors from '@/serverProxy/errors';
import threads from '@/serverProxy/threads';
import textGroups from './text_groups';
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
import refreshToken from './refresh_token';
import publicBlacklist from './public_blacklist';
import searchNames from './search_names';
import collectionGroups from './collection_groups';
import resetPassword from './reset_password';
import cacheStatus from './cache_status';
import people from './people';
import textDiscourse from './text_discourse';

const serverProxy = {
  ...textGroups,
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
  ...refreshToken,
  ...publicBlacklist,
  ...searchNames,
  ...collectionGroups,
  ...resetPassword,
  ...comments,
  ...errors,
  ...threads,
  ...cacheStatus,
  ...people,
  ...textDiscourse,
};

export type ServerProxyType = typeof serverProxy;

export default serverProxy;
