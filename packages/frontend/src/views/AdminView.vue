<template>
  <OareContentView title="Admin">
    <OareSubheader>Groups</OareSubheader>
    <OareDialog
      v-model="addDialog"
      title="Add Group"
      @submit="submitGroup"
      :submitLoading="addGroupLoading"
    >
      <template v-slot:activator="{ on }">
        <v-btn v-on="on" color="primary" data-add-group-btn>
          <v-icon class="mr-2">mdi-plus</v-icon>Add Group
        </v-btn>
      </template>

      <v-text-field
        v-model="groupName"
        @keyup.enter="submitGroup"
        outlined
        label="Group Name"
        data-group-name-tf
      />
    </OareDialog>

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
      <template #[`item.name`]="{ item }">
        <router-link :to="`/groups/${item.id}`">{{ item.name }}</router-link>
      </template>
    </v-data-table>
    <OareDialog
      v-model="confirmDeleteDialog"
      title="Confirm Delete"
      cancelText="No, don't delete"
      submitText="Yes, delete"
      @submit="deleteGroups"
      :submitLoading="deleteGroupLoading"
    >
      All users and permissions will be removed from the following groups. Are
      you sure you want to delete these groups?
      <ul>
        <li v-for="group in selectedGroups" :key="group.id">
          {{ group.name }}
        </li>
      </ul>
    </OareDialog>
  </OareContentView>
</template>

<script lang="ts">
import {
  defineComponent,
  ref,
  onMounted,
  watch,
  Ref,
} from '@vue/composition-api';

import { GetGroupsType, PostGroupsType } from '../types/groups';
import serverProxy from '../serverProxy';

export default defineComponent({
  setup() {
    const headers = ref([
      {
        text: 'Group Name',
        value: 'name',
      },
      {
        text: 'Users',
        value: 'num_users',
      },
    ]);
    const groups: Ref<GetGroupsType[]> = ref([]);
    const selectedGroups: Ref<GetGroupsType[]> = ref([]);
    const loading = ref(true);
    const addDialog = ref(false);
    const groupName = ref('');
    const addGroupLoading = ref(false);
    const deleteGroupLoading = ref(false);
    const confirmDeleteDialog = ref(false);
    const addGroupErrorMsg = ref('');

    watch(addDialog, open => {
      if (!open) {
        groupName.value = '';
        addGroupErrorMsg.value = '';
      }
    });

    onMounted(async () => {
      groups.value = await serverProxy.getAllGroups();
      loading.value = false;
    });

    const submitGroup = async () => {
      if (groupName.value.trim() === '') {
        addGroupErrorMsg.value = 'Group name cannot be blank.';
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
        let delGroupIds = selectedGroups.value.map(item => item.id);

        await serverProxy.deleteGroups(delGroupIds);

        groups.value = groups.value.filter(
          group => !delGroupIds.includes(group.id)
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
