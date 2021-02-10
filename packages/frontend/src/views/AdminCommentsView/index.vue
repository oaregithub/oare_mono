<template>
  <ThreadsDisplay :threads="threads"></ThreadsDisplay>
</template>

<script lang="ts">
  import { defineComponent, onMounted, Ref, ref } from '@vue/composition-api';
import ThreadsDisplay from '@/views/AdminCommentsView/ThreadsDisplay.vue';
import sl from '@/serviceLocator';
import { ThreadDisplay } from '@oare/types/src/comments';

export default defineComponent({
  name: 'AdminCommentsView',
  components: {
    ThreadsDisplay,
  },

  setup(props) {
    const loading = ref(false);
    const server = sl.get('serverProxy');
    const actions = sl.get('globalActions');
    const threads: Ref<ThreadDisplay[]> = ref([])

    const getThreads = async () => {
      try {
        loading.value = true;
        threads.value = await server.getAllThreads();
      } catch {
        actions.showErrorSnackbar('Failed to retrieve threads');
      } finally {
        loading.value = false;
      }
    }

    onMounted(getThreads);

    return {
      threads,
    }


  }
});
</script>
}
