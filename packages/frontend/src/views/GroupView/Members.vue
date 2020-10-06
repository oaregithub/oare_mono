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
          <v-btn color="primary" v-on="on" class="mr-3">
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
          ref="searchUserInput"
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
      <template #[`item.name`]="{ item }">{{
        item.first_name + ' ' + item.last_name
      }}</template>
    </v-data-table>
  </div>
</template>

<script>
import serverProxy from '@/serverProxy';

export default {
  props: {
    groupId: {
      type: String,
      required: true,
    },
  },
  data: () => ({
    addUserDialog: false,
    addUsersLoading: false,
    deleteUserLoading: false,
    allUsers: [],
    selectedUsers: [],
    groupUsers: [],
    searchUserInput: '',
    deleteUserDialog: false,
    selectedDeleteUsers: [],
    usersHeaders: [{ text: 'Name', value: 'name' }],
    loading: true,
  }),
  watch: {
    addUserDialog(open) {
      if (!open) {
        this.selectedUsers = [];
        this.searchUserInput = '';
      }
    },
  },
  computed: {
    searchUserItems() {
      const groupUserIds = this.groupUsers.map(user => user.id);
      return this.allUsers
        .filter(user => !groupUserIds.includes(user.id))
        .map(user => ({
          ...user,
          info: `${user.first_name} ${user.last_name} (${user.email})`,
        }));
    },
  },
  methods: {
    async addUsers() {
      this.addUsersLoading = true;
      try {
        await serverProxy.addUsersToGroup(
          this.groupId,
          this.selectedUsers.map(user => user.id)
        );
        this.selectedUsers.forEach(user => {
          this.groupUsers.push(user);
        });
        this.addUserDialog = false;
      } catch (err) {
        console.error(err);
      } finally {
        this.addUsersLoading = false;
      }
    },
    async removeUsers() {
      const userIds = this.selectedDeleteUsers.map(user => user.id);
      this.deleteUserLoading = true;
      await serverProxy.removeUsersFromGroup(this.groupId, userIds);

      this.deleteUserLoading = false;
      this.deleteUserDialog = false;
      this.selectedDeleteUsers = [];

      this.groupUsers = this.groupUsers.filter(
        user => !userIds.includes(user.id)
      );
    },
  },
  async mounted() {
    this.allUsers = await serverProxy.getAllUsers();
    this.groupUsers = await serverProxy.getGroupUsers(this.groupId);
    this.loading = false;
  },
};
</script>

<style></style>
