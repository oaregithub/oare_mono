import axios from '../axiosInstance';

/**
 * @typedef {Object} TextGroup
 * @property {string} uuid The UUID of the text to be added to the group
 * @property {bool} can_write True if users in the group can edit the text
 */
/**
 * Whitelist texts for viewing and possibly editing in a given group
 * @param {number} groupId The ID of the group to add the texts to
 * @param {TextGroup[]} textGroups A list of texts to whitelist
 */
async function addTextGroups(groupId, textGroups) {
  await axios.post('/text_groups', {
    group_id: groupId,
    texts: textGroups
  });
}

/**
 * Get a list of texts belonging to a group
 * @param {number} groupId The ID of the group to get the texts from
 */
async function getTextGroups(groupId) {
  let { data } = await axios.get('/text_groups', {
    params: {
      group_id: groupId
    }
  });
  return data;
}

/**
 * Remove texts from a group
 * @param {number} groupId The ID of the group to remove texts from
 * @param {string[]} texts An array of UUIDs of texts to remove from the group
 */
async function removeTextsFromGroup(groupId, texts) {
  await axios.delete('/text_groups', {
    params: {
      group_id: groupId,
      texts
    }
  });
}

/**
 * Update write permissions on a text for a group
 * @param {number} groupId The ID of the group to update the permission in
 * @param {string} textUuid The UUID of the text to update
 * @param {boolean} canRead True if the text can be seen by members of the group
 * @param {boolean} canWrite True if the text can be edited by members of the group
 */
async function updateText(groupId, textUuid, canRead, canWrite) {
  await axios.patch('/text_groups', {
    group_id: groupId,
    text_uuid: textUuid,
    can_read: canRead,
    can_write: canWrite
  });
}

export default {
  addTextGroups,
  getTextGroups,
  removeTextsFromGroup,
  updateText
};
