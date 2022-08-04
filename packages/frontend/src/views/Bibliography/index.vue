<template>
  <OareContentView title="Bibliography">
    <v-row>
      <v-col cols="2">
        <v-radio-group v-model="selectedType" hide-details>
          <template #label>
            <span class="font-weight-bold">Bibliography Style</span>
          </template>
          <v-radio
            v-for="(type, idx) in types"
            :key="idx"
            :label="type.name"
            :value="type.value"
            class="test-radio-btn"
          ></v-radio>
        </v-radio-group>
      </v-col>
      <v-col cols="10">
        <v-data-table
          :loading="loading"
          :headers="itemsHeaders"
          :items="bibliographyResponse"
          :server-items-length="bibliographyCount"
          :footer-props="{ 'items-per-page-options': [10, 25, 50, 100] }"
          :options.sync="tableOptions"
        >
          <template #[`item.title`]="{ item }">
            <span>{{ item.title || 'No Title' }}</span>
          </template>
          <template #[`item.author`]="{ item }">
            <span v-if="item.authors.length === 0">No Author Data</span>
            <span v-else v-for="(author, idx) in item.authors" :key="idx"
              >{{ author
              }}<span v-if="idx < item.authors.length - 1">, </span></span
            >
          </template>
          <template #[`item.date`]="{ item }">
            <span>{{ item.date || 'No Date' }}</span>
          </template>
          <template #[`item.bibliography`]="{ item }">
            <span v-if="!item.bibliography.bib">No Bibliography Data</span>
            <span
              v-else-if="!item.bibliography.url"
              v-html="item.bibliography.bib"
            />
            <a
              v-else
              :href="item.bibliography.url"
              v-html="item.bibliography.bib"
              target="_blank"
            />
          </template>
        </v-data-table>
      </v-col>
    </v-row>
  </OareContentView>
</template>

<script lang="ts">
import {
  defineComponent,
  onMounted,
  ref,
  Ref,
  watch,
} from '@vue/composition-api';
import PageContent from '@/components/base/OarePageContent.vue';
import TextCollectionList from '@/views/Admin/components/TextCollectionList.vue';
import useQueryParam from '@/hooks/useQueryParam';
import sl from '@/serviceLocator';
import { BibliographyResponse } from '@oare/types';
import { DataTableHeader, DataOptions } from 'vuetify';

export default defineComponent({
  components: {
    TextCollectionList,
    PageContent,
  },
  setup() {
    const server = sl.get('serverProxy');
    const actions = sl.get('globalActions');
    const types = ref([
      { name: 'Chicago Author Date', value: 'chicago-author-date' },
      { name: 'Chicago Note Bibliography', value: 'chicago-note-bibliography' },
    ]);
    const selectedType = useQueryParam('type', 'chicago-author-date', true);
    const page = useQueryParam('page', '1', false);
    const limit = useQueryParam('limit', '25', true);

    const tableOptions: Ref<DataOptions> = ref({
      page: Number(page.value),
      itemsPerPage: Number(limit.value),
      sortBy: [],
      sortDesc: [],
      groupBy: [],
      groupDesc: [],
      multiSort: false,
      mustSort: false,
    });

    const loading = ref(false);

    const itemsHeaders: Ref<DataTableHeader[]> = ref([
      { text: 'Title', value: 'title' },
      { text: 'Author', value: 'author' },
      { text: 'Date', value: 'date' },
      { text: 'Bibliography', value: 'bibliography' },
    ]);
    const bibliographyResponse = ref<BibliographyResponse[]>([]);
    const bibliographyCount = ref<number>(0);

    onMounted(async () => {
      await updateBibliography();
    });

    const updateBibliography = async () => {
      bibliographyResponse.value = await server.getBibliographies({
        citationStyle: selectedType.value,
        page: Number(page.value),
        limit: Number(limit.value),
      });
      bibliographyCount.value = await server.getBibliographiesCount();
    };

    watch(
      [selectedType, tableOptions],
      async () => {
        try {
          loading.value = true;
          page.value = String(tableOptions.value.page);
          limit.value = String(tableOptions.value.itemsPerPage);
          await updateBibliography();
        } catch (err) {
          actions.showErrorSnackbar(
            `Error updating bibliography. Please try again.`,
            err as Error
          );
        } finally {
          loading.value = false;
        }
      },
      { deep: true }
    );

    watch([page, limit], () => {
      tableOptions.value.page = Number(page.value);
      tableOptions.value.itemsPerPage = Number(limit.value);
    });

    return {
      server,
      types,
      selectedType,
      itemsHeaders,
      bibliographyResponse,
      loading,
      tableOptions,
      bibliographyCount,
    };
  },
});
</script>
