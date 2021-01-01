<template>
  <add-permissions-items
    :groupId="groupId"
    itemType="Text"
    :editPermissions="true"
    :searchItems="server.searchTextNames"
    :addItems="server.addTextGroups"
  />
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api';
import sl from '@/serviceLocator';
import AddPermissionsItems from '../AdminView/AddPermissionsItems.vue';

export default defineComponent({
  components: { AddPermissionsItems },
  props: {
    groupId: {
      type: String,
      required: true,
    },
  },
  setup() {
    const server = sl.get('serverProxy');

    return {
      server,
    };
  },
});
</script>
