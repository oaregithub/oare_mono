<template>
  <span>
    <span v-if="retryRetrieval" @click="retry"
      >(<a class="error--text">Retry</a>)</span
    >
    <span v-else>
      (<a @click="displayPersonOccurrencesDialog"
        >{{ totalOccurrencesLoading ? 'Loading...' : totalOccurrences }})</a
      >
    </span>
  </span>
</template>

<script lang="ts">
import { defineComponent, onMounted, ref } from '@vue/composition-api';
import sl from '@/serviceLocator';
export default defineComponent({
  name: 'PersonsTextOccurrences',
  props: {
    personUuid: {
      type: String,
      required: true,
    },
  },

  setup(props) {
    const server = sl.get('serverProxy');
    const actions = sl.get('globalActions');
    const totalOccurrencesLoading = ref(false);
    const retryRetrieval = ref(false);
    const totalOccurrences = ref(0);

    const mount = async () => {
      try {
        totalOccurrencesLoading.value = true;
        totalOccurrences.value = await server.getPeopleTextOccurrenceCount(
          props.personUuid
        );
      } catch {
        retryRetrieval.value = true;
      } finally {
        totalOccurrencesLoading.value = false;
      }
    };

    onMounted(mount);

    const displayPersonOccurrencesDialog = () => {
      actions.showSnackbar('This will display occurrences at a later date.');
    };

    const retry = async () => {
      retryRetrieval.value = false;
      await mount();
    };

    return {
      totalOccurrencesLoading,
      totalOccurrences,
      retryRetrieval,
      displayPersonOccurrencesDialog,
      retry,
    };
  },
});
</script>
