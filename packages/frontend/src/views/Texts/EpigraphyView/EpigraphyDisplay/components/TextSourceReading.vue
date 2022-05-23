<template>
  <div v-if="textSource">
    <br />
    <h2>Text Source <text-source-information-card /></h2>
    <br />
    <span class="text-source-content">{{ textSource }}</span>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from '@vue/composition-api';
import sl from '@/serviceLocator';
import TextSourceInformationCard from './TextSourceInformationCard.vue';

export default defineComponent({
  props: {
    textUuid: {
      type: String,
      required: true,
    },
  },
  components: {
    TextSourceInformationCard,
  },
  setup({ textUuid }) {
    const server = sl.get('serverProxy');
    const actions = sl.get('globalActions');
    const textSource = ref<string | null>(null);

    onMounted(async () => {
      try {
        textSource.value = await server.getTextSourceFile(textUuid);
      } catch (err) {
        actions.showErrorSnackbar(
          'Failed to retrieve text source file. Please try again.',
          err as Error
        );
      }
    });

    return {
      textSource,
    };
  },
});
</script>

<style scoped>
.text-source-content {
  white-space: pre;
}
</style>
