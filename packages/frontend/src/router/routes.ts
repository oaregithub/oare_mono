import { RouteConfig } from 'vue-router';
import LoginView from '../views/LoginView.vue';
import RegisterView from '../views/RegisterView.vue';
import AdminView from '../views/AdminView.vue';
import GroupView from '../views/GroupView.vue';
import CollectionTexts from '../views/CollectionTexts/index.vue';
import CollectionsView from '../views/CollectionsView/index.vue';
import SearchView from '../views/SearchView/index.vue';
import ForbiddenView from '../views/ForbiddenView.vue';
import DictionaryWord from '../views/DictionaryWord.vue';
import EpigraphyView from '../views/EpigraphyView/index.vue';
import Drafts from '../views/DashboardView/Drafts.vue';
import Profile from '../views/DashboardView/Profile.vue';
import LandingPage from '../views/LandingPage.vue';
import WordsView from '../views/WordsView/index.vue';
import NamesView from '../views/NamesView/index.vue';
import PlacesView from '../views/PlacesView/index.vue';
import DictionarySearch from '@/views/SearchView/DictionarySearch.vue';
import TextsSearch from '@/views/SearchView/TextsSearch.vue';
import TestCdli from './TestCdli.vue';

const routes: RouteConfig[] = [
  {
    path: '/',
    component: LandingPage,
  },
  {
    path: '/admin',
    name: 'admin',
    component: AdminView,
  },
  {
    path: '/collections/name/:collectionUuid',
    name: 'collectionTexts',
    component: CollectionTexts,
    props: true,
  },
  {
    path: '/collections/:letter',
    name: 'collections',
    component: CollectionsView,
    props: true,
  },
  {
    path: '/epigraphies/:textUuid',
    name: 'epigraphies',
    component: EpigraphyView,
    props: true,
  },
  {
    path: '/groups/:groupId',
    name: 'groups',
    component: GroupView,
    props: true,
  },
  {
    path: '/login',
    name: 'login',
    component: LoginView,
  },
  {
    path: '/register',
    name: 'register',
    component: RegisterView,
  },
  {
    path: '/dictionaryWord/:uuid',
    name: 'dictionaryWord',
    component: DictionaryWord,
    props: true,
  },
  {
    path: '/search',
    name: 'search',
    component: SearchView,
    children: [
      {
        path: 'dictionary',
        name: 'dictionarySearch',
        component: DictionarySearch,
      },
      {
        path: 'texts',
        name: 'textsSearch',
        component: TextsSearch,
      },
    ],
  },
  {
    path: '/dashboard/drafts',
    name: 'dashboardDrafts',
    component: Drafts,
  },
  {
    path: '/dashboard/profile',
    name: 'dashboardProfile',
    component: Profile,
  },
  {
    path: '/words/:letter',
    name: 'words',
    component: WordsView,
    props: true,
  },
  {
    path: '/names/:letter',
    name: 'names',
    component: NamesView,
    props: true,
  },
  {
    path: '/places/:letter',
    name: 'places',
    component: PlacesView,
    props: true,
  },
  {
    path: '/403',
    name: '403',
    component: ForbiddenView,
  },
];

export default routes;
