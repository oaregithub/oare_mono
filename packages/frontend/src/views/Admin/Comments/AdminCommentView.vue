<template>
  <CommentView
    @input="getAllThreadsWithComments"
    :search-loading="tableLoading"
    :thread-displays="threadDisplays"
    :server-count="serverCount"
    :initial-loading="initialLoading"
  >
  </CommentView>
</template>

<script lang="ts">
import { defineComponent, onMounted, Ref, ref } from '@vue/composition-api';
import sl from '@/serviceLocator';
import CommentView from './components/CommentView.vue';
import { AllCommentsRequest, ThreadDisplay } from '@oare/types';

export default defineComponent({
  name: 'AdminCommentView',
  components: {
    CommentView,
  },

  setup() {
    const server = sl.get('serverProxy');
    const actions = sl.get('globalActions');
    const tableLoading = ref(false);
    const initialLoading = ref(false);
    const threadDisplays: Ref<ThreadDisplay[]> = ref([]);
    const serverCount = ref(0);

    const getAllThreadsWithComments = async (request: AllCommentsRequest) => {
      try {
        tableLoading.value = true;
        const response = await server.getAllThreads(request);
        threadDisplays.value = response.threads;
        serverCount.value = response.count;
      } catch (e) {
        actions.showErrorSnackbar('Failed to get threads');
      } finally {
        tableLoading.value = false;
      }
    };

    onMounted(async () => {
      try {
        // Default values
        const request: AllCommentsRequest = {
          filters: {
            status: [],
            thread: '',
            item: '',
            comment: '',
          },
          sort: {
            type: 'timestamp',
            desc: true,
          },
          pagination: {
            page: 1,
            limit: 10,
          },
        };

        await getAllThreadsWithComments(request);
      } catch (e) {
        actions.showErrorSnackbar('Failed to get threads');
      }
    });

    return {
      getAllThreadsWithComments,
      tableLoading,
      threadDisplays,
      serverCount,
      initialLoading,
    };
  },
});
</script>
