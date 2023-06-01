<template>
  <div>
    <error-log-dialog
      v-if="dialogError"
      :error="dialogError"
      :key="dialogError.uuid"
      v-model="showErrorDetails"
      @update-status="updateStatus"
    />
    <OareContentView :loading="loading" title="Error Log">
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
                v-model="user"
                label="User"
                single-line
                hide-details
                clearable
                class="pt-0 pb-2 test-user-filter"
              />
              <v-text-field
                v-model="description"
                label="Description"
                single-line
                hide-details
                clearable
                class="pt-2 pb-2 test-desc-filter"
              />
              <v-text-field
                v-model="stacktrace"
                label="Stacktrace"
                single-line
                hide-details
                clearable
                class="pb-2 test-stack-filter"
              />
            </div>
          </v-col>
          <v-col cols="10" class="pl-8">
            <v-menu>
              <template v-slot:activator="{ on }">
                <v-btn
                  v-on="on"
                  color="info"
                  class="ml-3 test-mark-as"
                  :disabled="selectedErrors.length < 1"
                  >Mark As</v-btn
                >
              </template>
              <v-list>
                <v-list-item
                  v-for="option in statusOptions"
                  :key="option"
                  @click="updateMultipleStatus(option)"
                  class="test-status-option"
                >
                  <v-list-item-title>{{ option }}</v-list-item-title>
                </v-list-item>
              </v-list>
            </v-menu>
            <v-data-table
              v-model="selectedErrors"
              :loading="searchLoading"
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
              show-select
            >
              <template #[`item.userName`]="{ item }">
                <span>{{ item.userName || 'No User' }}</span>
              </template>
              <template #[`item.timestamp`]="{ item }">
                <span>{{ formatTimestamp(item.timestamp) }}</span>
              </template>
              <template #[`item.description`]="{ item }">
                <span v-if="item.description.length > 80"
                  >{{ item.description.slice(0, 80) }}... <a>See more</a></span
                >
                <span v-else>{{ item.description }}</span>
              </template>
              <template #[`item.stacktrace`]="{ item }">
                <a v-if="item.stacktrace">View stacktrace</a>
                <span v-else>No stacktrace</span>
              </template>
            </v-data-table>
          </v-col>
        </v-row>
      </v-container>
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
import { ErrorsRowWithUser, ErrorStatus, ErrorsSortType } from '@oare/types';
import sl from '@/serviceLocator';
import useQueryParam from '@/hooks/useQueryParam';
import ErrorLogDialog from '@/views/Admin/ErrorLog/components/ErrorLogDialog.vue';
import { DateTime } from 'luxon';
import { resetAdminBadge } from '@/utils';

export default defineComponent({
  components: {
    ErrorLogDialog,
  },
  setup() {
    const server = sl.get('serverProxy');
    const actions = sl.get('globalActions');
    const _ = sl.get('lodash');

    const loading = ref(false);
    const searchLoading = ref(false);
    const showErrorDetails = ref(false);
    const listHeaders: Ref<DataTableHeader[]> = ref([
      { text: 'Status', value: 'status', width: '10%' },
      { text: 'Timestamp', value: 'timestamp', width: '20%' },
      { text: 'User', value: 'userName', width: '15%' },
      { text: 'Description', value: 'description', width: '40%' },
      {
        text: 'Stacktrace',
        value: 'stacktrace',
        width: '15%',
        sortable: false,
      },
    ]);

    const errorList: Ref<ErrorsRowWithUser[]> = ref([]);
    const selectedErrors: Ref<ErrorsRowWithUser[]> = ref([]);
    const dialogError: Ref<ErrorsRowWithUser | undefined> = ref();
    const serverCount = ref(0);

    const page = useQueryParam('page', '1', false);
    const limit = useQueryParam('rows', '25', true);
    const sort = useQueryParam('sort', 'timestamp', true);
    const desc = useQueryParam('desc', 'true', true);
    const status = useQueryParam('status', 'New', true);
    const user = useQueryParam('user', '', true);
    const description = useQueryParam('description', '', true);
    const stacktrace = useQueryParam('stacktrace', '', true);

    const statusOptions: ErrorStatus[] = ['New', 'In Progress', 'Resolved'];

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

    onMounted(async () => {
      try {
        loading.value = true;
        await getErrorLog();
      } finally {
        loading.value = false;
      }
    });

    const getErrorLog = async () => {
      try {
        searchLoading.value = true;

        const response = await server.getErrorLog(
          status.value as ErrorStatus | '',
          user.value,
          description.value,
          stacktrace.value,
          sort.value as ErrorsSortType,
          desc.value === 'true',
          Number(page.value),
          Number(limit.value)
        );
        errorList.value = response.errors;
        serverCount.value = response.count;
      } catch (err) {
        actions.showErrorSnackbar(
          'Error loading error log. Please try again',
          err as Error,
          'server.getErrorLog failed'
        );
      } finally {
        searchLoading.value = false;
      }
    };

    const formatTimestamp = (timestamp: Date) => {
      return DateTime.fromJSDate(new Date(timestamp)).toLocaleString(
        DateTime.DATETIME_MED
      );
    };

    const setupDialog = (error: ErrorsRowWithUser) => {
      dialogError.value = error;
      showErrorDetails.value = true;
    };

    const updateStatus = async (status: ErrorStatus) => {
      if (dialogError.value) {
        dialogError.value.status = status;
      }
      await getErrorLog();
    };

    const updateMultipleStatus = async (status: ErrorStatus) => {
      try {
        const selectedErrorUuids = selectedErrors.value.map(
          error => error.uuid
        );
        await server.updateErrorStatus(selectedErrorUuids, status);
        await getErrorLog();
        selectedErrors.value = [];
        await resetAdminBadge();
      } catch (err) {
        actions.showErrorSnackbar(
          'Error updating error status. Please try again.',
          err as Error
        );
      }
    };

    watch(
      searchOptions,
      async () => {
        try {
          page.value = String(searchOptions.value.page);
          limit.value = String(searchOptions.value.itemsPerPage);
          sort.value = searchOptions.value.sortBy[0];
          desc.value = String(searchOptions.value.sortDesc[0]);
          await getErrorLog();
        } catch (err) {
          actions.showErrorSnackbar(
            `Error updating error log. Please try again.`,
            err as Error
          );
        }
      },
      { deep: true }
    );

    watch([page, limit, sort, desc], () => {
      searchOptions.value.page = Number(page.value);
      searchOptions.value.itemsPerPage = Number(limit.value);
      searchOptions.value.sortBy = [sort.value];
      searchOptions.value.sortDesc = [Boolean(desc.value)];
    });

    watch(
      [status, user, description, stacktrace],
      _.debounce(async () => {
        try {
          searchOptions.value.page = 1;
          await getErrorLog();
        } catch (err) {
          actions.showErrorSnackbar(
            'Error filtering or sorting error log. Please try again.',
            err as Error
          );
        }
      }, 200),
      {
        immediate: false,
      }
    );

    return {
      loading,
      searchLoading,
      listHeaders,
      errorList,
      page,
      limit,
      sort,
      desc,
      status,
      user,
      description,
      stacktrace,
      searchOptions,
      server,
      showErrorDetails,
      getErrorLog,
      serverCount,
      formatTimestamp,
      dialogError,
      setupDialog,
      updateStatus,
      statusOptions,
      selectedErrors,
      updateMultipleStatus,
    };
  },
});
</script>

<style scoped>
.table-cursor >>> tbody tr:hover {
  cursor: pointer;
}
</style>
