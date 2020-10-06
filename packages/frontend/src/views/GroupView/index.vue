<template>
  <v-progress-linear v-if="loading" indeterminate />
  <OareContentView v-else :title="groupName">
    <template v-slot:header>
      <router-link to="/admin">&larr; Back to admin view</router-link>
    </template>

    <v-tabs class="mb-3" v-model="tab">
      <v-tab>Members</v-tab>
      <v-tab>Texts</v-tab>
      <v-tab>Permissions</v-tab>
    </v-tabs>
    <keep-alive>
      <ManageMembers v-if="tab === 0" :groupId="groupId" />
      <ManageTexts v-else-if="tab === 1" :groupId="groupId" />
    </keep-alive>
  </OareContentView>
</template>

<script>
import _ from 'lodash';
import { defineComponent } from '@vue/composition-api';
import serverProxy from '@/serverProxy';
import ManageMembers from './ManageMembers.vue';
import ManageTexts from './ManageTexts.vue';

export default {
  name: 'GroupView',
  props: {
    groupId: {
      required: true,
    },
  },
  components: {
    ManageMembers,
    ManageTexts,
  },
  data() {
    return {
      groupName: '', // Name of the group
      loading: true,
      tab: null,
    };
  },

  async mounted() {
    this.loading = true;
    this.groupName = await serverProxy.getGroupName(this.groupId);
    this.loading = false;
  },
};
</script>
