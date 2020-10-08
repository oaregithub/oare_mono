<template>
  <v-progress-linear v-if="loading" indeterminate />
  <OareContentView v-else :title="groupName">
    <template v-slot:header>
      <router-link to="/admin">&larr; Back to admin view</router-link>
    </template>

    <v-tabs class="mb-3" v-model="tab">
      <v-tab to="members">Members</v-tab>
      <v-tab to="texts">Texts</v-tab>
    </v-tabs>
    <keep-alive>
      <router-view />
    </keep-alive>
  </OareContentView>
</template>

<script>
import { defineComponent } from '@vue/composition-api';
import serverProxy from '@/serverProxy';

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
