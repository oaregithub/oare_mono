<template>
  <OareContentView
    title="Add Collections to Public Blacklist"
    :loading="loading"
  >
    <template #header>
      <router-link to="/admin/blacklist/collections"
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
          Are you sure you want to add the following collection(s) to the public
          blacklist? This will prevent all users from viewing and editing these
          collection(s) unless otherwise authorized.
          <v-list>
            <v-list-item
              v-for="(collection, index) in selectedCollections"
              :key="index"
            >
              {{ collection.name }}
            </v-list-item>
          </v-list>
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
            :headers="collectionsHeaders"
            :items="selectedCollections"
            item-key="uuid"
            class="mt-3"
            show-select
            v-model="selectedCollections"
          >
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
import {
  CollectionListItem,
  SearchCollectionNamesResultRow,
  SearchCollectionNamesResponse,
} from '@oare/types';
import sl from '@/serviceLocator';
import OareContentView from '@/components/base/OareContentView.vue';
import useQueryParam from '@/hooks/useQueryParam';
import { DataTableHeader, DataOptions } from 'vuetify';

export default defineComponent({
  components: { OareContentView },
  setup() {
    const server = sl.get('serverProxy');
    const actions = sl.get('globalActions');
    const router = sl.get('router');
    const _ = sl.get('lodash');

    const loading = ref(true);
    const addCollectionsDialog = ref(false);
    const addCollectionsLoading = ref(false);
    const getCollectionsLoading = ref(false);

    const collectionsHeaders: Ref<DataTableHeader[]> = ref([
      { text: 'Collection Name', value: 'name' },
    ]);
    const selectedCollections: Ref<SearchCollectionNamesResultRow[]> = ref([]);
    const unaddedCollections: Ref<SearchCollectionNamesResultRow[]> = ref([]);

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

    onMounted(async () => {
      try {
        await getCollections();
        if (collections.value) {
          const uuids: string[] = JSON.parse(collections.value);
          const collectionNames = await Promise.all(
            uuids.map(uuid => server.getTextName(uuid))
          );
          selectedCollections.value = uuids.map((uuid, index) => ({
            name: collectionNames[index].name,
            uuid,
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

    const addCollections = async () => {
      const addPublicCollections = selectedCollections.value.map(
        collection => ({
          uuid: collection.uuid,
          type: 'collection',
        })
      );
      addCollectionsLoading.value = true;
      try {
        await server.addTextsToPublicBlacklist({ texts: addPublicCollections });
        actions.showSnackbar('Successfully added collection(s).');
        router.push('/admin/blacklist/collections');
      } catch {
        actions.showErrorSnackbar(
          'Error adding collection(s). Please try again.'
        );
      } finally {
        addCollectionsLoading.value = false;
        addCollectionsDialog.value = false;
      }
    };

    const getCollections = async () => {
      try {
        getCollectionsLoading.value = true;
        const response: SearchCollectionNamesResponse = await server.searchCollectionNames(
          {
            page: searchOptions.value.page,
            rows: searchOptions.value.itemsPerPage,
            search: search.value,
          }
        );
        unaddedCollections.value = response.collections;
        serverCount.value = response.count;
      } catch {
        actions.showErrorSnackbar(
          'Error updating collection list. Please try again.'
        );
      } finally {
        getCollectionsLoading.value = false;
      }
    };

    function selectItem(event: {
      value: boolean;
      item: SearchCollectionNamesResultRow;
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
      item: SearchCollectionNamesResultRow;
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
      loading,
      addCollectionsDialog,
      addCollectionsLoading,
      addCollections,
      collectionsHeaders,
      selectedCollections,
      unaddedCollections,
      searchOptions,
      serverCount,
      search,
      getCollections,
      getCollectionsLoading,
      setSearch,
      selectItem,
      selectAll,
    };
  },
});
</script>
