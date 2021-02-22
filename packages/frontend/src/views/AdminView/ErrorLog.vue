<template>
  <div>
    <error-log-dialog
      :error="dialogError"
      :key="dialogError.uuid"
      v-model="showErrorDetails"
      @update-status="updateStatus"
    />
    <OareContentView :loading="loading" title="Error Log">
      <v-data-table
        :headers="listHeaders"
        class="mt-3 table-cursor"
        item-key="uuid"
        :items="errorList"
        :options.sync="searchOptions"
        :server-items-length="serverCount"
        :footer-props="{
          'items-per-page-options': [10, 25, 50, 100],
        }"
        @click:row="setupDialog"
      >
        <template #[`item.timestamp`]="{ item }">
          <span>{{ formatTimestamp(item.timestamp) }}</span>
        </template>
      </v-data-table>
    </OareContentView>
  </div>
</template>

<script lang="ts">
import {
  defineComponent,
  ref,
  Ref,
  onMounted,
  watch,
} from '@vue/composition-api';
import { DataTableHeader, DataOptions } from 'vuetify';
import { ErrorsRowWithUser, ErrorStatus } from '@oare/types';
import sl from '@/serviceLocator';
import useQueryParam from '@/hooks/useQueryParam';
import ErrorLogDialog from '@/views/AdminView/ErrorLogDialog.vue';

export default defineComponent({
  components: {
    ErrorLogDialog,
  },
  setup() {
    const server = sl.get('serverProxy');
    const actions = sl.get('globalActions');

    const loading = ref(false);
    const showErrorDetails = ref(false);
    const listHeaders: Ref<DataTableHeader[]> = ref([
      { text: 'Status', value: 'status', width: '10%' },
      { text: 'Timestamp', value: 'timestamp', width: '20%' },
      { text: 'User', value: 'userName', width: '20%' },
      { text: 'Description', value: 'description', width: '50%' },
    ]);

    const errorList: Ref<ErrorsRowWithUser[]> = ref([]);
    const dialogError: Ref<Partial<ErrorsRowWithUser>> = ref({});
    const serverCount = ref(0);

    const [page, setPage] = useQueryParam('page', '1');
    const [limit, setRows] = useQueryParam('rows', '10');
    const searchOptions: Ref<DataOptions> = ref({
      page: Number(page.value),
      itemsPerPage: Number(limit.value),
      sortBy: [],
      sortDesc: [],
      groupBy: [],
      groupDesc: [],
      multiSort: false,
      mustSort: false,
    });

    onMounted(async () => {
      try {
        loading.value = true;
        await getErrorLog();
      } catch {
        actions.showErrorSnackbar(
          'Error retrieving error log. Please try again.',
          'server.getErrorLog failed'
        );
      } finally {
        loading.value = false;
      }
    });

    const getErrorLog = async () => {
      const response = await server.getErrorLog({
        page: Number(page.value),
        limit: Number(limit.value),
      });
      errorList.value = response.errors;
      serverCount.value = response.count;
    };

    const formatTimestamp = (timestamp: Date) => {
      return new Date(timestamp).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
      });
    };

    const setupDialog = (error: ErrorsRowWithUser) => {
      dialogError.value = error;
      showErrorDetails.value = true;
    };

    const updateStatus = (status: ErrorStatus) => {
      dialogError.value.status = status;
    };

    watch(searchOptions, async () => {
      try {
        setPage(String(searchOptions.value.page));
        setRows(String(searchOptions.value.itemsPerPage));
        await getErrorLog();
      } catch {
        actions.showErrorSnackbar(
          `Error updating error log. Please try again.`
        );
      }
    });

    return {
      loading,
      listHeaders,
      errorList,
      page,
      limit,
      searchOptions,
      server,
      showErrorDetails,
      getErrorLog,
      serverCount,
      formatTimestamp,
      dialogError,
      setupDialog,
      updateStatus,
    };
  },
});
</script>

<style scoped>
.table-cursor >>> tbody tr:hover {
  cursor: pointer;
}
</style>
