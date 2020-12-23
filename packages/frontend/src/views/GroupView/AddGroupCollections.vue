<template>
  <OareContentView
    :title="`Add Collections to ${groupName}`"
    :loading="loading"
  >
    <template #header>
      <router-link :to="`/groups/${groupId}/collections`"
        >&larr; Back to collections view
      </router-link>
    </template>

    <v-container>
      <v-row align="center" justify="center">
        <OareDialog
          v-model="addCollectionsDialog"
          title="Add collections"
          submitText="Yes, add"
          cancelText="No, don't add"
          @submit="addCollections"
          :submitLoading="addCollectionsLoading"
        >
          <template v-slot:activator="{ on }">
            <v-btn
              v-on="on"
              color="info"
              :disabled="selectedCollections.length === 0"
              class="test-add"
              >Add selected collections ({{
                selectedCollections.length
              }})</v-btn
            >
          </template>
          Are you sure you want to add the following collection(s) and
          permissions to the group named
          {{ groupName }}?
          <v-data-table
            :headers="selectedCollectionsHeaders"
            :items="selectedCollections"
          >
            <template #[`item.canRead`]="{ item }">
              <v-checkbox
                :input-value="item.canRead"
                @change="updateCollectionToAddRead(item.uuid, $event)"
              />
            </template>
            <template #[`item.canWrite`]="{ item }">
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
          <h3>Selected Collections</h3>
          <v-data-table
            :headers="selectedCollectionsHeaders"
            :items="selectedCollections"
            item-key="uuid"
            class="mt-3"
            show-select
            v-model="selectedCollections"
          >
            <template #[`item.canRead`]="{ item }">
              <v-checkbox
                :input-value="item.canRead"
                @change="updateCollectionToAddRead(item.uuid, $event)"
              />
            </template>
            <template #[`item.canWrite`]="{ item }">
              <v-checkbox v-model="item.canWrite" :disabled="!item.canRead" />
            </template>
            <template slot="no-data"> No collections selected </template>
          </v-data-table>
        </v-col>
        <v-col cols="8">
          <h3>All Collections</h3>
          <v-data-table
            :loading="getCollectionsLoading"
            :headers="collectionsHeaders"
            :items="unaddedCollections"
            item-key="uuid"
            class="mt-3"
            show-select
            :value="selectedCollections"
            @item-selected="selectItem"
            @toggle-select-all="selectAll"
            :options.sync="searchOptions"
            :server-items-length="serverCount"
            :footer-props="{
              'items-per-page-options': [10, 25, 50, 100],
            }"
          >
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
} from '@vue/composition-api';
import sl from '@/serviceLocator';
import OareContentView from '@/components/base/OareContentView.vue';
import {
  CollectionPermissionsItem,
  SearchCollectionNamesResponse,
} from '@oare/types';
import { DataTableHeader, DataOptions } from 'vuetify';
import useQueryParam from '@/hooks/useQueryParam';

export default defineComponent({
  name: 'AddGroupCollections',
  props: {
    groupId: {
      type: String,
      required: true,
    },
  },
  setup({ groupId }) {
    const server = sl.get('serverProxy');
    const actions = sl.get('globalActions');
    const router = sl.get('router');
    const _ = sl.get('lodash');

    const selectedCollectionsHeaders = ref([
      { text: 'Collection Name', value: 'name' },
      { text: 'Can view?', value: 'canRead', width: '20%' },
      { text: 'Can edit?', value: 'canWrite', width: '20%' },
    ]);
    const collectionsHeaders: Ref<DataTableHeader[]> = ref([
      { text: 'Collection Name', value: 'name' },
    ]);

    const loading = ref(true);
    const addCollectionsDialog = ref(false);
    const addCollectionsLoading = ref(false);
    const getCollectionsLoading = ref(false);

    const [page, setPage] = useQueryParam('page', '1');
    const [rows, setRows] = useQueryParam('rows', '10');
    const [search, setSearch] = useQueryParam('query', '');
    const [collections, setCollections] = useQueryParam('collections', '');

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

    const selectedCollections: Ref<CollectionPermissionsItem[]> = ref([]);
    const unaddedCollections: Ref<CollectionPermissionsItem[]> = ref([]);

    const groupName = ref('');

    const getCollections = async () => {
      try {
        getCollectionsLoading.value = true;
        const response: SearchCollectionNamesResponse = await server.searchCollectionNames(
          {
            page: searchOptions.value.page,
            rows: searchOptions.value.itemsPerPage,
            search: search.value,
            groupId,
          }
        );
        unaddedCollections.value = response.collections.map(
          ({ name, uuid }) => ({
            name,
            uuid,
            canRead: true,
            canWrite: false,
          })
        );
        serverCount.value = response.count;
      } catch {
        actions.showErrorSnackbar(
          'Error updating collection list. Please try again.'
        );
      } finally {
        getCollectionsLoading.value = false;
      }
    };

    const addCollections = async () => {
      const collections = selectedCollections.value.map(
        ({ uuid, canRead, canWrite }) => ({
          canRead,
          canWrite,
          uuid,
        })
      );
      addCollectionsLoading.value = true;
      try {
        await server.addGroupCollections(Number(groupId), {
          collections,
        });
        actions.showSnackbar('Successfully added collection(s).');
        router.push(`/groups/${groupId}/collections`);
      } catch {
        actions.showErrorSnackbar(
          'Error adding collections(s). Please try again.'
        );
      } finally {
        addCollectionsLoading.value = false;
        addCollectionsDialog.value = false;
      }
    };

    const updateCollectionToAddRead = (uuid: string, canRead: boolean) => {
      const index = selectedCollections.value
        .map(collection => collection.uuid)
        .indexOf(uuid);
      selectedCollections.value[index].canRead = canRead;

      if (!canRead) {
        selectedCollections.value[index].canWrite = false;
      }
    };

    onMounted(async () => {
      try {
        await getCollections();
        groupName.value = await server.getGroupName(Number(groupId));
        if (collections.value) {
          const uuids: string[] = JSON.parse(collections.value);
          const collectionNames = await Promise.all(
            uuids.map(uuid => server.getTextName(uuid))
          );
          selectedCollections.value = uuids.map((uuid, index) => ({
            name: collectionNames[index].name,
            uuid,
            canRead: true,
            canWrite: false,
          }));
        }
      } catch {
        actions.showErrorSnackbar(
          'Error loading collection(s). Please try again.'
        );
      } finally {
        loading.value = false;
      }
    });

    function selectItem(event: {
      value: boolean;
      item: CollectionPermissionsItem;
    }) {
      event.value
        ? selectedCollections.value.unshift(event.item)
        : selectedCollections.value.splice(
            selectedCollections.value.indexOf(event.item),
            1
          );
    }

    function selectAll(event: {
      value: boolean;
      item: CollectionPermissionsItem;
    }) {
      event.value
        ? unaddedCollections.value.forEach(collection =>
            selectedCollections.value.push(collection)
          )
        : unaddedCollections.value.forEach(collection =>
            selectedCollections.value.splice(
              selectedCollections.value.indexOf(collection),
              1
            )
          );
    }

    watch(searchOptions, async () => {
      try {
        await getCollections();
        setPage(String(searchOptions.value.page));
        setRows(String(searchOptions.value.itemsPerPage));
      } catch {
        actions.showErrorSnackbar(
          'Error updating collection list. Please try again.'
        );
      }
    });

    watch(
      search,
      _.debounce(async () => {
        if (!search.value) {
          search.value = '';
        }
        searchOptions.value.page = 1;
        await getCollections();
      }, 500),
      {
        immediate: false,
      }
    );

    watch(selectedCollections, async () => {
      setCollections(
        JSON.stringify(
          selectedCollections.value.map(collection => collection.uuid)
        )
      );
    });

    return {
      groupName,
      loading,
      addCollectionsLoading,
      addCollectionsDialog,
      addCollections,
      selectedCollections,
      unaddedCollections,
      collectionsHeaders,
      search,
      setSearch,
      getCollectionsLoading,
      searchOptions,
      serverCount,
      selectedCollectionsHeaders,
      updateCollectionToAddRead,
      selectItem,
      selectAll,
    };
  },
});
</script>
