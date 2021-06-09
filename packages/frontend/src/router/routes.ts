import { RouteConfig } from 'vue-router';
import adminGuard from '@/navigationGuards/adminGuard';
import authenticatedGuard from '@/navigationGuards/authenticatedGuard';
import permissionGuard from '@/navigationGuards/permissionGuard';
import ManageMembers from '@/views/Admin/Groups/Users/ManageMembers.vue';
import ManageTexts from '@/views/Admin/Groups/Texts/ManageTexts.vue';
import ManageCollections from '@/views/Admin/Groups/Collections/ManageCollections.vue';
import DictionarySearch from '@/views/Search/DictionarySearch/DictionarySearch.vue';
import TextsSearch from '@/views/Search/TextsSearch/TextsSearch.vue';
import AddGroupUsers from '@/views/Admin/Groups/Users/AddGroupUsers.vue';
import BlacklistTexts from '@/views/Admin/PublicBlacklist/Texts/BlacklistTexts.vue';
import BlacklistCollections from '@/views/Admin/PublicBlacklist/Collections/BlacklistCollections.vue';
import AddBlacklistTexts from '@/views/Admin/PublicBlacklist/Texts/AddBlacklistTexts.vue';
import AddGroupTexts from '@/views/Admin/Groups/Texts/AddGroupTexts.vue';
import AddBlacklistCollections from '@/views/Admin/PublicBlacklist/Collections/AddBlacklistCollections.vue';
import AddGroupCollections from '@/views/Admin/Groups/Collections/AddGroupCollections.vue';
import SendResetPasswordEmailView from '@/views/Authentication/ResetPassword/SendResetPasswordEmailView.vue';
import ResetPasswordView from '@/views/Authentication/ResetPassword/ResetPasswordView.vue';
import ManagePermissions from '@/views/Admin/Groups/Permissions/ManagePermissions.vue';
import EpigraphyEditor from '@/views/Texts/EpigraphyView/Editor/EpigraphyEditor.vue';
import EpigraphyFullDisplay from '@/views/Texts/EpigraphyView/EpigraphyDisplay/EpigraphyFullDisplay.vue';
import DictionaryWord from '@/components/DictionaryDisplay/DictionaryWord/index.vue';
import KnownIssues from '../views/Home/KnownIssues.vue';
import LoginView from '../views/Authentication/Login/LoginView.vue';
import RegisterView from '../views/Authentication/Register/RegisterView.vue';
import AdminGroupView from '../views/Admin/Groups/AdminGroupView.vue';
import AdminTextView from '../views/Admin/PublicBlacklist/AdminTextView.vue';
import AdminDraftsView from '../views/Admin/Drafts/AdminDraftsView.vue';
import GroupView from '../views/Admin/Groups/index.vue';
import CollectionTexts from '../views/Texts/CollectionTexts/index.vue';
import CollectionsView from '../views/Texts/CollectionsView/index.vue';
import SearchView from '../views/Search/index.vue';
import ForbiddenView from '../views/Authentication/Forbidden/ForbiddenView.vue';
import EpigraphyView from '../views/Texts/EpigraphyView/index.vue';
import Drafts from '../views/Dashboard/Drafts.vue';
import Profile from '../views/Dashboard/Profile.vue';
import LandingPage from '../views/Home/LandingPage.vue';
import WordsView from '../views/Words/index.vue';
import NamesView from '../views/Names/index.vue';
import PlacesView from '../views/Places/index.vue';
import ErrorLog from '../views/Admin/ErrorLog/ErrorLog.vue';
import AdminCommentView from '../views/Admin/Comments/AdminCommentView.vue';
import UserCommentView from '../views/Dashboard/UserCommentView.vue';
import AdminSettings from '../views/Admin/Settings/AdminSettings.vue';
import PersonsView from '../views/Persons/index.vue';
import SwaggerView from '../views/Swagger/index.vue';
import ParseTree from '../views/Admin/ParseTree/index.vue';

const routes: RouteConfig[] = [
  {
    path: '/',
    component: LandingPage,
  },
  {
    path: '/admin/swagger',
    name: 'adminSwagger',
    component: SwaggerView,
    beforeEnter: adminGuard,
  },
  {
    path: '/issues',
    component: KnownIssues,
  },
  {
    path: '/admin/groups',
    name: 'adminGroups',
    component: AdminGroupView,
    beforeEnter: adminGuard,
  },
  {
    path: '/admin/blacklist',
    name: 'adminBlacklist',
    component: AdminTextView,
    beforeEnter: adminGuard,
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
    path: '/admin/errors',
    name: 'adminErrors',
    component: ErrorLog,
    beforeEnter: adminGuard,
  },
  {
    path: '/admin/comments',
    name: 'adminComments',
    component: AdminCommentView,
    beforeEnter: adminGuard,
  },
  {
    path: '/admin/drafts',
    name: 'adminDrafts',
    component: AdminDraftsView,
    beforeEnter: adminGuard,
  },
  {
    path: '/admin/settings',
    name: 'adminSettings',
    component: AdminSettings,
    beforeEnter: adminGuard,
  },
  {
    path: '/admin/parseTree',
    name: 'adminParseTree',
    component: ParseTree,
    beforeEnter: adminGuard,
  },
  {
    path: '/addblacklist/texts',
    name: 'blacklistAddTexts',
    component: AddBlacklistTexts,
    beforeEnter: adminGuard,
  },
  {
    path: '/addblacklist/collections',
    name: 'blacklistAddCollections',
    component: AddBlacklistCollections,
    beforeEnter: adminGuard,
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
    component: EpigraphyView,
    props: true,
    children: [
      {
        name: 'epigraphyEditor',
        path: 'edit',
        component: EpigraphyEditor,
        props: true,
      },
      {
        name: 'epigraphies',
        path: ':discourseToHighlight?',
        component: EpigraphyFullDisplay,
        props: true,
      },
    ],
  },
  {
    path: '/groups/:groupId',
    name: 'groups',
    component: GroupView,
    props: true,
    beforeEnter: adminGuard,
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
    beforeEnter: adminGuard,
  },
  {
    path: '/addgroupcollections/:groupId',
    name: 'manageGroupCollections',
    component: AddGroupCollections,
    props: true,
    beforeEnter: adminGuard,
  },
  {
    path: '/addusers/:groupId',
    name: 'manageGroupUsers',
    component: AddGroupUsers,
    props: true,
    beforeEnter: adminGuard,
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
    props: route => ({
      uuid: route.params.uuid,
      route: 'words',
    }),
    beforeEnter: permissionGuard('WORDS'),
  },
  {
    path: '/namesWord/:uuid',
    name: 'namesWord',
    component: DictionaryWord,
    props: route => ({
      uuid: route.params.uuid,
      route: 'names',
    }),
    beforeEnter: permissionGuard('NAMES'),
  },
  {
    path: '/placesWord/:uuid',
    name: 'placesWord',
    component: DictionaryWord,
    props: route => ({
      uuid: route.params.uuid,
      route: 'places',
    }),
    beforeEnter: permissionGuard('PLACES'),
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
    beforeEnter: authenticatedGuard,
  },
  {
    path: '/dashboard/profile',
    name: 'dashboardProfile',
    component: Profile,
    beforeEnter: authenticatedGuard,
  },
  {
    path: '/dashboard/comments',
    name: 'dashboardComments',
    component: UserCommentView,
    beforeEnter: authenticatedGuard,
  },
  {
    path: '/words/:letter',
    name: 'words',
    component: WordsView,
    props: true,
    beforeEnter: permissionGuard('WORDS'),
  },
  {
    path: '/names/:letter',
    name: 'names',
    component: NamesView,
    props: true,
    beforeEnter: permissionGuard('NAMES'),
  },
  {
    path: '/places/:letter',
    name: 'places',
    component: PlacesView,
    props: true,
    beforeEnter: permissionGuard('PLACES'),
  },
  {
    path: '/people/:letter',
    name: 'people',
    component: PersonsView,
    props: true,
    beforeEnter: permissionGuard('PEOPLE'),
  },
  {
    path: '/send_reset_password_email',
    name: 'sendresetpasswordemail',
    component: SendResetPasswordEmailView,
  },
  {
    path: '/reset_password',
    name: 'resetpassword',
    component: ResetPasswordView,
  },
  {
    path: '/403',
    name: '403',
    component: ForbiddenView,
  },
];

export default routes;
