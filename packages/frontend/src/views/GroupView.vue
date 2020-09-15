<template>
  <v-progress-linear v-if="loading" indeterminate />
  <OareContentView v-else :title="groupName">
    <template v-slot:header>
      <router-link to="/admin">&larr; Back to admin view</router-link>
    </template>
    <OareSubheader>Members of {{ groupName }}</OareSubheader>

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
            >{{ user.first_name + " " + user.last_name }}</v-list-item
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
      <template v-slot:item.name="{ item }">{{
        item.first_name + " " + item.last_name
      }}</template>
    </v-data-table>

    <OareSubheader class="mt-6">Group Texts</OareSubheader>Texts here affect all
    members of this group. You may restrict read and write access on texts added
    here.
    <div class="flex mt-2">
      <OareDialog
        title="Add texts"
        v-model="addTextDialog"
        :submitLoading="addTextGroupsLoading"
        @submit="addTextGroups"
        :submitDisabled="textsToAdd.length === 0"
      >
        <template v-slot:activator="{ on }">
          <v-btn color="primary" class="mr-3" v-on="on">
            <v-icon>mdi-plus</v-icon>Add Text
          </v-btn>
        </template>
        <v-autocomplete
          v-model="textsToAdd"
          :search-input.sync="searchTextToAdd"
          outlined
          :items="whitelistTextItems"
          :loading="whitelistSearchLoading"
          item-text="name"
          item-value="uuid"
          hide-no-data
          cache-items
          return-object
          multiple
          chips
          deletable-chips
        ></v-autocomplete>
        <v-data-table :headers="textHeaders" :items="textsToAdd">
          <template v-slot:item.can_read="{ item }">
            <v-checkbox
              :input-value="item.can_read"
              @change="updateTextToAddRead(item.uuid, $event)"
            />
          </template>
          <template v-slot:item.can_write="{ item }">
            <v-checkbox v-model="item.can_write" :disabled="!item.can_read" />
          </template>
          <template v-slot:item.name="{ item }">
            <v-btn icon small @click="removeTextToAdd(item.name)">
              <v-icon>mdi-close</v-icon>
            </v-btn>
            {{ item.name }}
          </template>
        </v-data-table>
      </OareDialog>
      <OareDialog
        title="Remove texts"
        v-model="removeWhitelistTextsDialog"
        cancelText="No, don't remove"
        submitText="Yes, remove"
        @submit="removeWhitelistTexts"
        :submitLoading="removeWhitelistLoading"
      >
        <template v-slot:activator="{ on }">
          <v-btn
            v-on="on"
            color="info"
            :disabled="selectedDeleteWhitelist.length === 0"
            >Remove texts</v-btn
          >
        </template>
        Are you sure you want to remove the following texts from this group?
        Members of this group will no longer be able to view or edit the
        following texts if their visibility is restricted in another group that
        users of this group belong to.
        <v-list>
          <v-list-item
            v-for="(text, index) in selectedDeleteWhitelist"
            :key="index"
          >
            <v-list-item-title>{{ text.name }}</v-list-item-title>
          </v-list-item>
        </v-list>
      </OareDialog>
    </div>
    <v-data-table
      :headers="textHeaders"
      :items="viewableTexts"
      disable-sort
      show-select
      v-model="selectedDeleteWhitelist"
      item-key="text_uuid"
      class="mt-3"
    >
      <template #item.name="{ item }">
        <router-link :to="`/epigraphies/${item.text_uuid}`">{{
          item.name
        }}</router-link>
      </template>
      <template v-slot:item.can_write="{ item }">
        <v-switch
          :input-value="item.can_write"
          @change="updateTextEdit(item.text_uuid, $event)"
          :label="item.can_write ? 'Yes' : 'No'"
          :disabled="!item.can_read"
        />
      </template>
      <template v-slot:item.can_read="{ item }">
        <v-switch
          :input-value="item.can_read"
          @change="updateTextRead(item.text_uuid, $event)"
          :label="item.can_read ? 'Yes' : 'No'"
        />
      </template>
    </v-data-table>
  </OareContentView>
</template>

<script>
import _ from 'lodash';

import serverProxy from '../serverProxy';

export default {
  name: 'GroupView',
  props: {
    groupId: {
      required: true,
    },
  },
  data() {
    return {
      groupName: '', // Name of the group
      groupUsers: [], //
      allUsers: [],
      allTexts: [],
      userChecked: {}, // Maps user id to if they are checked
      textChecked: {}, //Maps text id to if it is checked
      editTexts: {}, //Maps text id to if it has write permission
      loading: false,
      addUserDialog: false,
      addTextDialog: false,
      addUsersLoading: false,
      deleteUserDialog: false,
      deleteUserLoading: false,

      usersHeaders: [{ text: 'Name', value: 'name' }],
      selectedDeleteUsers: [],
      selectedDeleteWhitelist: [],
      selectedUsers: [],
      searchUserInput: null,

      // Data members for searching for whitelisted texts
      textsToAdd: [],
      searchTextToAdd: '',
      whitelistTextItems: [],
      whitelistSearchLoading: false,
      textHeaders: [
        { text: 'Text Name', value: 'name' },
        { text: 'Can view?', value: 'can_read' },
        { text: 'Can edit?', value: 'can_write' },
      ],
      selectedWhitelistItems: [],
      addTextGroupsLoading: false,
      viewableTexts: [],

      // Data members for removing whitelisted texts
      removeWhitelistTextsDialog: false,
      removeWhitelistLoading: false,

      // Data members for updating edit permission on a text
      loadingEditTexts: [], // A list of indices loading
    };
  },

  computed: {
    searchUserItems() {
      const groupUserIds = this.groupUsers.map((user) => user.id);
      return this.allUsers
        .filter((user) => !groupUserIds.includes(user.id))
        .map((user) => ({
          ...user,
          info: `${user.first_name} ${user.last_name} (${user.email})`,
        }));
    },
  },

  methods: {
    async updateTextEdit(uuid, canWrite) {
      const index = this.viewableTexts
        .map((item) => item.text_uuid)
        .indexOf(uuid);
      this.$set(this.viewableTexts[index], 'can_write', canWrite);
      const text = this.viewableTexts[index];
      await serverProxy.updateText(
        this.groupId,
        uuid,
        text.can_read,
        text.can_write
      );
    },
    async updateTextRead(uuid, canRead) {
      const index = this.viewableTexts
        .map((item) => item.text_uuid)
        .indexOf(uuid);
      this.$set(this.viewableTexts[index], 'can_read', canRead);
      // Disable editing if reading is disabled
      if (!canRead) {
        this.$set(this.viewableTexts[index], 'can_write', false);
      }
      const text = this.viewableTexts[index];
      await serverProxy.updateText(
        this.groupId,
        uuid,
        text.can_read,
        text.can_write
      );
    },
    removeTextToAdd(name) {
      this.textsToAdd = this.textsToAdd.filter((text) => text.name !== name);
    },
    async addUsers() {
      this.addUsersLoading = true;
      try {
        await serverProxy.addUsersToGroup(
          this.groupId,
          this.selectedUsers.map((user) => user.id)
        );
        this.selectedUsers.forEach((user) => {
          this.groupUsers.push(user);
        });
        this.addUserDialog = false;
      } catch (err) {
        console.error(err);
      } finally {
        this.addUsersLoading = false;
      }
    },

    async addTextGroups() {
      const textGroups = this.textsToAdd.map((item) => ({
        can_read: item.can_read,
        can_write: item.can_write,
        uuid: item.uuid,
      }));
      this.addTextGroupsLoading = true;
      await serverProxy.addTextGroups(this.groupId, textGroups);

      this.textsToAdd.forEach((item) => {
        this.viewableTexts.unshift({
          ...item,
          text_uuid: item.uuid,
        });
      });
      this.addTextGroupsLoading = false;

      this.addTextDialog = false;
    },

    async removeWhitelistTexts() {
      this.removeWhitelistLoading = true;
      const deleteTextUuids = this.selectedDeleteWhitelist.map(
        (text) => text.text_uuid
      );

      await serverProxy.removeTextsFromGroup(this.groupId, deleteTextUuids);

      this.removeWhitelistLoading = false;
      this.removeWhitelistTextsDialog = false;
      this.selectedDeleteWhitelist = [];
      this.viewableTexts = this.viewableTexts.filter(
        (text) => !deleteTextUuids.includes(text.text_uuid)
      );
    },

    async removeUsers() {
      const userIds = this.selectedDeleteUsers.map((user) => user.id);
      this.deleteUserLoading = true;
      await serverProxy.removeUsersFromGroup(this.groupId, userIds);

      this.deleteUserLoading = false;
      this.deleteUserDialog = false;
      this.selectedDeleteUsers = [];

      this.groupUsers = this.groupUsers.filter(
        (user) => !userIds.includes(user.id)
      );
    },

    updateTextToAddRead(uuid, canRead) {
      const index = this.textsToAdd.map((text) => text.uuid).indexOf(uuid);
      this.$set(this.textsToAdd[index], 'can_read', canRead);

      if (!canRead) {
        this.$set(this.textsToAdd[index], 'can_write', false);
      }
    },
  },

  async mounted() {
    this.loading = true;
    this.groupName = await serverProxy.getGroupName(this.groupId);
    this.allUsers = await serverProxy.getAllUsers();
    this.groupUsers = await serverProxy.getGroupUsers(this.groupId);
    this.viewableTexts = await serverProxy.getTextGroups(this.groupId);
    this.loading = false;
  },

  watch: {
    addUserDialog(open) {
      if (!open) {
        this.selectedUsers = [];
        this.searchUserInput = '';
      } else {
        this.$nextTick(() => {
          this.$nextTick(() => {
            this.$refs.searchUserInput.focus();
          });
        });
      }
    },
    addTextDialog(open) {
      if (!open) {
        this.searchTextToAdd = '';
        this.textsToAdd = [];
        this.selectedWhitelistItems = [];
      }
    },

    selectedUsers: {
      handler(newUsers, oldUsers) {
        if (newUsers.length > oldUsers.length) {
          this.searchUserInput = '';
        }
      },
      deep: true,
    },

    searchTextToAdd: {
      handler: _.debounce(async function(text) {
        if (!text || text.trim() === '') {
          this.whitelistTextItems = [];
          return;
        }

        this.whitelistSearchLoading = true;
        const items = await serverProxy.searchTextNames(text);
        this.whitelistTextItems = items.map((item) => ({
          ...item,
          can_read: true,
          can_write: false,
        }));
        this.whitelistSearchLoading = false;
      }, 500),
    },
  },
};
</script>
