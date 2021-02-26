<template>
  <div>
    <error-log-dialog
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
            <div class="my-8">
              <h3>Sort</h3>
              <v-radio-group
                v-model="sort"
                label="Sort By"
                class="ma-0 test-sort"
              >
                <v-radio
                  v-for="option in sortOptions"
                  :key="option"
                  :label="formatName(option)"
                  :value="option"
                />
              </v-radio-group>
              <v-radio-group
                v-model="direction"
                label="Direction"
                class="ma-0 test-sort-direction"
              >
                <v-radio label="Ascending" value="asc" />
                <v-radio label="Descending" value="desc" />
              </v-radio-group>
            </div>
          </v-col>
          <v-col cols="10" class="pl-8">
            <v-data-table
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
            >
              <template #[`item.userName`]="{ item }">
                <span>{{ item.userName || 'No User' }}</span>
              </template>
              <template #[`item.timestamp`]="{ item }">
                <span>{{ formatTimestamp(item.timestamp) }}</span>
              </template>
              <template #[`item.stacktrace`]>
                <a>View stacktrace</a>
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
import { ErrorsRowWithUser, ErrorStatus, SortType } from '@oare/types';
import sl from '@/serviceLocator';
import useQueryParam from '@/hooks/useQueryParam';
import ErrorLogDialog from '@/views/AdminView/ErrorLogDialog.vue';
import { DateTime } from 'luxon';

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
      { text: 'Stacktrace', value: 'stacktrace', width: '15%' },
    ]);

    const errorList: Ref<ErrorsRowWithUser[]> = ref([]);
    const dialogError: Ref<Partial<ErrorsRowWithUser>> = ref({});
    const serverCount = ref(0);

    const [page, setPage] = useQueryParam('page', '1');
    const [limit, setRows] = useQueryParam('rows', '10');
    const [sort, setSort] = useQueryParam('sort', 'timestamp');
    const [direction, setDirection] = useQueryParam('direction', 'desc');
    const [status, setStatus] = useQueryParam('status', '');
    const [user, setUser] = useQueryParam('user', '');
    const [description, setDescription] = useQueryParam('description', '');
    const [stacktrace, setStacktrace] = useQueryParam('stacktrace', '');

    const sortOptions: SortType[] = [
      'status',
      'timestamp',
      'userName',
      'description',
    ];

    const statusOptions: ErrorStatus[] = ['New', 'In Progress', 'Resolved'];

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
      } finally {
        loading.value = false;
      }
    });

    const getErrorLog = async () => {
      try {
        searchLoading.value = true;
        const response = await server.getErrorLog({
          filters: {
            status: status.value as ErrorStatus | '',
            user: user.value,
            description: description.value,
            stacktrace: stacktrace.value,
          },
          sort: {
            type: sort.value as SortType,
            direction: direction.value as 'asc' | 'desc',
          },
          pagination: {
            page: Number(page.value),
            limit: Number(limit.value),
          },
        });
        errorList.value = response.errors;
        serverCount.value = response.count;
      } catch {
        actions.showErrorSnackbar(
          'Error loading error log. Please try again',
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

    // Formats sorting option names from camelCase to capitalized, readable English. Ex: 'userName' to 'User Name'
    const formatName = (name: string) => {
      const noCamelCase = name.replace(/([A-Z])/g, ' $1');
      return `${noCamelCase.charAt(0).toUpperCase()}${noCamelCase.slice(1)}`;
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

    watch(
      [sort, direction, status, user, description, stacktrace],
      _.debounce(async () => {
        try {
          searchOptions.value.page = 1;
          setSort(sort.value);
          setDirection(direction.value);
          setStatus(status.value || '');
          setUser(user.value || '');
          setDescription(description.value || '');
          setStacktrace(stacktrace.value || '');
          await getErrorLog();
        } catch {
          actions.showErrorSnackbar(
            'Error filtering or sorting error log. Please try again.'
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
      direction,
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
      sortOptions,
      formatName,
      statusOptions,
    };
  },
});
</script>

<style scoped>
.table-cursor >>> tbody tr:hover {
  cursor: pointer;
}
</style>
