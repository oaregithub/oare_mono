import { RouteConfig } from 'vue-router';
import LoginView from '../views/LoginView.vue';
import RegisterView from '../views/RegisterView.vue';
import AdminGroupView from '../views/AdminView/AdminGroupView.vue';
import AdminTextView from '../views/AdminView/AdminTextView.vue';
import GroupView from '../views/GroupView/index.vue';
import ManageMembers from '@/views/GroupView/ManageMembers.vue';
import ManageTexts from '@/views/GroupView/ManageTexts.vue';
import ManageCollections from '@/views/GroupView/ManageCollections.vue';
import CollectionTexts from '../views/CollectionTexts/index.vue';
import CollectionsView from '../views/CollectionsView/index.vue';
import SearchView from '../views/SearchView/index.vue';
import ForbiddenView from '../views/ForbiddenView.vue';
import DictionaryWord from '../views/DictionaryWord/index.vue';
import EpigraphyView from '../views/EpigraphyView/index.vue';
import Drafts from '../views/DashboardView/Drafts.vue';
import Profile from '../views/DashboardView/Profile.vue';
import LandingPage from '../views/LandingPage.vue';
import WordsView from '../views/WordsView/index.vue';
import NamesView from '../views/NamesView/index.vue';
import PlacesView from '../views/PlacesView/index.vue';
import DictionarySearch from '@/views/SearchView/DictionarySearch.vue';
import TextsSearch from '@/views/SearchView/TextsSearch.vue';
import AddGroupUsers from '@/views/GroupView/AddGroupUsers.vue';
import BlacklistTexts from '@/views/BlacklistView/BlacklistTexts.vue';
import BlacklistCollections from '@/views/BlacklistView/BlacklistCollections.vue';
import AddBlacklistTexts from '@/views/BlacklistView/AddBlacklistTexts.vue';
import AddGroupTexts from '@/views/GroupView/AddGroupTexts.vue';
import AddBlacklistCollections from '@/views/BlacklistView/AddBlacklistCollections.vue';
import AddGroupCollections from '@/views/GroupView/AddGroupCollections.vue';
import SendResetPasswordEmailView from '@/views/SendResetPasswordEmailView.vue';
import ResetPasswordView from '@/views/ResetPasswordView.vue';
import ManagePermissions from '@/views/GroupView/ManagePermissions.vue';

const routes: RouteConfig[] = [
  {
    path: '/',
    component: LandingPage,
  },
  {
    path: '/admin/groups',
    name: 'adminGroups',
    component: AdminGroupView,
  },
  {
    path: '/admin/blacklist',
    name: 'adminBlacklist',
    component: AdminTextView,
    children: [
      {
        path: 'texts',
        name: 'blacklistTexts',
        component: BlacklistTexts,
      },
      {
        path: 'collections',
        name: 'blacklistCollections',
        component: BlacklistCollections,
      },
    ],
  },
  {
    path: '/addblacklist/texts',
    name: 'blacklistAddTexts',
    component: AddBlacklistTexts,
  },
  {
    path: '/addblacklist/collections',
    name: 'blacklistAddCollections',
    component: AddBlacklistCollections,
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
    children: [
      {
        path: 'members',
        name: 'manageMembers',
        props: true,
        component: ManageMembers,
      },
      {
        path: 'texts',
        name: 'manageTexts',
        props: true,
        component: ManageTexts,
      },
      {
        path: 'collections',
        name: 'manageCollections',
        props: true,
        component: ManageCollections,
      },
      {
        path: 'permissions',
        name: 'managePermissions',
        props: true,
        component: ManagePermissions,
      },
    ],
  },
  {
    path: '/addgrouptexts/:groupId',
    name: 'manageGroupTexts',
    component: AddGroupTexts,
    props: true,
  },
  {
    path: '/addgroupcollections/:groupId',
    name: 'manageGroupCollections',
    component: AddGroupCollections,
    props: true,
  },
  {
    path: '/addusers/:groupId',
    name: 'manageGroupUsers',
    component: AddGroupUsers,
    props: true,
  },
  {
    path: '/login',
    name: 'login',
    props: true,
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
    path: '/send_reset_password_email',
    name: 'sendresetpasswordemail',
    component: SendResetPasswordEmailView,
  },
  {
    path: '/reset_password/:uuid',
    name: 'resetpassword',
    component: ResetPasswordView,
    props: true,
  },
  {
    path: '/403',
    name: '403',
    component: ForbiddenView,
  },
];

export default routes;
