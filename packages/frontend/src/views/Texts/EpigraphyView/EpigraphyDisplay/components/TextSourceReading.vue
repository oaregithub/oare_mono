<template>
  <div v-if="fileText !== ''">
    <br>
    <h2>TEXT SOURCE</h2>
    <br>
    <span style="white-space: pre;">{{fileText}}</span>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, PropType, computed } from '@vue/composition-api';
import sl from '@/serviceLocator';

export default defineComponent({
  props: {
    textUuid: {
      type: String,
      required: true,
    },
  },
  setup({ textUuid }) {
    const server = sl.get('serverProxy');
    const actions = sl.get('globalActions');
    const fileText = ref('');

    onMounted(async () => {
      try {
        fileText.value = await server.getTextByTextUuid(textUuid);
      } catch (err) {
        actions.showErrorSnackbar('Failed to get text file', err as Error);
      }
    });

    return {
        fileText,
    };
  },
});
</script>
