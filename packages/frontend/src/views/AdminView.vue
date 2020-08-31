<template>
  <OareContentView title="Admin">
    <OareSubheader>Groups</OareSubheader>

    <!-- Dialog for adding a new group -->
    <v-dialog v-model="addDialog" width="500">
      <template v-slot:activator="{ on }">
        <v-btn v-on="on" color="primary" data-add-group-btn>
          <v-icon class="mr-2">mdi-plus</v-icon>Add Group
        </v-btn>
      </template>
      <v-card class="pa-3">
        <v-card-title primary-title>Add Group</v-card-title>
        <v-card-text>
          <v-text-field
            v-model="groupName"
            @keyup.enter="submitGroup"
            outlined
            label="Group Name"
            data-group-name-tf
          />
          <p class="subtitle error--text">{{ addGroupErrorMsg }}</p>
        </v-card-text>
        <v-divider />
        <v-card-actions>
          <v-spacer />
          <v-btn text @click="addDialog = false" color="error">Cancel</v-btn>
          <v-btn color="primary" @click="submitGroup" data-submit-group-btn>
            <OareButtonSpinner v-if="addGroupLoading" />
            <span v-else>Submit</span>
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-menu>
      <template v-slot:activator="{ on }">
        <v-btn
          v-on="on"
          color="info"
          class="ml-3"
          :disabled="selectedGroups.length < 1"
          data-actions-btn
          >Actions</v-btn
        >
      </template>
      <v-list>
        <v-list-item @click="confirmDeleteDialog = true" data-del-group-btn>
          <v-list-item-title>Delete group</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>

    <v-data-table
      :headers="headers"
      :items="groups"
      show-select
      disable-sort
      item-key="id"
      v-model="selectedGroups"
      :loading="loading"
      class="mt-3"
      data-group-table
    >
      <template v-slot:item.name="{ item }">
        <router-link :to="`/groups/${item.id}`">{{ item.name }}</router-link>
      </template>
    </v-data-table>

    <v-dialog v-model="confirmDeleteDialog" width="500">
      <v-card>
        <v-card-title>Confirm Delete</v-card-title>
        <v-card-text class="subtitle-1">
          All users and permissions will be removed from the following groups.
          Are you sure you want to delete these groups?
          <ul>
            <li v-for="group in selectedGroups" :key="group.id">
              {{ group.name }}
            </li>
          </ul>
        </v-card-text>
        <v-divider />
        <v-card-actions>
          <v-spacer />
          <v-btn @click="confirmDeleteDialog = false" text color="error"
            >No, don't delete</v-btn
          >
          <v-btn @click="deleteGroups" color="primary" data-conf-group-del-btn>
            <OareButtonSpinner v-if="deleteGroupLoading" />
            <span v-else>Yes, delete</span>
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </OareContentView>
</template>

<script lang="ts">
import {
  defineComponent,
  ref,
  onMounted,
  watch,
  Ref,
} from "@vue/composition-api";

import { GetGroupsType, PostGroupsType } from "../types/groups";
import serverProxy from "../serverProxy";

export default defineComponent({
  setup() {
    const headers = ref([
      {
        text: "Group Name",
        value: "name",
      },
      {
        text: "Users",
        value: "num_users",
      },
    ]);
    const groups: Ref<GetGroupsType[]> = ref([]);
    const selectedGroups: Ref<GetGroupsType[]> = ref([]);
    const loading = ref(true);
    const addDialog = ref(false);
    const groupName = ref("");
    const addGroupLoading = ref(false);
    const deleteGroupLoading = ref(false);
    const confirmDeleteDialog = ref(false);
    const addGroupErrorMsg = ref("");

    watch(addDialog, (open) => {
      if (!open) {
        groupName.value = "";
        addGroupErrorMsg.value = "";
      }
    });

    onMounted(async () => {
      groups.value = await serverProxy.getAllGroups();
      loading.value = false;
    });

    const submitGroup = async () => {
      if (groupName.value.trim() === "") {
        addGroupErrorMsg.value = "Group name cannot be blank.";
        return;
      }
      try {
        addGroupLoading.value = true;
        let id = await serverProxy.createGroup(groupName.value);

        groups.value.push({
          id,
          name: groupName.value,
          created_on: new Date(),
          num_users: 0,
        });
        addDialog.value = false;
      } catch (err) {
        addGroupErrorMsg.value = err.response.data.message;
      } finally {
        addGroupLoading.value = false;
      }
    };

    const deleteGroups = async () => {
      try {
        deleteGroupLoading.value = true;
        let delGroupIds = selectedGroups.value.map((item) => item.id);

        await serverProxy.deleteGroups(delGroupIds);

        groups.value = groups.value.filter(
          (group) => !delGroupIds.includes(group.id)
        );

        selectedGroups.value = [];
      } catch (err) {
        // TODO handle error
      } finally {
        confirmDeleteDialog.value = false;
        deleteGroupLoading.value = false;
      }
    };

    return {
      headers,
      groups,
      selectedGroups,
      loading,
      addDialog,
      groupName,
      deleteGroupLoading,
      addGroupLoading,
      submitGroup,
      deleteGroups,
      confirmDeleteDialog,
      addGroupErrorMsg,
    };
  },
});
</script>
