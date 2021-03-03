<template>
  <OareContentView :loading="loading" title="Comments">
    <v-data-table
      :loading="searchLoading"
      :headers="tableHeaders"
      class="mt-3 table-cursor"
      align-v="start"
      item-key="uuid"
      :items="threadDisplays"
      :options.sync="searchOptions"
      :server-items-length="threadDisplays.length"
      :footer-props="{
        'items-per-page-options': [10, 25, 50, 100],
      }"
    >
      <template #[`item.status`]="{ item }">
        <div class="d-flex align-start flex-column fill-height pt-2 pb-2">
          <span class="text--primary">{{ item.thread.status }}</span>
        </div>
      </template>
      <template #[`item.thread`]="{ item }">
        <div class="d-flex align-start flex-column fill-height pt-2 pb-2">
          <span class="text--primary">{{
            item.thread.name || 'Untitled'
          }}</span>
        </div>
      </template>
      <template #[`item.item`]="{ item }">
        <div class="d-flex align-start flex-column fill-height pt-2 pb-2">
          <span class="text--primary">{{ item.word }}</span>
        </div>
      </template>
      <template #[`item.comments`]="{ item }">
        <div class="pt-2 pb-2">
          <div v-for="(comment, idx) in item.comments">
            <span v-if="idx <= 2">{{
              formatCommentText(idx, comment.text)
            }}</span>
          </div>
          <div
            v-if="item.comments.length > 3"
            @click="setSelectedThreadUuid(item.thread.uuid)"
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
        <div class="d-flex align-start flex-column fill-height pt-2 pb-2">
          <span>{{ formatTimestamp(item.latestCommentDate) }}</span>
        </div>
      </template>
    </v-data-table>
    <oare-dialog
      v-if="selectedThreadUuid !== ''"
      :title="'Extended Comments'"
      :value="selectedThreadUuid !== ''"
      :width="500"
      :closeButton="true"
      :persistent="false"
      :show-cancel="false"
      :show-submit="false"
      @input="setSelectedThreadUuid('')"
    >
      <div v-for="(comment, idx) in getCommentsByTheadUuid(selectedThreadUuid)">
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
import { ThreadDisplay, Comment } from '@oare/types';
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
    const selectedThreadUuid = ref('');
    const [desc, setDesc] = useQueryParam('desc', 'true');
    const [sort, setSort] = useQueryParam('sort', 'timestamp');
    const [page, setPage] = useQueryParam('page', '1');
    const [limit, setRows] = useQueryParam('rows', '10');
    const tableHeaders: Ref<DataTableHeader[]> = ref([
      { text: 'Status', value: 'status', width: '10%' },
      { text: 'Thread', value: 'thread', width: '20%' },
      { text: 'Item', value: 'item', width: '15%' },
      { text: 'Comments', value: 'comments', width: '40%' },
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
        threadDisplays.value = await server.getAllThreads();
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

    const getCommentsByTheadUuid = (threadUuid: string): Comment[] => {
      const threadDisp = threadDisplays.value.find(threadDis => {
        return threadDis.thread.uuid === threadUuid;
      });

      return threadDisp ? threadDisp.comments : [];
    };

    const setSelectedThreadUuid = (uuid: string) => {
      selectedThreadUuid.value = uuid;
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

    return {
      loading,
      searchLoading,
      tableHeaders,
      threadDisplays,
      searchOptions,
      formatTimestamp,
      formatCommentText,
      selectedThreadUuid,
      setSelectedThreadUuid,
      getCommentsByTheadUuid,
    };
  },
});
</script>
