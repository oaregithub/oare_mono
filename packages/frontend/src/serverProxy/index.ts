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
import markups from './markups';
import names from './names';
import discourses from './discourses';
import places from './places';
import words from './words';
import searchDictionary from './search_dictionary';
import permissions from './permissions';
import login from './login';
import register from './register';
import logout from './logout';
import refreshToken from './refresh_token';

export default {
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
  ...markups,
  ...names,
  ...discourses,
  ...places,
  ...words,
  ...searchDictionary,
  ...permissions,
  ...login,
  ...register,
  ...logout,
  ...refreshToken,
};
