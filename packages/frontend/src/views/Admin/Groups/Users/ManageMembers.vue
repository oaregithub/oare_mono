<template>
  <v-progress-linear v-if="loading" indeterminate />
  <div v-else>
    <div style="display: flex">
      <router-link :to="`/addusers/${groupId}`">
        <v-btn color="primary" class="mr-3 test-add">
          <span> <v-icon>mdi-plus</v-icon>Add users </span>
        </v-btn>
      </router-link>

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
      item-key="uuid"
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
import _ from 'lodash';
import { defineComponent, ref, Ref, onMounted } from '@vue/composition-api';
import { GetUserResponse } from '@oare/types';
import sl from '@/serviceLocator';

export default defineComponent({
  props: {
    groupId: {
      type: String,
      required: true,
    },
  },
  setup({ groupId }) {
    const deleteUserLoading = ref(false);
    const deleteUserDialog = ref(false);
    const loading = ref(true);

    const allUsers: Ref<GetUserResponse[]> = ref([]);
    const groupUsers: Ref<GetUserResponse[]> = ref([]);
    const selectedDeleteUsers: Ref<GetUserResponse[]> = ref([]);
    const usersHeaders = ref([{ text: 'Name', value: 'name' }]);
    const server = sl.get('serverProxy');
    const actions = sl.get('globalActions');

    const removeUsers = async () => {
      const userUuids = selectedDeleteUsers.value.map(user => user.uuid);
      deleteUserLoading.value = true;
      try {
        await server.removeUsersFromGroup(Number(groupId), { userUuids });
        deleteUserDialog.value = false;
        selectedDeleteUsers.value = [];
        actions.showSnackbar('Successfully removed user(s).');
      } catch {
        actions.showErrorSnackbar(
          'Could not remove user(s). Please try again.'
        );
      } finally {
        deleteUserLoading.value = false;
      }
      groupUsers.value = groupUsers.value.filter(
        user => !userUuids.includes(user.uuid)
      );
    };

    onMounted(async () => {
      loading.value = true;
      try {
        allUsers.value = await server.getAllUsers();
        groupUsers.value = allUsers.value.filter(user =>
          user.groups.includes(Number(groupId))
        );
      } catch {
        actions.showErrorSnackbar('Error loading users. Please try again.');
      } finally {
        loading.value = false;
      }
    });

    return {
      deleteUserLoading,
      deleteUserDialog,
      loading,
      allUsers,
      groupUsers,
      selectedDeleteUsers,
      usersHeaders,
      removeUsers,
    };
  },
});
</script>
