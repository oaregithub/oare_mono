<template>
  <OareContentView :title="title" :loading="loading">
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
          <v-data-table :headers="itemsHeaders" :items="selectedItems">
            <template #[`item.imgUrl`]="{ item }">
              <v-img
                :src="item.imgUrl"
                max-height="150"
                max-width="250"
              ></v-img>
            </template>
          </v-data-table>
        </OareDialog>
        <v-spacer />
        <v-col cols="4">
          <v-text-field
            v-model="search"
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
            :headers="itemsHeaders"
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
            <template #[`item.imgUrl`]="{ item }">
              <v-img
                :src="item.imgUrl"
                max-height="100"
                max-width="150"
              ></v-img>
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
            :rows="rows"
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
              <span v-else>{{ item.name }}</span> </template
            ><template #[`item.imgUrl`]="{ item }">
              <v-img
                :src="item.imgUrl"
                max-height="150"
                max-width="250"
              ></v-img>
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
  PermissionsListType,
  Pagination,
  DenylistAllowlistItem,
  DenylistAllowlistPayload,
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
        (payload: DenylistAllowlistPayload, groupId?: Number) => void
      >,
      required: true,
    },
    addingEditPermissions: {
      type: Boolean,
      default: false,
    },
  },
  setup({ groupId, itemType, addItems, addingEditPermissions }) {
    const server = sl.get('serverProxy');
    const actions = sl.get('globalActions');
    const router = sl.get('router');
    const _ = sl.get('lodash');

    const itemsHeaders: Ref<DataTableHeader[]> = ref(
      itemType === 'Image'
        ? [
            { text: 'Name', value: 'name' },
            { text: 'Image', value: 'imgUrl' },
          ]
        : [{ text: 'Name', value: 'name' }]
    );

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

    const page = useQueryParam('page', '1', false);
    const rows = useQueryParam('rows', '10', true);
    const search = useQueryParam('query', '', true);
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

    const selectedItems: Ref<DenylistAllowlistItem[]> = ref([]);
    const unaddedItems: Ref<DenylistAllowlistItem[]> = ref([]);

    const groupName = ref('');

    const backLink = computed(() => {
      if (groupId) {
        return addingEditPermissions
          ? `/groups/${groupId}/edit?type=${itemType.toLowerCase()}`
          : `/groups/${groupId}/allowlist?type=${itemType.toLowerCase()}`;
      }
      return `/admin/denylist/${itemType.toLowerCase()}s`;
    });

    const title = computed(() => {
      if (groupId) {
        return `Add ${itemType}s to ${groupName.value} ${
          addingEditPermissions ? 'Edit Permissions' : 'Allowlist'
        }`;
      } else {
        return `Add ${itemType}s to ${groupName.value}`;
      }
    });

    const getItems = async () => {
      try {
        getItemsLoading.value = true;
        const response = await server.searchNames({
          page: searchOptions.value.page,
          limit: searchOptions.value.itemsPerPage,
          filter: search.value,
          groupId,
          type: itemType,
          showExcluded: addingEditPermissions,
        });
        unaddedItems.value = response.items;
        serverCount.value = response.count;
      } catch (err) {
        actions.showErrorSnackbar(
          `Error updating ${itemType.toLowerCase()} list. Please try again.`,
          err as Error
        );
      } finally {
        getItemsLoading.value = false;
      }
    };

    const addListItems = async () => {
      const uuids = selectedItems.value.map(item => item.uuid);
      let type: 'img' | 'text' | 'collection';
      switch (itemType) {
        case 'Image':
          type = 'img';
          break;
        case 'Collection':
          type = 'collection';
          break;
        case 'Text':
          type = 'text';
          break;
      }

      const payload: DenylistAllowlistPayload = {
        uuids,
        type: type,
      };
      addItemsLoading.value = true;
      try {
        await addItems(payload, Number(groupId));
        actions.showSnackbar(
          `Successfully added ${itemType.toLowerCase()}(s).`
        );
        router.replace({
          ...router,
          query: { saved: 'true' },
        });
        router.push(backLink.value);
      } catch (err) {
        actions.showErrorSnackbar(
          `Error adding ${itemType.toLowerCase()}(s). Please try again.`,
          err as Error
        );
      } finally {
        addItemsLoading.value = false;
        addItemsDialog.value = false;
      }
    };

    onMounted(async () => {
      try {
        await getItems();
        groupName.value = groupId
          ? (await server.getGroupInfo(Number(groupId))).name
          : 'Public Denylist';
      } catch (err) {
        actions.showErrorSnackbar(
          `Error loading ${itemType.toLowerCase()}s. Please try again.`,
          err as Error
        );
      } finally {
        loading.value = false;
      }
    });

    function selectItem(event: {
      value: boolean;
      item: DenylistAllowlistItem;
    }) {
      if (event.value) {
        selectedItems.value.unshift(event.item);
      } else {
        selectedItems.value.splice(selectedItems.value.indexOf(event.item), 1);
        selectAllMessage.value = false;
      }
    }

    function selectAll(event: { value: boolean; item: DenylistAllowlistItem }) {
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
        showExcluded: addingEditPermissions,
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

    watch(
      searchOptions,
      async () => {
        try {
          await getItems();
          page.value = String(searchOptions.value.page);
          rows.value = String(searchOptions.value.itemsPerPage);
          selectAllMessage.value = false;
        } catch (err) {
          actions.showErrorSnackbar(
            `Error updating ${itemType.toLowerCase()}s list. Please try again.`,
            err as Error
          );
        }
      },
      { deep: true }
    );

    watch([page, rows], () => {
      searchOptions.value.page = Number(page.value);
      searchOptions.value.itemsPerPage = Number(rows.value);
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
        page.value = '1';
        rows.value = '10';
        search.value = '';
      } else {
        page.value = String(savedQueries.value.page);
        rows.value = String(savedQueries.value.limit);
        search.value = savedQueries.value.filter;
      }
    });

    const beforeUnloadHandler = (event: BeforeUnloadEvent) => {
      if (selectedItems.value.length > 0) {
        event.preventDefault();
        event.returnValue = '';
      }
    };

    onBeforeMount(() => {
      window.addEventListener('beforeunload', beforeUnloadHandler);
    });

    onBeforeUnmount(() => {
      window.removeEventListener('beforeunload', beforeUnloadHandler);
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
      getItemsLoading,
      searchOptions,
      serverCount,
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
      title,
    };
  },
});
</script>
