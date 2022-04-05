<template>
  <div v-if="textContent !== ''">
    <br />
    <h2>Text Source <text-source-information-card /></h2>
    <br />
    <span class="text-source-content">{{ textContent }}</span>
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
    const textContent = ref('');

    onMounted(async () => {
      try {
        textContent.value = await server.getTextFileByTextUuid(textUuid);
      } catch (err) {
        actions.showErrorSnackbar('Failed to get text file', err as Error);
      }
    });

    return {
      textContent,
    };
  },
});
</script>

<style scoped>
.text-source-content {
  white-space: pre;
}
</style>
