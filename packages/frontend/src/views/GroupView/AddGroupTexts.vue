<template>
  <OareContentView :title="`Add Texts to ${groupName}`" :loading="loading">
    <template #header>
      <router-link :to="`/groups/${groupId}/texts`"
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
          Are you sure you want to add the following text(s) and permissions to
          the group named
          {{ groupName }}?
          <v-data-table :headers="selectedTextsHeaders" :items="selectedTexts">
            <template #[`item.canRead`]="{ item }">
              <v-checkbox
                :input-value="item.canRead"
                @change="updateTextToAddRead(item.uuid, $event)"
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
          <h3>Selected Texts</h3>
          <v-data-table
            :headers="selectedTextsHeaders"
            :items="selectedTexts"
            item-key="uuid"
            class="mt-3"
            show-select
            v-model="selectedTexts"
          >
            <template #[`item.canRead`]="{ item }">
              <v-checkbox
                :input-value="item.canRead"
                @change="updateTextToAddRead(item.uuid, $event)"
              />
            </template>
            <template #[`item.canWrite`]="{ item }">
              <v-checkbox v-model="item.canWrite" :disabled="!item.canRead" />
            </template>
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
            :value="selectedTexts"
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
import { Text, SearchTextNamesResponse } from '@oare/types';
import { DataTableHeader, DataOptions } from 'vuetify';
import useQueryParam from '@/hooks/useQueryParam';

export default defineComponent({
  name: 'AddGroupTexts',
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

    const selectedTextsHeaders = ref([
      { text: 'Text Name', value: 'name' },
      { text: 'Can view?', value: 'canRead', width: '20%' },
      { text: 'Can edit?', value: 'canWrite', width: '20%' },
    ]);
    const textsHeaders: Ref<DataTableHeader[]> = ref([
      { text: 'Text Name', value: 'name' },
    ]);

    const loading = ref(true);
    const addTextsDialog = ref(false);
    const addTextsLoading = ref(false);
    const getTextsLoading = ref(false);

    const [page, setPage] = useQueryParam('page', '1');
    const [rows, setRows] = useQueryParam('rows', '10');
    const [search, setSearch] = useQueryParam('query', '');
    const [texts, setTexts] = useQueryParam('texts', '');

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

    const selectedTexts: Ref<Text[]> = ref([]);
    const unaddedTexts: Ref<Text[]> = ref([]);

    const groupName = ref('');

    const getTexts = async () => {
      try {
        getTextsLoading.value = true;
        const response: SearchTextNamesResponse = await server.searchTextNames({
          page: searchOptions.value.page,
          rows: searchOptions.value.itemsPerPage,
          search: search.value,
          groupId,
        });
        unaddedTexts.value = response.texts.map(text => ({
          name: text.name,
          uuid: text.uuid,
          canRead: true,
          canWrite: false,
        }));
        serverCount.value = response.count;
      } catch {
        actions.showErrorSnackbar(
          'Error updating text list. Please try again.'
        );
      } finally {
        getTextsLoading.value = false;
      }
    };

    const addTexts = async () => {
      const texts = selectedTexts.value.map(text => ({
        canRead: text.canRead,
        canWrite: text.canWrite,
        uuid: text.uuid,
      }));
      addTextsLoading.value = true;
      try {
        await server.addTextGroups(Number(groupId), {
          texts,
        });
        actions.showSnackbar('Successfully added text(s).');
        router.push(`/groups/${groupId}/texts`);
      } catch {
        actions.showErrorSnackbar('Error adding text(s). Please try again.');
      } finally {
        addTextsLoading.value = false;
        addTextsDialog.value = false;
      }
    };

    const updateTextToAddRead = (uuid: string, canRead: boolean) => {
      const index = selectedTexts.value.map(text => text.uuid).indexOf(uuid);
      selectedTexts.value[index].canRead = canRead;

      if (!canRead) {
        selectedTexts.value[index].canWrite = false;
      }
    };

    onMounted(async () => {
      try {
        await getTexts();
        groupName.value = await server.getGroupName(Number(groupId));
        if (texts.value) {
          const uuids: string[] = JSON.parse(texts.value);
          const textNames = await Promise.all(
            uuids.map(uuid => server.getTextName(uuid))
          );
          selectedTexts.value = uuids.map((uuid, index) => ({
            name: textNames[index].name,
            uuid,
            canRead: true,
            canWrite: false,
          }));
        }
      } catch {
        actions.showErrorSnackbar('Error loading texts. Please try again.');
      } finally {
        loading.value = false;
      }
    });

    function selectItem(event: { value: boolean; item: Text }) {
      event.value
        ? selectedTexts.value.unshift(event.item)
        : selectedTexts.value.splice(
            selectedTexts.value.indexOf(event.item),
            1
          );
    }

    function selectAll(event: { value: boolean; item: Text }) {
      event.value
        ? unaddedTexts.value.forEach(text => selectedTexts.value.push(text))
        : unaddedTexts.value.forEach(text =>
            selectedTexts.value.splice(selectedTexts.value.indexOf(text), 1)
          );
    }

    watch(searchOptions, async () => {
      try {
        await getTexts();
        setPage(String(searchOptions.value.page));
        setRows(String(searchOptions.value.itemsPerPage));
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
        await getTexts();
      }, 500),
      {
        immediate: false,
      }
    );

    watch(selectedTexts, async () => {
      setTexts(JSON.stringify(selectedTexts.value.map(text => text.uuid)));
    });

    return {
      groupName,
      loading,
      addTextsLoading,
      addTextsDialog,
      addTexts,
      selectedTexts,
      unaddedTexts,
      textsHeaders,
      search,
      setSearch,
      getTextsLoading,
      searchOptions,
      serverCount,
      selectedTextsHeaders,
      updateTextToAddRead,
      selectItem,
      selectAll,
    };
  },
});
</script>
