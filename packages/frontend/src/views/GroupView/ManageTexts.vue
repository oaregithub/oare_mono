<template>
  <permissions-item-list
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
import PermissionsItemList from '../AdminView/PermissionsItemList.vue';

export default defineComponent({
  components: { PermissionsItemList },
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
