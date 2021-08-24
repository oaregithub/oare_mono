import cacheStatus from './endpoints/cache_status';
import collectionInfo from './endpoints/collection_info';
import collections from './endpoints/collections';
import comments from './endpoints/comments';
import dictionary from './endpoints/dictionary';
import errors from './endpoints/errors';
import profile from './endpoints/profile';
import threads from './endpoints/threads';
import users from './endpoints/users';
import publicDenylist from './endpoints/public_denylist';
import groupAllowlist from './endpoints/group_allowlist';
import groupEditPermissions from './endpoints/group_edit_permissions';
import groups from './endpoints/groups';
import names from './endpoints/names';
import people from './endpoints/people';
import permissions from './endpoints/permissions';
import places from './endpoints/places';
import register from './endpoints/register';
import search from './endpoints/search';
import searchDictionary from './endpoints/search_dictionary';
import searchNames from './endpoints/search_names';
import textEpigraphies from './endpoints/text_epigraphies';

const server =
  process.env.NODE_ENV === 'development'
    ? 'http://localhost:8080'
    : 'https://oare.byu.edu';

export default {
  openapi: '3.0.0',
  info: {
    title: 'OARE API',
    description: 'Backend routes used by the OARE frontend to render data.',
  },
  servers: [
    {
      url: `${server}/api/v2`,
    },
  ],
  paths: {
    ...cacheStatus,
    ...collectionInfo,
    ...collections,
    ...comments,
    ...dictionary,
    ...errors,
    ...profile,
    ...threads,
    ...users,
    ...publicDenylist,
    ...groups,
    ...groupAllowlist,
    ...groupEditPermissions,
    ...names,
    ...people,
    ...permissions,
    ...places,
    ...register,
    ...search,
    ...searchDictionary,
    ...searchNames,
    ...textEpigraphies,
  },
};
