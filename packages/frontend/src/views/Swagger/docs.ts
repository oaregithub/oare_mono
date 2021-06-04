import cacheStatus from './endpoints/cache_status';
import collectionGroups from './endpoints/collection_groups';
import collectionInfo from './endpoints/collection_info';
import collections from './endpoints/collections';
import profile from './endpoints/profile';
import threads from './endpoints/threads';
import users from './endpoints/users';

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
    ...collectionGroups,
    ...collectionInfo,
    ...collections,
    ...profile,
    ...threads,
    ...users,
  },
};
