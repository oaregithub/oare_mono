import { RouteConfig } from 'vue-router';
import adminGuard from '@/navigationGuards/adminGuard';
import authenticatedGuard from '@/navigationGuards/authenticatedGuard';
import permissionGuard from '@/navigationGuards/permissionGuard';
import ManageMembers from '@/views/Admin/Groups/Users/ManageMembers.vue';
import DictionarySearch from '@/views/Search/DictionarySearch/DictionarySearch.vue';
import TextsSearch from '@/views/Search/TextsSearch/TextsSearch.vue';
import AddGroupUsers from '@/views/Admin/Groups/Users/AddGroupUsers.vue';
import DenylistTexts from '@/views/Admin/PublicDenylist/Texts/DenylistTexts.vue';
import DenylistCollections from '@/views/Admin/PublicDenylist/Collections/DenylistCollections.vue';
import AddDenylistTexts from '@/views/Admin/PublicDenylist/Texts/AddDenylistTexts.vue';
import AddDenylistCollections from '@/views/Admin/PublicDenylist/Collections/AddDenylistCollections.vue';
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
import AdminTextView from '../views/Admin/PublicDenylist/AdminTextView.vue';
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
import PropertiesTaxonomy from '../views/Admin/PropertiesTaxonomy/index.vue';
import ManageAllowlist from '../views/Admin/Groups/Allowlist/ManageAllowlist.vue';
import AddAllowlistTexts from '../views/Admin/Groups/Allowlist/Texts/AddAllowlistTexts.vue';
import AddAllowlistCollections from '../views/Admin/Groups/Allowlist/Collections/AddAllowlistCollections.vue';
import ManageEdits from '../views/Admin/Groups/Edits/ManageEdits.vue';
import AddEditTexts from '../views/Admin/Groups/Edits/Texts/AddEditTexts.vue';
import AddEditCollections from '../views/Admin/Groups/Edits/Collections/AddEditCollections.vue';
import AddNewTexts from '../views/Texts/CollectionTexts/AddTexts/index.vue';
import UserPreferences from '../views/Dashboard/UserPreferences.vue';
import BibliographyView from '../views/Bibliography/index.vue';
import AboutView from '../views/About/index.vue';
import TutorialView from '../views/Tutorial/index.vue';
import PublicationsView from '../views/Texts/PublicationsView/index.vue';
import ArchivesView from '../views/Texts/ArchivesView/index.vue';
import ArchiveView from '../views/Texts/ArchivesView/archives/index.vue';
import DossierView from '../views/Texts/ArchivesView/dossiers/index.vue';
import WordsInTextsSearch from '../views/Search/TextsSearch/WordsInTextSearch.vue';
import QuarantinedTexts from '../views/Admin/Quarantine/QuarantinedTexts.vue';
import AnalyticsView from '../views/Admin/Analytics/Analytics.vue';

const routes: RouteConfig[] = [
  {
    path: '/',
    name: 'home',
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
    path: '/admin/denylist',
    name: 'adminDenylist',
    component: AdminTextView,
    beforeEnter: adminGuard,
    children: [
      {
        path: 'texts',
        name: 'denylistTexts',
        component: DenylistTexts,
      },
      {
        path: 'collections',
        name: 'denylistCollections',
        component: DenylistCollections,
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
    path: '/admin/propertiesTaxonomy',
    name: 'adminPropertiesTaxonomy',
    component: PropertiesTaxonomy,
    beforeEnter: adminGuard,
  },
  {
    path: '/admin/add_denylist/texts',
    name: 'denylistAddTexts',
    component: AddDenylistTexts,
    beforeEnter: adminGuard,
  },
  {
    path: '/admin/add_denylist/collections',
    name: 'denylistAddCollections',
    component: AddDenylistCollections,
    beforeEnter: adminGuard,
  },
  {
    path: '/admin/quarantine',
    name: 'adminQuarantine',
    component: QuarantinedTexts,
    beforeEnter: adminGuard,
  },
  {
    path: '/admin/analytics',
    name: 'analytics',
    component: AnalyticsView,
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
        path: 'allowlist',
        name: 'manageAllowlist',
        props: true,
        component: ManageAllowlist,
      },
      {
        path: 'edit',
        name: 'manageEdits',
        props: true,
        component: ManageEdits,
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
    path: '/admin/add_allowlist/texts/:groupId',
    name: 'manageAllowlistTexts',
    component: AddAllowlistTexts,
    props: true,
    beforeEnter: adminGuard,
  },
  {
    path: '/admin/add_allowlist/collections/:groupId',
    name: 'manageAllowlistCollections',
    component: AddAllowlistCollections,
    props: true,
    beforeEnter: adminGuard,
  },
  {
    path: '/admin/add_edit/texts/:groupId',
    name: 'manageEditTexts',
    component: AddEditTexts,
    props: true,
    beforeEnter: adminGuard,
  },
  {
    path: '/admin/add_edit/collections/:groupId',
    name: 'manageEditCollections',
    component: AddEditCollections,
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
      {
        path: 'wordsInTexts',
        name: 'wordsInTextsSearch',
        component: WordsInTextsSearch,
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
    beforeEnter: permissionGuard('ADD_COMMENTS'),
  },
  {
    path: '/dashboard/preferences',
    name: 'dashboardPreferences',
    component: UserPreferences,
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
  {
    path: '/add_collection_text/:collectionUuid',
    name: 'addCollectionText',
    component: AddNewTexts,
    props: true,
    beforeEnter: permissionGuard('ADD_NEW_TEXTS'),
  },
  {
    path: '/add_text_epigraphy/:collectionUuid/:existingTextUuid',
    name: 'addTextEpigraphy',
    component: AddNewTexts,
    props: true,
    beforeEnter: permissionGuard('ADD_NEW_TEXTS'),
  },
  {
    path: '/bibliography',
    name: 'bibliography',
    component: BibliographyView,
  },
  {
    path: '/about',
    name: 'about',
    component: AboutView,
  },
  {
    path: '/tutorial',
    name: 'tutorial',
    component: TutorialView,
  },
  {
    path: '/publications/:letter',
    name: 'publications',
    component: PublicationsView,
    props: true,
  },
  {
    path: '/archives',
    name: 'archives',
    component: ArchivesView,
  },
  {
    path: '/archives/:archiveUuid',
    name: 'archive',
    component: ArchiveView,
    props: true,
  },
  {
    path: '/dossier/:dossierUuid',
    name: 'dossier',
    component: DossierView,
    props: true,
  },
];

export default routes;
