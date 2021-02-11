<template>
  <OareContentView
    :title="`Add ${itemType}s to ${groupName}`"
    :loading="loading"
  >
    <template #header>
      <router-link :to="backLink"
        >&larr; Back to {{ itemType.toLowerCase() }} view
      </router-link>
    </template>
    <text-and-collections-dialog
      :key="dialogUuid"
      :uuid="dialogUuid"
      :name="dialogName"
      :itemType="itemType"
      v-model="textsAndCollectionsDialog"
    />
    <v-container>
      <v-row align="center" justify="center">
        <OareDialog
          v-model="addItemsDialog"
          :title="`Add ${itemType}s`"
          submitText="Yes, add"
          cancelText="No, don't add"
          @submit="addListItems"
          :submitLoading="addItemsLoading"
        >
          <template v-slot:activator="{ on }">
            <v-btn
              v-on="on"
              color="info"
              :disabled="selectedItems.length === 0"
              class="test-add"
              >Add selected {{ itemType }}s ({{ selectedItems.length }})</v-btn
            >
          </template>
          Are you sure you want to add the following
          {{ itemType.toLowerCase() }}(s) to {{ groupName }}?
          <v-data-table :headers="selectedItemsHeaders" :items="selectedItems">
            <template v-if="groupId" #[`item.canRead`]="{ item }">
              <v-checkbox
                :input-value="item.canRead"
                @change="updateItemToAddRead(item.uuid, $event)"
              />
            </template>
            <template v-if="groupId" #[`item.canWrite`]="{ item }">
              <v-checkbox v-model="item.canWrite" :disabled="!item.canRead" />
            </template>
          </v-data-table>
        </OareDialog>
        <v-spacer />
        <v-col cols="4">
          <v-text-field
            :value="search"
            @input="setSearch"
            label="Search"
            single-line
            hide-details
            clearable
            class="test-search"
          />
        </v-col>
      </v-row>
    </v-container>
    <v-container>
      <v-row>
        <v-col cols="4">
          <h3>Selected {{ itemType }}s</h3>
          <v-data-table
            :headers="selectedItemsHeaders"
            :items="selectedItems"
            item-key="uuid"
            class="mt-3"
            show-select
            v-model="selectedItems"
            @toggle-select-all="unselectAll"
            :loading="selectedListLoading"
            :page.sync="selectedListPage"
          >
            <template #[`item.name`]="{ item }">
              <a
                v-if="item.hasEpigraphy || itemType === 'Collection'"
                @click="setupDialog(item.uuid, item.name)"
                class="text-decoration-underline"
                >{{ item.name }}</a
              >
              <span v-else>{{ item.name }}</span>
            </template>
            <template v-if="groupId" #[`item.canRead`]="{ item }">
              <v-checkbox
                :input-value="item.canRead"
                @change="updateItemToAddRead(item.uuid, $event)"
              />
            </template>
            <template v-if="groupId" #[`item.canWrite`]="{ item }">
              <v-checkbox v-model="item.canWrite" :disabled="!item.canRead" />
            </template>
            <template slot="no-data">
              No {{ itemType.toLowerCase() }}s selected
            </template>
          </v-data-table>
        </v-col>
        <v-col cols="8">
          <h3>All {{ itemType }}s</h3>
          <select-all-message
            v-if="selectAllMessage"
            :itemType="itemType"
            :serverCount="serverCount"
            @select-full-list="selectFullList"
          />
          <v-data-table
            :loading="getItemsLoading"
            :headers="itemsHeaders"
            :items="unaddedItems"
            item-key="uuid"
            class="mt-3"
            show-select
            :value="selectedItems"
            @item-selected="selectItem"
            @toggle-select-all="selectAll"
            :options.sync="searchOptions"
            :server-items-length="serverCount"
            :footer-props="{
              'items-per-page-options': [10, 25, 50, 100],
            }"
          >
            <template #[`item.name`]="{ item }">
              <a
                v-if="item.hasEpigraphy || itemType === 'Collection'"
                @click="setupDialog(item.uuid, item.name)"
                class="text-decoration-underline"
                >{{ item.name }}</a
              >
              <span v-else>{{ item.name }}</span>
            </template>
          </v-data-table>
        </v-col>
      </v-row>
    </v-container>
  </OareContentView>
</template>

<script lang="ts">
import {
  defineComponent,
  PropType,
  ref,
  Ref,
  onMounted,
  watch,
  computed,
  onBeforeMount,
  onBeforeUnmount,
} from '@vue/composition-api';
import sl from '@/serviceLocator';
import TextAndCollectionsDialog from './TextAndCollectionsDialog.vue';
import {
  Text,
  PermissionsListType,
  CollectionPermissionsItem,
  AddTextCollectionPayload,
  AddPublicBlacklistPayload,
  Pagination,
} from '@oare/types';
import { DataTableHeader, DataOptions } from 'vuetify';
import useQueryParam from '@/hooks/useQueryParam';
import SelectAllMessage from './SelectAllMessage.vue';

export default defineComponent({
  name: 'AddPermissionsItems',
  components: {
    TextAndCollectionsDialog,
    SelectAllMessage,
  },
  props: {
    groupId: {
      type: String,
      required: false,
    },
    itemType: {
      type: String as PropType<PermissionsListType>,
      required: true,
    },
    addItems: {
      type: Function as PropType<
        (
          payload: AddTextCollectionPayload | AddPublicBlacklistPayload,
          groupId?: Number
        ) => void
      >,
      required: true,
    },
  },
  setup({ groupId, itemType, addItems }) {
    const server = sl.get('serverProxy');
    const actions = sl.get('globalActions');
    const router = sl.get('router');
    const _ = sl.get('lodash');

    const selectedItemsHeaders: Ref<DataTableHeader[]> = groupId
      ? ref([
          { text: 'Name', value: 'name' },
          { text: 'Can view?', value: 'canRead' },
          { text: 'Can edit?', value: 'canWrite' },
        ])
      : ref([{ text: 'Name', value: 'name' }]);
    const itemsHeaders: Ref<DataTableHeader[]> = ref([
      { text: 'Name', value: 'name' },
    ]);

    const loading = ref(true);
    const addItemsDialog = ref(false);
    const addItemsLoading = ref(false);
    const getItemsLoading = ref(false);
    const selectedListLoading = ref(false);
    const selectAllMessage = ref(false);
    const textsAndCollectionsDialog = ref(false);
    const dialogUuid = ref('');
    const dialogName = ref('');
    const selectedListPage = ref(1);

    const [page, setPage] = useQueryParam('page', '1');
    const [rows, setRows] = useQueryParam('rows', '10');
    const [search, setSearch] = useQueryParam('query', '');
    const savedQueries: Ref<Required<Pagination>> = ref({
      page: 1,
      limit: 10,
      filter: '',
    });

    const searchOptions: Ref<DataOptions> = ref({
      page: Number(page.value),
      itemsPerPage: Number(rows.value),
      sortBy: [],
      sortDesc: [],
      groupBy: [],
      groupDesc: [],
      multiSort: false,
      mustSort: false,
    });
    const serverCount: Ref<number> = ref(0);

    const selectedItems: Ref<Text[] | CollectionPermissionsItem[]> = ref([]);
    const unaddedItems: Ref<Text[] | CollectionPermissionsItem[]> = ref([]);

    const groupName = ref('');
    const backLink = computed(() =>
      groupId
        ? `/groups/${groupId}/${itemType.toLowerCase()}s`
        : `/admin/blacklist/${itemType.toLowerCase()}s`
    );

    const getItems = async () => {
      try {
        getItemsLoading.value = true;
        const response = await server.searchNames({
          page: searchOptions.value.page,
          limit: searchOptions.value.itemsPerPage,
          filter: search.value,
          groupId,
          type: itemType,
        });
        unaddedItems.value = response.items.map(item => ({
          name: item.name,
          uuid: item.uuid,
          canRead: true,
          canWrite: false,
          hasEpigraphy: item.hasEpigraphy,
        }));
        serverCount.value = response.count;
      } catch {
        actions.showErrorSnackbar(
          `Error updating ${itemType.toLowerCase()} list. Please try again.`
        );
      } finally {
        getItemsLoading.value = false;
      }
    };

    const addListItems = async () => {
      const items = selectedItems.value.map(item => ({
        canRead: item.canRead,
        canWrite: item.canWrite,
        uuid: item.uuid,
        type: itemType.toLowerCase(),
      }));
      addItemsLoading.value = true;
      try {
        await addItems({ items }, Number(groupId));
        actions.showSnackbar(
          `Successfully added ${itemType.toLowerCase()}(s).`
        );
        router.replace({
          ...router,
          query: { saved: 'true' },
        });
        router.push(backLink.value);
      } catch {
        actions.showErrorSnackbar(
          `Error adding ${itemType.toLowerCase()}(s). Please try again.`
        );
      } finally {
        addItemsLoading.value = false;
        addItemsDialog.value = false;
      }
    };

    const updateItemToAddRead = (uuid: string, canRead: boolean) => {
      const index = selectedItems.value.map(item => item.uuid).indexOf(uuid);
      selectedItems.value[index].canRead = canRead;

      if (!canRead) {
        selectedItems.value[index].canWrite = false;
      }
    };

    onMounted(async () => {
      try {
        await getItems();
        groupName.value = groupId
          ? await server.getGroupName(Number(groupId))
          : 'Public Blacklist';
      } catch {
        actions.showErrorSnackbar(
          `Error loading ${itemType.toLowerCase()}s. Please try again.`
        );
      } finally {
        loading.value = false;
      }
    });

    function selectItem(event: {
      value: boolean;
      item: Text | CollectionPermissionsItem;
    }) {
      if (event.value) {
        selectedItems.value.unshift(event.item);
      } else {
        selectedItems.value.splice(selectedItems.value.indexOf(event.item), 1);
        selectAllMessage.value = false;
      }
    }

    function selectAll(event: {
      value: boolean;
      item: Text | CollectionPermissionsItem;
    }) {
      if (event.value) {
        if (Number(serverCount.value) > Number(rows.value)) {
          selectAllMessage.value = true;
        }
        unaddedItems.value.forEach(item => selectedItems.value.push(item));
      } else {
        selectAllMessage.value = false;
        unaddedItems.value.forEach(item =>
          selectedItems.value.splice(
            selectedItems.value.map(item => item.uuid).indexOf(item.uuid),
            1
          )
        );
      }
    }

    function unselectAll(event: { value: boolean }) {
      if (!event.value) {
        selectedItems.value = [];
        selectAllMessage.value = false;
        selectedListPage.value = 1;
      }
    }

    async function selectFullList() {
      selectedListLoading.value = true;
      const response = await server.searchNames({
        page: searchOptions.value.page,
        limit: serverCount.value,
        filter: search.value,
        groupId,
        type: itemType,
      });
      const selectedItemsUuids = selectedItems.value.map(item => item.uuid);
      const itemsToAdd = response.items
        .map(item => ({
          name: item.name,
          uuid: item.uuid,
          canRead: true,
          canWrite: false,
          hasEpigraphy: item.hasEpigraphy,
        }))
        .filter(item => !selectedItemsUuids.includes(item.uuid));
      itemsToAdd.forEach(item => selectedItems.value.push(item));
      selectedListLoading.value = false;
      selectAllMessage.value = false;
      actions.showSnackbar(
        `Successfully selected all specified ${itemType.toLowerCase()}s`
      );
    }

    const setupDialog = (uuid: string, name: string) => {
      dialogUuid.value = uuid;
      dialogName.value = name;
      textsAndCollectionsDialog.value = true;
    };

    watch(searchOptions, async () => {
      try {
        await getItems();
        setPage(String(searchOptions.value.page));
        setRows(String(searchOptions.value.itemsPerPage));
        selectAllMessage.value = false;
      } catch {
        actions.showErrorSnackbar(
          `Error updating ${itemType.toLowerCase()}s list. Please try again.`
        );
      }
    });

    watch(
      search,
      _.debounce(async () => {
        selectAllMessage.value = false;
        if (!search.value) {
          search.value = '';
        }
        searchOptions.value.page = 1;
        await getItems();
      }, 500),
      {
        immediate: false,
      }
    );

    watch(textsAndCollectionsDialog, () => {
      if (textsAndCollectionsDialog.value) {
        savedQueries.value = {
          page: Number(page.value),
          limit: Number(rows.value),
          filter: search.value,
        };
        setPage('1');
        setRows('10');
        setSearch('');
      } else {
        setPage(String(savedQueries.value.page));
        setRows(String(savedQueries.value.limit));
        setSearch(savedQueries.value.filter);
      }
    });

    onBeforeMount(() => {
      window.addEventListener('beforeunload', event => {
        if (selectedItems.value.length > 0) {
          event.preventDefault();
          event.returnValue = '';
        }
      });
    });

    onBeforeUnmount(() => {
      window.removeEventListener('beforeunload', event => {
        if (selectedItems.value.length > 0) {
          event.preventDefault();
          event.returnValue = '';
        }
      });
      selectedItems.value = [];
    });

    return {
      groupName,
      loading,
      addItemsLoading,
      addItemsDialog,
      addListItems,
      selectedItems,
      unaddedItems,
      itemsHeaders,
      search,
      setSearch,
      getItemsLoading,
      searchOptions,
      serverCount,
      selectedItemsHeaders,
      updateItemToAddRead,
      selectItem,
      selectAll,
      unselectAll,
      selectAllMessage,
      rows,
      selectFullList,
      selectedListLoading,
      textsAndCollectionsDialog,
      dialogUuid,
      dialogName,
      setupDialog,
      selectedListPage,
      backLink,
    };
  },
});
</script>
