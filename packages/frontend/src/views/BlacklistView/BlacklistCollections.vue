<template>
  <text-collection-list
    itemType="Collection"
    :getItems="server.getBlacklistCollections"
    :removeItems="server.removeTextsFromPublicBlacklist"
  />
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api';
import sl from '@/serviceLocator';
import TextCollectionList from '../AdminView/TextCollectionList.vue';

export default defineComponent({
  components: { TextCollectionList },
  setup() {
    const server = sl.get('serverProxy');

    return {
      server,
    };
  },
});
</script>
