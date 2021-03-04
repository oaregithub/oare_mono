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
        <v-btn v-on="on" color="primary" class="test-add-group">
          <v-icon class="mr-2">mdi-plus</v-icon>Add Group
        </v-btn>
      </template>

      <v-text-field
        v-model="groupName"
        @keyup.enter="submitGroup"
        outlined
        label="Group Name"
        class="test-group-name"
        autofocus
      />
    </OareDialog>

    <v-menu>
      <template v-slot:activator="{ on }">
        <v-btn
          v-on="on"
          color="info"
          class="ml-3 test-actions"
          :disabled="selectedGroups.length < 1"
          data-actions-btn
          >Actions</v-btn
        >
      </template>
      <v-list>
        <v-list-item @click="confirmDeleteDialog = true" data-del-group-btn>
          <v-list-item-title class="test-delete-group"
            >Delete group</v-list-item-title
          >
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
        <router-link
          :to="`/groups/${item.id}/members`"
          class="test-group-name"
          >{{ item.name }}</router-link
        >
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
import { Group } from '@oare/types';
import sl from '@/serviceLocator';

export default defineComponent({
  setup() {
    const server = sl.get('serverProxy');
    const actions = sl.get('globalActions');

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
    const groups: Ref<Group[]> = ref([]);
    const selectedGroups: Ref<Group[]> = ref([]);
    const loading = ref(false);
    const addDialog = ref(false);
    const groupName = ref('');
    const addGroupLoading = ref(false);
    const deleteGroupLoading = ref(false);
    const confirmDeleteDialog = ref(false);

    watch(addDialog, open => {
      if (!open) {
        groupName.value = '';
      }
    });

    onMounted(async () => {
      loading.value = true;
      try {
        groups.value = await server.getAllGroups();
      } catch {
        actions.showErrorSnackbar('Failed to fetch groups');
      } finally {
        loading.value = false;
      }
    });

    const submitGroup = async () => {
      if (groupName.value.trim() === '') {
        actions.showErrorSnackbar('Group name cannot be blank.');
        return;
      }
      try {
        addGroupLoading.value = true;
        const id = await server.createGroup({
          groupName: groupName.value,
          description: '',
        });

        groups.value.push({
          id,
          name: groupName.value,
          created_on: new Date(),
          num_users: 0,
          description: '',
        });
        actions.showSnackbar('Successfully created group');
        addDialog.value = false;
      } catch (err) {
        actions.showErrorSnackbar('Failed to create group');
      } finally {
        addGroupLoading.value = false;
      }
    };

    const deleteGroups = async () => {
      try {
        deleteGroupLoading.value = true;
        let delGroupIds = selectedGroups.value.map(item => item.id);

        await Promise.all(delGroupIds.map(id => server.deleteGroup(id)));

        groups.value = groups.value.filter(
          group => !delGroupIds.includes(group.id)
        );
        actions.showSnackbar('Successfully deleted groups');
        selectedGroups.value = [];
      } catch (err) {
        actions.showErrorSnackbar('Failed to delete group');
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
    };
  },
});
</script>
