<template>
  <OareContentView title="Bibliography">
    <div class="title font-weight-regular">
      <v-row>
        <v-col cols="2">
          <v-radio-group v-model="selectedType">
            <v-radio
              v-for="(type, idx) in types"
              :key="idx"
              :label="type.name"
              :value="type.value"
              :options.sync="tableOptions"
              class="test-radio-btn"
            ></v-radio>
          </v-radio-group>
        </v-col>
        <v-data-table
          :headers="itemsHeaders"
          :items="bibliographyResponse"
          :footer-props="{ 'items-per-page-options': [5, 25] }"
        >
          <template #[`item.title`]="{ item }">
            <span v-html="item.data.title" />
          </template>
          <template #[`item.author`]="{ item }">
            <span v-html="item.bib" />
          </template>
          <template #[`item.date`]="{ item }">
            <span v-html="item.data.date" />
          </template>
          <template #[`item.bibliography`]="{ item }">
            <a :href="item.url" v-html="item.url" />
          </template>
        </v-data-table>
      </v-row>
    </div>
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
import { DataTableHeader } from 'vuetify';

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

    const tableOptions = ref({
      page: 1,
      itemsPerPage: 25,
    });

    const loading = ref(false);

    const itemsHeaders: Ref<DataTableHeader[]> = ref([
      { text: 'Title', value: 'title' },
      { text: 'Author', value: 'author' },
      { text: 'Date', value: 'date' },
      { text: 'Bibliography', value: 'bibliography' },
    ]);
    const bibliographyResponse = ref<BibliographyResponse[]>([]);

    onMounted(async () => {
      await updateBibliography();
    });

    const updateBibliography = async () => {
      bibliographyResponse.value = await server.getBibliographies({
        citationStyle: selectedType.value,
        page: tableOptions.value.page,
        limit: tableOptions.value.itemsPerPage,
      });
    };

    watch(
      [selectedType, tableOptions],
      async () => {
        try {
          loading.value = true;
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

    return {
      server,
      types,
      selectedType,
      itemsHeaders,
      bibliographyResponse,
      loading,
    };
  },
});
</script>
