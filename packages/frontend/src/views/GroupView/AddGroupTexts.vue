<template>
  <add-permissions-items
    :groupId="groupId"
    itemType="Text"
    :editPermissions="true"
    :searchItems="server.searchTextNames"
    :addItems="server.addTextGroups"
    @router-change-permitted="permitChange"
    ref="childView"
  />
</template>

<script lang="ts">
import { defineComponent, ref } from '@vue/composition-api';
import sl from '@/serviceLocator';
import AddPermissionsItems from '../AdminView/AddPermissionsItems.vue';

export default defineComponent({
  name: 'AddGroupTexts',
  components: { AddPermissionsItems },
  props: {
    groupId: {
      type: String,
      required: true,
    },
  },
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
    const nextObj = ref(() => {});

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
