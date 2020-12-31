<template>
  <add-permissions-items
    itemType="Collection"
    :editPermissions="false"
    :searchItems="server.searchCollectionNames"
    :addItems="server.addTextsToPublicBlacklist"
  />
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api';
import sl from '@/serviceLocator';
import AddPermissionsItems from '../AdminView/AddPermissionsItems.vue';

export default defineComponent({
  components: { AddPermissionsItems },
  setup() {
    const server = sl.get('serverProxy');

    return {
      server,
    };
  },
});
</script>
