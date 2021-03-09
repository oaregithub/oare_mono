<template>
  <OareContentView :title="`Add Users to ${groupName}`" :loading="loading">
    <template #header>
      <router-link :to="`/groups/${groupId}/members`"
        >&larr; Back to group view
      </router-link>
    </template>

    <OareDialog
      v-model="addUsersDialog"
      title="Add users"
      submitText="Yes, add"
      cancelText="No, don't add"
      @submit="addUsers"
      :submitLoading="addUsersLoading"
    >
      <template v-slot:activator="{ on }">
        <v-btn
          v-on="on"
          color="info"
          :disabled="selectedUsers.length === 0"
          class="test-add"
          >Add selected users</v-btn
        >
      </template>
      Are you sure you want to add the following users to this group?
      <v-list>
        <v-list-item v-for="(user, index) in selectedUsers" :key="index">
          {{ user.firstName + ' ' + user.lastName }}
        </v-list-item>
      </v-list>
    </OareDialog>

    <v-data-table
      :headers="usersHeaders"
      :items="unaddedUsers"
      class="mt-3"
      show-select
      v-model="selectedUsers"
      item-key="uuid"
    >
      <template #[`item.name`]="{ item }">
        <span class="test-name">
          {{ item.firstName + ' ' + item.lastName }}
        </span>
      </template>
    </v-data-table>
  </OareContentView>
</template>

<script lang="ts">
import {
  defineComponent,
  ref,
  Ref,
  onMounted,
  computed,
} from '@vue/composition-api';
import { GetUserResponse } from '@oare/types';
import sl from '@/serviceLocator';
import OareContentView from '@/components/base/OareContentView.vue';
import { DataTableHeader } from 'vuetify';

export default defineComponent({
  components: { OareContentView },
  name: 'AddGroupUsers',
  props: {
    groupId: {
      type: String,
      required: true,
    },
  },
  setup({ groupId }) {
    const server = sl.get('serverProxy');
    const actions = sl.get('globalActions');
    const router = sl.get('router');

    const groupName = ref('');
    const usersHeaders: Ref<DataTableHeader[]> = ref([
      { text: 'Name', value: 'name' },
    ]);
    const allUsers: Ref<GetUserResponse[]> = ref([]);
    const unaddedUsers = computed(() => {
      return allUsers.value
        .filter(user => !user.groups.includes(Number(groupId)) && !user.isAdmin)
        .sort((a, b) => {
          return a.firstName.charCodeAt(0) - b.firstName.charCodeAt(0);
        });
    });
    const selectedUsers: Ref<GetUserResponse[]> = ref([]);

    const loading = ref(true);
    const addUsersLoading = ref(false);
    const addUsersDialog = ref(false);

    const addUsers = async () => {
      const userUuids = selectedUsers.value.map(user => user.uuid);
      addUsersLoading.value = true;
      try {
        await server.addUsersToGroup(Number(groupId), {
          userUuids,
        });
        selectedUsers.value = [];
        addUsersDialog.value = false;
        actions.showSnackbar('Successfully added users to group.');
        router.push(`/groups/${groupId}/members`);
      } catch {
        actions.showErrorSnackbar(
          'Error adding users to group. Please try again.'
        );
      } finally {
        addUsersLoading.value = false;
      }
    };

    onMounted(async () => {
      try {
        const groupInfo = await server.getGroupInfo(Number(groupId));
        groupName.value = groupInfo.name;
        allUsers.value = await server.getAllUsers();
      } catch {
        actions.showErrorSnackbar(
          'Error loading group users. Please try again.'
        );
      } finally {
        loading.value = false;
      }
    });

    return {
      groupName,
      loading,
      allUsers,
      unaddedUsers,
      selectedUsers,
      addUsersLoading,
      addUsersDialog,
      addUsers,
      usersHeaders,
    };
  },
});
</script>
