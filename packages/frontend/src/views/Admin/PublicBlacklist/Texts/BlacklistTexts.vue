<template>
  <text-collection-list
    itemType="Text"
    :getItems="server.getPublicBlacklist"
    :removeItems="server.removeTextsFromPublicBlacklist"
  />
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api';
import sl from '@/serviceLocator';
import TextCollectionList from '../../components/TextCollectionList.vue';

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
