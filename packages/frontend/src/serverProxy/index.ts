import archives from '@/serverProxy/archives';
import bibliography from '@/serverProxy/bibliography';
import cacheStatus from '@/serverProxy/cache_status';
import collections from '@/serverProxy/collections';
import comments from '@/serverProxy/comments';
import dictionaryForm from '@/serverProxy/dictionary_form';
import dictionarySpelling from '@/serverProxy/dictionary_spelling';
import dictionaryWord from '@/serverProxy/dictionary_word';
import environment from '@/serverProxy/environment';
import epigraphies from '@/serverProxy/epigraphies';
import errors from '@/serverProxy/errors';
import field from '@/serverProxy/field';
import groupAllowlist from '@/serverProxy/group_allowlist';
import groupEditPermissions from '@/serverProxy/group_edit_permissions';
import groups from '@/serverProxy/groups';
import login from '@/serverProxy/login';
import logout from '@/serverProxy/logout';
import pageContent from '@/serverProxy/page_content';
import periods from '@/serverProxy/periods';
import permissions from '@/serverProxy/permissions';
import persons from '@/serverProxy/persons';
import profile from '@/serverProxy/profile';
import properties from '@/serverProxy/properties';
import publications from '@/serverProxy/publications';
import publicDenylist from '@/serverProxy/public_denylist';
import quarantine from '@/serverProxy/quarantine';
import register from '@/serverProxy/register';
import resetPassword from '@/serverProxy/reset_password';
import resource from '@/serverProxy/resource';
import seals from '@/serverProxy/seals';
import searchTexts from '@/serverProxy/search';
import signReading from '@/serverProxy/sign_reading';
import textDiscourse from '@/serverProxy/text_discourse';
import text from '@/serverProxy/text';
import threads from '@/serverProxy/threads';
import userGroups from '@/serverProxy/user_groups';
import users from '@/serverProxy/users';

const serverProxy = {
  ...archives,
  ...bibliography,
  ...cacheStatus,
  ...collections,
  ...comments,
  ...dictionaryForm,
  ...dictionarySpelling,
  ...dictionaryWord,
  ...environment,
  ...epigraphies,
  ...errors,
  ...field,
  ...groupAllowlist,
  ...groupEditPermissions,
  ...groups,
  ...login,
  ...logout,
  ...pageContent,
  ...periods,
  ...permissions,
  ...persons,
  ...profile,
  ...properties,
  ...publications,
  ...publicDenylist,
  ...quarantine,
  ...register,
  ...resetPassword,
  ...resource,
  ...seals,
  ...searchTexts,
  ...signReading,
  ...textDiscourse,
  ...text,
  ...threads,
  ...userGroups,
  ...users,
};

export type ServerProxyType = typeof serverProxy;

export default serverProxy;
