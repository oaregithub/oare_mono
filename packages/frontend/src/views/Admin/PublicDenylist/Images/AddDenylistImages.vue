<template>
  <add-text-collection
    itemType="Image"
    :addItems="server.addItemsToPublicDenylist"
  />
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api';
import sl from '@/serviceLocator';
import AddTextCollection from '../../components/AddTextCollection.vue';

export default defineComponent({
  name: 'AddDenylistCollections',
  components: { AddTextCollection },
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
