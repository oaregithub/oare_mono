import textGroups from './text_groups';
import groups from './groups';
import users from './users';
import userGroups from './user_groups';
import searchTextNames from './search_text_names';
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
import textInfo from './text_info';
import searchCollectionNames from './search_collection_names';
import collectionGroups from './collection_groups';
import resetPassword from './reset_password';

const serverProxy = {
  ...textGroups,
  ...groups,
  ...users,
  ...userGroups,
  ...searchTextNames,
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
  ...textInfo,
  ...searchCollectionNames,
  ...collectionGroups,
  ...resetPassword,
};

export type ServerProxyType = typeof serverProxy;

export default serverProxy;
