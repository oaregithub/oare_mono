<template>
  <permissions-item-list
    itemType="Text"
    :getItems="server.getPublicBlacklist"
    :removeItems="server.removeTextsFromPublicBlacklist"
  />
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api';
import sl from '@/serviceLocator';
import PermissionsItemList from '../AdminView/PermissionsItemList.vue';

export default defineComponent({
  components: { PermissionsItemList },
  setup() {
    const server = sl.get('serverProxy');

    return {
      server,
    };
  },
});
</script>
