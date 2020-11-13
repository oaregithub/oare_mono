<template>
  <v-progress-linear v-if="loading" indeterminate />
  <div v-else>
    <div style="display: flex">
      <OareDialog
        v-model="addUserDialog"
        title="Add user"
        @submit="addUsers"
        :submitLoading="addUsersLoading"
      >
        <template v-slot:activator="{ on }">
          <v-btn color="primary" v-on="on" class="mr-3 test-add">
            <span> <v-icon>mdi-plus</v-icon>Add users </span>
          </v-btn>
        </template>
        <v-autocomplete
          v-model="selectedUsers"
          outlined
          return-object
          chips
          multiple
          deletable-chips
          :search-input.sync="searchUserInput"
          :items="searchUserItems"
          item-text="info"
          item-value="id"
          autofocus
        ></v-autocomplete>
      </OareDialog>

      <OareDialog
        v-model="deleteUserDialog"
        title="Delete user"
        submitText="Yes, delete"
        cancelText="No, don't delete"
        @submit="removeUsers"
        :submitLoading="deleteUserLoading"
      >
        <template v-slot:activator="{ on }">
          <v-btn
            v-on="on"
            color="info"
            :disabled="selectedDeleteUsers.length === 0"
            class="test-remove"
            >Remove selected users</v-btn
          >
        </template>
        Are you sure you want to remove the following users from this group?
        <v-list>
          <v-list-item
            v-for="(user, index) in selectedDeleteUsers"
            :key="index"
            >{{ user.first_name + ' ' + user.last_name }}</v-list-item
          >
        </v-list>
      </OareDialog>
    </div>
    <v-data-table
      :headers="usersHeaders"
      :items="groupUsers"
      class="mt-3"
      show-select
      v-model="selectedDeleteUsers"
    >
      <template #[`item.name`]="{ item }"
        ><span class="test-name">{{
          item.first_name + ' ' + item.last_name
        }}</span></template
      >
    </v-data-table>
  </div>
</template>

<script lang="ts">
import defaultServerProxy from '@/serverProxy';
import _ from 'lodash';
import {
  defineComponent,
  PropType,
  ref,
  Ref,
  onMounted,
  watch,
  computed,
} from '@vue/composition-api';
import { User } from '@oare/types';
import sl from '@/serviceLocator';

export default defineComponent({
  props: {
    groupId: {
      type: String,
      required: true,
    },
    serverProxy: {
      type: Object as PropType<typeof defaultServerProxy>,
      default: () => defaultServerProxy,
    },
  },
  setup({ serverProxy, groupId }) {
    const addUserDialog = ref(false);
    const addUsersLoading = ref(false);
    const deleteUserLoading = ref(false);
    const deleteUserDialog = ref(false);
    const loading = ref(true);
    const searchUserInput = ref('');

    const allUsers: Ref<User[]> = ref([]);
    const groupUsers: Ref<User[]> = ref([]);
    const selectedUsers: Ref<User[]> = ref([]);
    const selectedDeleteUsers: Ref<User[]> = ref([]);
    const usersHeaders = ref([{ text: 'Name', value: 'name' }]);
    const server = sl.get('serverProxy');
    const actions = sl.get('globalActions');

    const searchUserItems = computed(() => {
      const groupUserIds = groupUsers.value.map(user => user.id);
      return allUsers.value
        .filter(user => !groupUserIds.includes(user.id))
        .map(user => ({
          ...user,
          info: `${user.first_name} ${user.last_name} (${user.email})`,
        }));
    });

    const addUsers = async () => {
      addUsersLoading.value = true;
      try {
        await server.addUsersToGroup(Number(groupId), {
          userIds: selectedUsers.value.map(user => user.id),
        });
        selectedUsers.value.forEach(user => {
          groupUsers.value.push(user);
        });
        addUserDialog.value = false;
        actions.showSnackbar('Successfully added user(s).')
      } catch {
        actions.showErrorSnackbar('Could not add user(s). Please try again.');
      } finally {
        addUsersLoading.value = false;
      }
    };

    const removeUsers = async () => {
      const userIds = selectedDeleteUsers.value.map(user => user.id);
      deleteUserLoading.value = true;
      try {
        await server.removeUsersFromGroup(Number(groupId), { userIds });
        deleteUserDialog.value = false;
        selectedDeleteUsers.value = [];
        actions.showSnackbar('Successfully removed user(s).')
      } catch {
        actions.showErrorSnackbar(
          'Could not remove user(s). Please try again.'
        );
      } finally {
        deleteUserLoading.value = false;
      }
      groupUsers.value = groupUsers.value.filter(
        user => !userIds.includes(user.id)
      );
    };

    watch(addUserDialog, open => {
      if (!open) {
        selectedUsers.value = [];
        searchUserInput.value = '';
      }
    });

    watch(
      selectedUsers,
      (newUsers, oldUsers) => {
        if (newUsers.length > oldUsers.length) {
          searchUserInput.value = '';
        }
      },
      { deep: true, immediate: false }
    );

    onMounted(async () => {
      loading.value = true;
      try {
        allUsers.value = await server.getAllUsers();
        groupUsers.value = await server.getGroupUsers(Number(groupId));
      } catch {
        actions.showErrorSnackbar('Error loading users. Please try again.');
      } finally {
        loading.value = false;
      }
    });

    return {
      addUserDialog,
      addUsersLoading,
      deleteUserLoading,
      deleteUserDialog,
      loading,
      searchUserInput,
      allUsers,
      groupUsers,
      selectedUsers,
      selectedDeleteUsers,
      usersHeaders,
      searchUserItems,
      addUsers,
      removeUsers,
    };
  },
});
</script>
