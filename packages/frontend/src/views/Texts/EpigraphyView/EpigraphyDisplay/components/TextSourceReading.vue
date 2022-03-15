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
    const textContent = ref('');

    onMounted(async () => {
      if (
        store.getters.permissions
          .map(permission => permission.name)
          .includes('VIEW_TEXT_FILE')
      ) {
        try {
          textContent.value = await server.getTextFileByTextUuid(textUuid);
        } catch (err) {
          actions.showErrorSnackbar('Failed to get text file', err as Error);
        }
      }
    });

    return {
      textContent,
    };
  },
});
</script>
