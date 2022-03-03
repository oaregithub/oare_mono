<template>
  <div>
    <h1>TEXT SOURCE</h1>
     <div v-for="unit in discourseUnits" :key="uuid">
      <div>{{getTextLinksByTextUuid(unit.uuid)}}</div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, PropType, computed } from '@vue/composition-api';
import { DiscourseUnit, EpigraphicUnitSide } from '@oare/types';
import sl from '@/serviceLocator';

export default defineComponent({
  props: {
    discourseUnits: {
      type: Array as PropType<DiscourseUnit[]>,
      required: true,
    },
  },
  setup({ discourseUnits }) {
    const server = sl.get('serverProxy');
    const actions = sl.get('globalActions');

    const getTextLinksByTextUuid = async (uuid: string) => {
      try {
        const data = await server.getTextLinksByTextUuid(uuid);
      } catch (err) {
        actions.showErrorSnackbar('Failed to get text data', err as Error);
      }
      return uuid;
    };

    return {
        getTextLinksByTextUuid,
    };
  },
});
</script>
