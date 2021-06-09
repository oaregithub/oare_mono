<template>
  <OareContentView title="Comments">
    <v-container class="pa-0">
      <v-row>
        <v-col cols="2">
          <div class="mt-6">
            <h3>Filter</h3>
            <v-select
              dense
              label="Status"
              :items="statusOptions"
              v-model="status"
              clearable
              class="pt-2 test-status-filter"
            />
            <v-text-field
              v-model="name"
              label="Thread"
              single-line
              hide-details
              clearable
              class="pt-0 pb-2 test-name-filter"
            />
            <v-text-field
              v-model="item"
              label="Item"
              single-line
              hide-details
              clearable
              class="pt-2 pb-2 test-item-filter"
            />
            <v-text-field
              v-model="comment"
              label="Comment"
              single-line
              hide-details
              clearable
              class="pb-2 test-comment-filter"
            />
          </div>
        </v-col>
        <v-col cols="10" class="pl-8">
          <oare-data-table
            :headers="tableHeaders"
            class="mt-3 table-cursor"
            item-key="uuid"
            defaultSort="timestamp"
            :items="threadDisplays"
            :server-items-length="serverCount"
            :fetchItems="getAllThreadsWithComments"
            :watched-params="['name', 'item', 'comment', 'status']"
            debounce
          >
            <template #[`item.status`]="{ item }">
              {{ item.thread.status }}
            </template>
            <template #[`item.name`]="{ item }">
              <v-btn
                @click="setupThreadDialog(item)"
                plain
                small
                elevation="0"
                class="font-weight-bold ml-n3 test-thread-name"
                color="primary"
              >
                {{ item.thread.name || 'Untitled' }}</v-btn
              >
            </template>
            <template #[`item.item`]="{ item }">
              {{ item.word }}
            </template>
            <template #[`item.comment`]="{ item }">
              <div class="pt-2 pb-2">
                <div v-for="(comment, idx) in item.comments" :key="idx">
                  <span v-if="idx <= 2">{{
                    formatCommentText(idx, comment.text)
                  }}</span>
                </div>
                <div
                  v-if="item.comments.length > 3"
                  @click="setSelectedComments(item.comments)"
                  class="test-view-all-comments"
                >
                  <v-btn
                    color="primary"
                    plain
                    small
                    elevation="0"
                    class="font-weight-bold ml-n3"
                    >See more...</v-btn
                  >
                </div>
              </div>
            </template>
            <template #[`item.timestamp`]="{ item }">
              {{ formatTimestamp(item.latestCommentDate) }}
            </template>
          </oare-data-table>
        </v-col>
      </v-row>
    </v-container>

    <oare-dialog
      v-if="selectedComments.length !== 0"
      title="All Comments"
      :value="selectedComments.length !== 0"
      :width="500"
      :closeButton="true"
      :persistent="false"
      :show-cancel="false"
      :show-submit="false"
      @input="setSelectedComments([])"
      class="test-view-all-comments-dialog"
    >
      <div
        v-for="(comment, idx) in selectedComments"
        :key="idx"
        class="test-comment"
      >
        {{ formatCommentText(idx, comment.text, true) }}
      </div>
    </oare-dialog>
    <comment-word-display
      v-if="isViewingThread"
      :route="selectedThreadDisplay.thread.route"
      :uuid="selectedThreadDisplay.thread.referenceUuid"
      :word="selectedThreadDisplay.word"
      :initial-thread-uuid="selectedThreadDisplay.thread.uuid"
      showDictionary
      @submit="isViewingThread = false"
      @input="isViewingThread = false"
      class="test-comment-word-display"
    >
      {{ selectedThreadDisplay.word }}
    </comment-word-display>
  </OareContentView>
</template>

<script lang="ts">
import { defineComponent, Ref, ref, watch } from '@vue/composition-api';
import {
  ThreadDisplay,
  Comment,
  AllCommentsRequest,
  CommentSortType,
  ThreadStatus,
} from '@oare/types';
import sl from '@/serviceLocator';
import { DataTableHeader } from 'vuetify';
import useQueryParam from '@/hooks/useQueryParam';
import CommentWordDisplay from '@/components/CommentWordDisplay/index.vue';
import { formatTimestamp } from '@/utils';
import { OareDataTableOptions } from '@/components/base/OareDataTable.vue';

export default defineComponent({
  name: 'CommentView',
  components: { CommentWordDisplay },
  props: {
    isUserComments: {
      type: Boolean,
      default: true,
    },
  },

  setup({ isUserComments }) {
    const isViewingThread = ref(false);
    const threadDisplays: Ref<ThreadDisplay[]> = ref([]);
    const server = sl.get('serverProxy');
    const actions = sl.get('globalActions');
    const serverCount = ref(0);
    const selectedComments: Ref<Comment[]> = ref([]);
    const selectedThreadDisplay = ref<ThreadDisplay>({
      thread: {
        uuid: '',
        name: null,
        referenceUuid: '',
        status: 'New',
        route: '',
      },
      word: '',
      latestCommentDate: new Date(),
      comments: [],
    });
    const status = useQueryParam('status', '');
    const name = useQueryParam('name', '');
    const item = useQueryParam('item', '');
    const comment = useQueryParam('comment', '');
    const statusOptions: ThreadStatus[] = [
      'New',
      'In Progress',
      'Pending',
      'Completed',
    ];
    const tableHeaders: Ref<DataTableHeader[]> = ref([
      { text: 'Status', value: 'status', width: '10%' },
      { text: 'Thread', value: 'name', width: '20%' },
      { text: 'Item', value: 'item', width: '15%' },
      { text: 'Comments', value: 'comment', width: '40%', sortable: false },
      { text: 'Timestamp', value: 'timestamp', width: '15%' },
    ]);

    const getAllThreadsWithComments = async ({
      page,
      rows,
      sortBy,
      sortDesc,
    }: OareDataTableOptions) => {
      try {
        const request: AllCommentsRequest = {
          filters: {
            status: status.value ? [status.value as ThreadStatus] : [],
            thread: name.value,
            item: item.value,
            comment: comment.value,
          },
          sort: {
            type: sortBy as CommentSortType,
            desc: sortDesc,
          },
          pagination: {
            page,
            limit: rows,
          },
          isUserComments,
        };

        const response = await server.getAllThreads(request);
        threadDisplays.value = response.threads;
        serverCount.value = response.count;
      } catch (e) {
        actions.showErrorSnackbar('Failed to get threads');
      }
    };

    const formatCommentText = (idx: number, text: string, extended = false) => {
      if (extended) {
        return idx + 1 + '. ' + text;
      }

      return (
        idx +
        1 +
        '. ' +
        (text.length > 80 ? text.substr(0, 80) + '. . .' : text)
      );
    };

    const setSelectedComments = (comments: Comment[]) => {
      selectedComments.value = comments;
    };

    const setupThreadDialog = (threadDisplay: ThreadDisplay) => {
      isViewingThread.value = true;
      selectedThreadDisplay.value = threadDisplay;
    };

    return {
      setupThreadDialog,
      selectedThreadDisplay,
      isViewingThread,
      status,
      name,
      item,
      comment,
      statusOptions,
      threadDisplays,
      serverCount,
      tableHeaders,
      formatTimestamp,
      formatCommentText,
      selectedComments,
      setSelectedComments,
      getAllThreadsWithComments,
    };
  },
});
</script>
