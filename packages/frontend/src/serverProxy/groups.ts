import axios from "../axiosInstance";
import { GetGroupsType } from "../types/groups";

async function getAllGroups(): Promise<GetGroupsType[]> {
  const { data } = await axios.get("/groups");
  return data;
}
/**
 * Get the name of a group given its ID
 * @param {number} groupId The ID of the group whose name to get
 */
async function getGroupName(groupId: number): Promise<string> {
  let {
    data: { name },
  } = await axios.get(`/groups/${groupId}`);
  return name;
}

async function deleteGroups(delGroupIds: number[]) {
  await axios.delete("/groups", {
    params: {
      group_ids: delGroupIds,
    },
  });
}

async function createGroup(groupName: string): Promise<number> {
  let {
    data: { id },
  } = await axios.post("/groups", {
    group_name: groupName,
  });
  return id;
}

export default {
  getGroupName,
  deleteGroups,
  getAllGroups,
  createGroup,
};
