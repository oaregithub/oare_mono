<template>
  <add-text-collection
    :groupId="groupId"
    itemType="Text"
    :addItems="server.addItemsToGroupEditPermissions"
    :addingEditPermissions="true"
  />
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api';
import sl from '@/serviceLocator';
import AddTextCollection from '../../../components/AddTextCollection.vue';

export default defineComponent({
  name: 'AddEditTexts',
  components: { AddTextCollection },
  props: {
    groupId: {
      type: String,
      required: true,
    },
  },
  beforeRouteLeave(_to, from, next) {
    if (from.query.saved) {
      next();
    } else {
      this.actions.showUnsavedChangesWarning(next);
    }
  },
  setup() {
    const server = sl.get('serverProxy');
    const actions = sl.get('globalActions');

    return {
      server,
      actions,
    };
  },
});
</script>
