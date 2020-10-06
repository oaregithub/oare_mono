<template>
  <v-progress-linear v-if="loading" indeterminate />
  <OareContentView v-else :title="groupName">
    <template v-slot:header>
      <router-link to="/admin">&larr; Back to admin view</router-link>
    </template>

    <v-tabs class="mb-3">
      <v-tab>Members</v-tab>
      <v-tab>Texts</v-tab>
      <v-tab>Permissions</v-tab>
    </v-tabs>

    <Members :groupId="groupId" />

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
          <template #[`item.can_read`]="{ item }">
            <v-checkbox
              :input-value="item.can_read"
              @change="updateTextToAddRead(item.uuid, $event)"
            />
          </template>
          <template #[`item.can_write`]="{ item }">
            <v-checkbox v-model="item.can_write" :disabled="!item.can_read" />
          </template>
          <template #[`item.name`]="{ item }">
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
      <template #[`item.name`]="{ item }">
        <router-link :to="`/epigraphies/${item.text_uuid}`">{{
          item.name
        }}</router-link>
      </template>
      <template #[`item.can_write`]="{ item }">
        <v-switch
          :input-value="item.can_write"
          @change="updateTextEdit(item.text_uuid, $event)"
          :label="item.can_write ? 'Yes' : 'No'"
          :disabled="!item.can_read"
        />
      </template>
      <template #[`item.can_read`]="{ item }">
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
import { defineComponent } from '@vue/composition-api';
import serverProxy from '@/serverProxy';
import Members from './Members.vue';

export default {
  name: 'GroupView',
  props: {
    groupId: {
      required: true,
    },
  },
  components: {
    Members,
  },
  data() {
    return {
      groupName: '', // Name of the group
      allTexts: [],
      loading: false,
      addUserDialog: false,
      addTextDialog: false,
      addUsersLoading: false,
      deleteUserDialog: false,
      deleteUserLoading: false,

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

  methods: {
    async updateTextEdit(uuid, canWrite) {
      const index = this.viewableTexts
        .map(item => item.text_uuid)
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
        .map(item => item.text_uuid)
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
      this.textsToAdd = this.textsToAdd.filter(text => text.name !== name);
    },

    async addTextGroups() {
      const textGroups = this.textsToAdd.map(item => ({
        can_read: item.can_read,
        can_write: item.can_write,
        uuid: item.uuid,
      }));
      this.addTextGroupsLoading = true;
      await serverProxy.addTextGroups(this.groupId, textGroups);

      this.textsToAdd.forEach(item => {
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
        text => text.text_uuid
      );

      await serverProxy.removeTextsFromGroup(this.groupId, deleteTextUuids);

      this.removeWhitelistLoading = false;
      this.removeWhitelistTextsDialog = false;
      this.selectedDeleteWhitelist = [];
      this.viewableTexts = this.viewableTexts.filter(
        text => !deleteTextUuids.includes(text.text_uuid)
      );
    },

    updateTextToAddRead(uuid, canRead) {
      const index = this.textsToAdd.map(text => text.uuid).indexOf(uuid);
      this.$set(this.textsToAdd[index], 'can_read', canRead);

      if (!canRead) {
        this.$set(this.textsToAdd[index], 'can_write', false);
      }
    },
  },

  async mounted() {
    this.loading = true;
    this.groupName = await serverProxy.getGroupName(this.groupId);
    this.viewableTexts = await serverProxy.getTextGroups(this.groupId);
    this.loading = false;
  },

  watch: {
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
      handler: _.debounce(async function (text) {
        if (!text || text.trim() === '') {
          this.whitelistTextItems = [];
          return;
        }

        this.whitelistSearchLoading = true;
        const items = await serverProxy.searchTextNames(text);
        this.whitelistTextItems = items.map(item => ({
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
