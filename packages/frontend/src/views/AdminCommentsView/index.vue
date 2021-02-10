<template>
  <ThreadsDisplay :threads="[]"></ThreadsDisplay>
</template>

<script lang="ts">
  import { defineComponent, ref } from '@vue/composition-api';
import ThreadsDisplay from '@/views/AdminCommentsView/ThreadsDisplay.vue';
  import sl from '@/serviceLocator';

export default defineComponent({
  name: 'AdminCommentsView',
  components: {
    ThreadsDisplay,
  },

  setup(props) {
    const loading = ref(false);
    const server = sl.get('serverProxy');
    const actions = sl.get('globalActions');

    const getThreads = async () => {
      try {
        loading.value = true;
        // names.value = await server.getAll(props.letter);
      } catch {
        actions.showErrorSnackbar('Failed to retrieve name words');
      } finally {
        loading.value = false;
      }
    }




  }
});
</script>
}
