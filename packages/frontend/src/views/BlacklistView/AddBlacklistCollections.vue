<template>
  <add-permissions-items
    itemType="Collection"
    :editPermissions="false"
    :searchItems="server.searchCollectionNames"
    :addItems="server.addTextsToPublicBlacklist"
    @router-change-permitted="permitChange"
    ref="childView"
  />
</template>

<script lang="ts">
import { defineComponent, ref } from '@vue/composition-api';
import sl from '@/serviceLocator';
import AddPermissionsItems from '../AdminView/AddPermissionsItems.vue';

export default defineComponent({
  name: 'AddBlacklistCollections',
  components: { AddPermissionsItems },
  beforeRouteLeave(_to, _from, next) {
    const selectedItems = (this.$refs.childView as any).selectedItems;
    if (selectedItems.length > 0) {
      (this.$refs.childView as any).preventRouterDialog = true;
      this.nextObj = next;
    } else if (selectedItems.length === 0) {
      next();
    } else {
      next(false);
    }
  },
  setup() {
    const server = sl.get('serverProxy');
    let nextObj = ref(() => {});

    const permitChange = () => {
      nextObj.value();
    };

    return {
      server,
      permitChange,
      nextObj,
    };
  },
});
</script>
