import { Express } from 'express';
import words from './api/words';
import names from './api/names';
import places from './api/places';
import dictionary from './api/dictionary';
import searchDictionary from './api/search_dictionary';
import search from './api/search';
import textEpigraphies from './api/text_epigraphies';
import login from './api/login';
import register from './api/register';
import groups from './api/groups';
import users from './api/users';
import userGroups from './api/user_groups';
import textGroups from './api/text_groups';
import textDrafts from './api/text_drafts';
import collections from './api/collections';
import collectionInfo from './api/collection_info';
import logout from './api/logout';
import refreshToken from './api/refresh_token';
import permissions from './api/permissions';
import publicBlacklist from './api/public_blacklist';
import searchNames from './api/search_names';
import collectionGroups from './api/collection_groups';
import resetPassword from './api/reset_password';
import comments from './api/comments';
import errors from './api/errors';
import threads from './api/threads';
import cacheStatus from './api/cache_status';
import textDiscourse from './api/text_discourse';

export const API_PATH = '/api/v2';

export default (app: Express) => {
  app.use(API_PATH, words);
  app.use(API_PATH, names);
  app.use(API_PATH, places);
  app.use(API_PATH, dictionary);
  app.use(API_PATH, searchDictionary);
  app.use(API_PATH, search);
  app.use(API_PATH, textEpigraphies);
  app.use(API_PATH, login);
  app.use(API_PATH, register);
  app.use(API_PATH, groups);
  app.use(API_PATH, users);
  app.use(API_PATH, userGroups);
  app.use(API_PATH, textGroups);
  app.use(API_PATH, textDrafts);
  app.use(API_PATH, collections);
  app.use(API_PATH, collectionInfo);
  app.use(API_PATH, logout);
  app.use(API_PATH, refreshToken);
  app.use(API_PATH, permissions);
  app.use(API_PATH, publicBlacklist);
  app.use(API_PATH, searchNames);
  app.use(API_PATH, collectionGroups);
  app.use(API_PATH, resetPassword);
  app.use(API_PATH, comments);
  app.use(API_PATH, errors);
  app.use(API_PATH, threads);
  app.use(API_PATH, cacheStatus);
  app.use(API_PATH, textDiscourse);
};
