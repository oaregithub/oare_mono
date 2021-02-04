<template>
  <text-collection-list
    :groupId="groupId"
    itemType="Text"
    :getItems="server.getTextGroups"
    :removeItems="server.removeTextsFromGroup"
    :updatePermissions="server.updateText"
  />
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api';
import sl from '@/serviceLocator';
import TextCollectionList from '../AdminView/TextCollectionList.vue';

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
