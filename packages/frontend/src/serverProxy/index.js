import axios from '../axiosInstance';
import textGroups from './text_groups';
import groups from './groups';
import users from './users';
import userGroups from './user_groups';
import searchTextNames from './search_text_names';
import dictionary from './dictionary';
import searchTexts from './search';
import collections from './collections';
import hierarchies from './hierarchies';
import textDrafts from './text_drafts';
import epigraphies from './epigraphies';
import markups from './markups';
import names from './names';
import discourses from './discourses';
import places from './places';
import words from './words';
import searchDictionary from './search_dictionary';

async function registerUser(userData) {
  let { data } = await axios.post('/register', userData);
  return data;
}

async function loginUser(userData) {
  let { data } = await axios.post('/login', userData);
  return data;
}

async function markupsGet(textUuid) {
  let { data } = await axios.get('/markups/' + textUuid);
  return data;
}

async function textEpigraphiesGet(textUuid) {
  let { data } = await axios.get(`/text_epigraphies/${textUuid}`);
  return data;
}

async function addGroup(groupName) {
  let { data } = await axios.post('/group', {
    group_name: groupName,
  });
  return data;
}

async function groupPatch(groupID, newName) {
  await axios.patch('/group', {
    group_id: groupID,
    new_name: newName,
  });
}

async function deleteTextPerms(groupId, selectedPermRows) {
  let { data: texts } = await axios.put(`/group_rw/${groupId}`, {
    user_group_ids: selectedPermRows.map((item) => item.text_id),
  });
  return texts;
}

async function insertTextPerms(groupId, addTexts) {
  let { data: texts } = await axios.post('/group_rw', {
    group_id: Number(groupId),
    texts: addTexts,
  });
  return texts;
}

async function deleteUser(user_id, groupId) {
  let { data } = await axios.delete(
    `/user_group?user_id=${user_id}&group_id=${groupId}`
  );
  return data;
}

async function textTextGet() {
  let { data: texts } = await axios.get('/text_text');
  return texts;
}

async function groupRWGet(groupId) {
  let { data: groupPerms } = await axios.get(`/group_rw/${groupId}`);
  return groupPerms;
}

export default {
  registerUser,
  loginUser,
  markupsGet,
  textEpigraphiesGet,
  addGroup,
  groupPatch,
  deleteTextPerms,
  insertTextPerms,
  deleteUser,
  textTextGet,
  groupRWGet,
  ...textGroups,
  ...groups,
  ...users,
  ...userGroups,
  ...searchTextNames,
  ...dictionary,
  ...searchTexts,
  ...collections,
  ...hierarchies,
  ...textDrafts,
  ...epigraphies,
  ...markups,
  ...names,
  ...discourses,
  ...places,
  ...words,
  ...searchDictionary
};
