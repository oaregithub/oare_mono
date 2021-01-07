<template>
  <add-permissions-items
    itemType="Collection"
    :editPermissions="false"
    :searchItems="server.searchCollectionNames"
    :addItems="server.addTextsToPublicBlacklist"
  />
</template>

<script lang="ts">
import { defineComponent, ref } from '@vue/composition-api';
import sl from '@/serviceLocator';
import AddPermissionsItems from '../AdminView/AddPermissionsItems.vue';

export default defineComponent({
  name: 'AddBlacklistCollections',
  components: { AddPermissionsItems },
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
