<template>
  <div v-if="textContent !== ''">
    <br />
    <h2>TEXT SOURCE</h2>
    <br />
    <span style="white-space: pre">{{ textContent }}</span>
  </div>
</template>

<script lang="ts">
import {
  defineComponent,
  ref,
  onMounted,
  PropType,
  computed,
} from '@vue/composition-api';
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
    const store = sl.get('store');
    const textFile = ref('');
    const textContent = ref('');

    onMounted(async () => {
      if (
        store.getters.permissions
          .map(permission => permission.name)
          .includes('VIEW_TEXT_FILE')
      ) {
        try {
          textFile.value = await server.getTextFileByTextUuid(textUuid);
        } catch (err) {
          actions.showErrorSnackbar('Failed to get text file', err as Error);
        }
        if (textFile.value !== '') {
          try {
            textContent.value = await server.getTextContentByTextFile(
              textFile.value
            );
          } catch (err) {
            actions.showErrorSnackbar(
              'Failed to get text content',
              err as Error
            );
          }
        }
      }
    });

    return {
      textFile,
      textContent,
    };
  },
});
</script>
