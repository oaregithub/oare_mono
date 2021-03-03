<template>
  <text-collection-list
    :groupId="groupId"
    itemType="Collection"
    :getItems="server.getGroupCollections"
    :removeItems="server.removeGroupCollections"
    :updatePermissions="server.updateCollectionPermissions"
  />
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api';
import sl from '@/serviceLocator';
import TextCollectionList from '../../components/TextCollectionList.vue';

export default defineComponent({
  components: { TextCollectionList },
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
