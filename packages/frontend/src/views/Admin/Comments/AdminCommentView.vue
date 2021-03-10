<template>
  <OareContentView :loading="loading" title="Comments">
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
              multiple
              clearable
              class="pt-2 test-status-filter"
            />
            <v-text-field
              v-model="name"
              label="Thread"
              single-line
              hide-details
              clearable
              class="pt-0 pb-2 test-user-filter"
            />
            <v-text-field
              v-model="item"
              label="Item"
              single-line
              hide-details
              clearable
              class="pt-2 pb-2 test-desc-filter"
            />
            <v-text-field
              v-model="comment"
              label="Comment"
              single-line
              hide-details
              clearable
              class="pb-2 test-stack-filter"
            />
          </div>
        </v-col>
        <v-col cols="10" class="pl-8">
          <v-data-table
            :loading="searchLoading"
            :headers="tableHeaders"
            class="mt-3 table-cursor"
            item-key="uuid"
            :items="threadDisplays"
            :options.sync="searchOptions"
            :server-items-length="serverCount"
            :footer-props="{
              'items-per-page-options': [10, 25, 50, 100],
            }"
          >
            <template #[`item.status`]="{ item }">
              {{ item.thread.status }}
            </template>
            <template #[`item.name`]="{ item }">
              {{ item.thread.name || 'Untitled' }}
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
          </v-data-table>
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
  </OareContentView>
</template>

<script lang="ts">
import {
  defineComponent,
  onMounted,
  Ref,
  ref,
  watch,
} from '@vue/composition-api';
import {
  ThreadDisplay,
  Comment,
  AllCommentsRequest,
  CommentSortType,
  ThreadStatus,
} from '@oare/types';
import sl from '@/serviceLocator';
import { DataOptions, DataTableHeader } from 'vuetify';
import useQueryParam from '@/hooks/useQueryParam';
import { DateTime } from 'luxon';

export default defineComponent({
  name: 'AdminCommentView',

  setup() {
    const loading = ref(false);
    const searchLoading = ref(false);
    const threadDisplays: Ref<ThreadDisplay[]> = ref([]);
    const server = sl.get('serverProxy');
    const actions = sl.get('globalActions');
    const _ = sl.get('lodash');
    const serverCount = ref(0);
    const selectedComments: Ref<Comment[]> = ref([]);
    const [desc, setDesc] = useQueryParam('desc', 'true');
    const [sort, setSort] = useQueryParam('sort', 'timestamp');
    const [page, setPage] = useQueryParam('page', '1');
    const [limit, setRows] = useQueryParam('rows', '10');
    const [status, setStatus] = useQueryParam('status', '');
    const [name, setName] = useQueryParam('name', '');
    const [item, setItem] = useQueryParam('item', '');
    const [comment, setComment] = useQueryParam('comment', '');
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

    const searchOptions: Ref<DataOptions> = ref({
      page: Number(page.value),
      itemsPerPage: Number(limit.value),
      sortBy: [sort.value],
      sortDesc: [Boolean(desc.value)],
      groupBy: [],
      groupDesc: [],
      multiSort: false,
      mustSort: true,
    });

    const getAllThreadsWithComments = async () => {
      try {
        searchLoading.value = true;

        const request: AllCommentsRequest = {
          filters: {
            status: (status.value as unknown) as ThreadStatus[],
            thread: name.value,
            item: item.value,
            comment: comment.value,
          },
          sort: {
            type: sort.value as CommentSortType,
            desc: desc.value === 'true',
          },
          pagination: {
            page: Number(page.value),
            limit: Number(limit.value),
          },
        };

        const response = await server.getAllThreads(request);
        threadDisplays.value = response.threads;
        serverCount.value = response.count;
      } catch (e) {
        actions.showErrorSnackbar('Failed to get threads');
      } finally {
        searchLoading.value = false;
      }
    };

    const formatTimestamp = (timestamp: Date) => {
      return DateTime.fromJSDate(new Date(timestamp)).toLocaleString(
        DateTime.DATETIME_MED
      );
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

    onMounted(async () => {
      try {
        loading.value = true;
        await getAllThreadsWithComments();
      } catch (e) {
        actions.showErrorSnackbar('Failed to get threads');
      } finally {
        loading.value = false;
      }
    });

    watch(searchOptions, async () => {
      try {
        setPage(String(searchOptions.value.page));
        setRows(String(searchOptions.value.itemsPerPage));
        setSort(searchOptions.value.sortBy[0]);
        setDesc(String(searchOptions.value.sortDesc[0]));
        await getAllThreadsWithComments();
      } catch {
        actions.showErrorSnackbar(`Error getting threads. Please try again.`);
      }
    });

    watch(
      [status, name, item, comment],
      _.debounce(async () => {
        try {
          searchOptions.value.page = 1;
          setStatus(status.value || '');
          setName(name.value || '');
          setItem(item.value || '');
          setComment(comment.value || '');
          await getAllThreadsWithComments();
        } catch {
          actions.showErrorSnackbar(
            'Error filtering or sorting comments. Please try again.'
          );
        }
      }, 200),
      {
        immediate: false,
      }
    );

    return {
      desc,
      sort,
      page,
      limit,
      status,
      name,
      item,
      comment,
      statusOptions,
      serverCount,
      loading,
      searchLoading,
      tableHeaders,
      threadDisplays,
      searchOptions,
      formatTimestamp,
      formatCommentText,
      selectedComments,
      setSelectedComments,
    };
  },
});
</script>
