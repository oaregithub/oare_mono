<template>
  <span>
    (<a @click="displayPersonOccurrencesDialog">{{
      totalOccurrencesLoading ? 'Loading...' : totalOccurrences
    }}</a
    >)</span
  >
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
    const totalOccurrences = ref(0);

    onMounted(async () => {
      try {
        totalOccurrencesLoading.value = true;
        totalOccurrences.value = await server.getPeopleTextOccurrenceCount(
          props.personUuid
        );
      } catch {
        actions.showErrorSnackbar(
          'Error loading person text occurrences. Please try again.'
        );
      } finally {
        totalOccurrencesLoading.value = false;
      }
    });

    const displayPersonOccurrencesDialog = () => {
      actions.showSnackbar('This will display occurrences at a later date.');
    };

    return {
      totalOccurrencesLoading,
      totalOccurrences,
      displayPersonOccurrencesDialog,
    };
  },
});
</script>
