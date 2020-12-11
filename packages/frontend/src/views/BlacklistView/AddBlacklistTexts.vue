<template>
  <OareContentView title="Add Texts to Public Blacklist" :loading="loading">
    <template #header>
      <router-link to="/admin/blacklist/texts"
        >&larr; Back to texts view
      </router-link>
    </template>

    <v-container>
      <v-row align="center" justify="center">
        <OareDialog
          v-model="addTextsDialog"
          title="Add texts"
          submitText="Yes, add"
          cancelText="No, don't add"
          @submit="addTexts"
          :submitLoading="addTextsLoading"
        >
          <template v-slot:activator="{ on }">
            <v-btn
              v-on="on"
              color="info"
              :disabled="selectedTexts.length === 0"
              class="test-add"
              >Add selected texts ({{ selectedTexts.length }})</v-btn
            >
          </template>
          Are you sure you want to add the following text(s) to the public
          blacklist? This will prevent all users from viewing and editing these
          text(s) unless otherwise authorized.
          <v-list>
            <v-list-item v-for="(text, index) in selectedTexts" :key="index">
              {{ text.name }}
            </v-list-item>
          </v-list>
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
          <h3>Selected Texts</h3>
          <v-data-table
            :headers="textsHeaders"
            :items="selectedTexts"
            item-key="uuid"
            class="mt-3"
            show-select
            v-model="selectedTexts"
            :server-items-length="selectedTexts.length"
            :hide-default-footer="true"
          >
            <template slot="no-data"> No texts selected </template>
          </v-data-table>
        </v-col>
        <v-col cols="8">
          <h3>All Texts</h3>
          <v-data-table
            :loading="getTextsLoading"
            :headers="textsHeaders"
            :items="unaddedTexts"
            item-key="uuid"
            class="mt-3"
            show-select
            v-model="selectedTexts"
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
  Text,
  SearchTextNamesResultRow,
  SearchTextNamesResponse,
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
    const addTextsDialog = ref(false);
    const addTextsLoading = ref(false);
    const getTextsLoading = ref(false);

    const textsHeaders: Ref<DataTableHeader[]> = ref([
      { text: 'Text Name', value: 'name' },
    ]);
    const selectedTexts: Ref<SearchTextNamesResultRow[]> = ref([]);
    const unaddedTexts: Ref<SearchTextNamesResultRow[]> = ref([]);

    const [page, setPage] = useQueryParam('page', '1');
    const [rows, setRows] = useQueryParam('rows', '10');
    const [search, setSearch] = useQueryParam('query', '');

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
        await getTexts();
      } catch {
        actions.showErrorSnackbar('Error loading texts. Please try again.');
      } finally {
        loading.value = false;
      }
    });

    const addTexts = async () => {
      const addPublicTexts = selectedTexts.value.map(text => ({
        uuid: text.uuid,
        type: 'text',
      }));
      addTextsLoading.value = true;
      try {
        await server.addTextsToPublicBlacklist({ texts: addPublicTexts });
        actions.showSnackbar('Successfully added text(s).');
        router.push('/admin/blacklist/texts');
      } catch {
        actions.showErrorSnackbar('Error adding text(s). Please try again.');
      } finally {
        addTextsLoading.value = false;
        addTextsDialog.value = false;
      }
    };

    const getTexts = async () => {
      try {
        getTextsLoading.value = true;
        const response: SearchTextNamesResponse = await server.searchTextNames({
          page: searchOptions.value.page,
          rows: searchOptions.value.itemsPerPage,
          search: search.value,
        });
        unaddedTexts.value = response.texts;
        serverCount.value = response.count;
      } catch {
        actions.showErrorSnackbar(
          'Error updating text list. Please try again.'
        );
      } finally {
        getTextsLoading.value = false;
      }
    };

    watch(searchOptions, async () => {
      try {
        await getTexts();
        setPage(String(searchOptions.value.page));
        setRows(String(searchOptions.value.itemsPerPage));
        setSearch(search.value);
      } catch {
        actions.showErrorSnackbar(
          'Error updating text list. Please try again.'
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
        getTexts();
      }, 500),
      {
        immediate: false,
      }
    );

    return {
      loading,
      addTextsDialog,
      addTextsLoading,
      addTexts,
      textsHeaders,
      selectedTexts,
      unaddedTexts,
      searchOptions,
      serverCount,
      search,
      getTexts,
      getTextsLoading,
    };
  },
});
</script>
