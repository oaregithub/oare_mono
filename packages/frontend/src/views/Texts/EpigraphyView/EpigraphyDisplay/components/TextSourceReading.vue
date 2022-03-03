<template>
  <div>
    <h1>TEXT SOURCE</h1>
    <div>{{getTextLinksByTextUuid()}}</div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, PropType, computed } from '@vue/composition-api';
import { DiscourseUnit, EpigraphicUnitSide } from '@oare/types';
import sl from '@/serviceLocator';

export default defineComponent({
  props: {
    textUuid: {
      type: String,
      required: true,
    },
  },
  setup({ discourseUnits, textUuid }) {
    const server = sl.get('serverProxy');
    const actions = sl.get('globalActions');

    const getTextLinksByTextUuid = async () => {
      try {
        const data = await server.getTextLinksByTextUuid(textUuid);
        console.log(data);
      } catch (err) {
        actions.showErrorSnackbar('Failed to get text data', err as Error);
      }
      return data;
    };

    return {
        getTextLinksByTextUuid,
    };
  },
});
</script>
