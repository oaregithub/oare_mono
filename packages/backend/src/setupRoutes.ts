import { Express } from 'express'; // eslint-disable-line
import words from './api/words';
import names from './api/names';
import places from './api/places';
import dictionary from './api/dictionary';
import searchDictionary from './api/search_dictionary';
import search from './api/search';
import textEpigraphies from './api/text_epigraphies';
import markups from './api/markups';
import discourses from './api/discourses';
import login from './api/login';
import register from './api/register';
import groups from './api/groups';
import users from './api/users';
import userGroups from './api/user_groups';
import textGroups from './api/text_groups';
import searchTextNames from './api/search_text_names';
import textDrafts from './api/text_drafts';
import collections from './api/collections';
import collectionInfo from './api/collection_info';

const API_PATH = '/api/v2';

export default (app: Express) => {
  app.use(API_PATH, words);
  app.use(API_PATH, names);
  app.use(API_PATH, places);
  app.use(API_PATH, dictionary);
  app.use(API_PATH, searchDictionary);
  app.use(API_PATH, search);
  app.use(API_PATH, textEpigraphies);
  app.use(API_PATH, markups);
  app.use(API_PATH, discourses);
  app.use(API_PATH, login);
  app.use(API_PATH, register);
  app.use(API_PATH, groups);
  app.use(API_PATH, users);
  app.use(API_PATH, userGroups);
  app.use(API_PATH, textGroups);
  app.use(API_PATH, searchTextNames);
  app.use(API_PATH, textDrafts);
  app.use(API_PATH, collections);
  app.use(API_PATH, collectionInfo);
};
