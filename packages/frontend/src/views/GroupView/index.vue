<template>
  <v-progress-linear v-if="loading" indeterminate />
  <OareContentView v-else :title="groupName">
    <template v-slot:header>
      <router-link to="/admin/groups">&larr; Back to admin view</router-link>
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
import { defineComponent, onMounted, ref } from '@vue/composition-api';
import serverProxy from '@/serverProxy';
import sl from '../../serviceLocator';

export default defineComponent({
  name: 'GroupView',
  props: {
    groupId: {
      type: String,
      required: true,
    },
  },
  setup({ groupId }) {
    const server = sl.get('serverProxy');
    const actions = sl.get('globalActions');
    const groupName = ref('');
    const loading = ref(true);
    const tab = ref(null);

    onMounted(async () => {
      loading.value = true;
      try {
        groupName.value = await server.getGroupName(groupId);
      } catch {
        actions.showErrorSnackbar(
          'Error loading group information. Please try again.'
        );
      } finally {
        loading.value = false;
      }
    });

    return {
      loading,
      groupName,
      tab,
    };
  },
});
</script>
