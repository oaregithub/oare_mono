<template>
  <add-permissions-items
    itemType="Text"
    :editPermissions="false"
    :searchItems="server.searchTextNames"
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
