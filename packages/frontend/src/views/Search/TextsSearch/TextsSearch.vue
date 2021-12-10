<template>
  <div>
    <v-row>
      <v-col cols="8">
        {{ $t('search.textTitle') }}
        <v-text-field
          class="test-title-search"
          v-model="textTitleSearch"
          placeholder="Text title"
          @keyup.enter="resetSearch"
          outlined
        />
        {{ $t('search.characterSequenceDescription') }}
        <search-information-card />
        <v-text-field
          class="test-character-search"
          v-model="translitSearch"
          :placeholder="$t('search.characterSequences')"
          @keyup.enter="resetSearch"
          outlined
        ></v-text-field>
        <v-btn
          class="test-submit-button"
          @click="resetSearch"
          color="primary"
          :disabled="!canPerformSearch"
          >{{ $t('search.searchBtnText') }}</v-btn
        >
      </v-col>
    </v-row>
    <oare-data-table
      :server-items-length="totalSearchResults"
      :headers="headers"
      :items="searchResults"
      item-key="uuid"
      :fetch-items="searchTexts"
      :watched-params="['translit', 'title']"
      :default-rows="100"
      :dense="true"
    >
      <template #[`item.name`]="{ item }">
        <router-link :to="`/epigraphies/${item.uuid}/${item.discourseUuids}`">
          {{ item.name }}
        </router-link>
      </template>
      <template #[`item.matches`]="{ item }">
        <div
          v-for="(match, index) in item.matches"
          :key="index"
          v-html="match"
        ></div>
      </template>
      <template #[`footer.page-text`]="items">
        <div v-if="!items.itemsLength || !items.pageStart || !items.pageStop">
          –
        </div>
        <div v-else>
          {{ items.pageStart }} - {{ items.pageStop }} of
          {{ searchTotalLoading ? 'Loading...' : items.itemsLength }}
        </div>
      </template>
    </oare-data-table>
  </div>
</template>

<script lang="ts">
import {
  defineComponent,
  ref,
  Ref,
  computed,
  onMounted,
} from '@vue/composition-api';
import { SearchTextsResultRow, SearchTextsResponse } from '@oare/types';
import ResultTable from '../components/ResultTable.vue';
import SearchInformationCard from './components/SearchInformationCard.vue';
import { highlightedItem } from '../utils';
import useQueryParam from '@/hooks/useQueryParam';
import sl from '@/serviceLocator';
import { OareDataTableOptions } from '@/components/base/OareDataTable.vue';

export default defineComponent({
  name: 'TextsSearch',
  components: {
    ResultTable,
    SearchInformationCard,
  },
  setup() {
    const searchResults: Ref<SearchTextsResultRow[]> = ref([]);
    const searchLoading = ref(false);
    const searchTotalLoading = ref(false);
    const totalSearchResults = ref(0);

    const server = sl.get('serverProxy');
    const actions = sl.get('globalActions');
    const router = sl.get('router');

    const translitQuery = useQueryParam('translit', '');
    const textTitleQuery = useQueryParam('title', '');
    const [getIsVisited, setIsVisited] = useQueryParam('isVisited', '', true);

    const translitSearch = ref(translitQuery.value);
    const textTitleSearch = ref(textTitleQuery.value);

    const headers = ref([
      {
        text: 'Text Name',
        value: 'name',
        sortable: false,
      },
      {
        text: 'Matching Lines',
        value: 'matches',
        sortable: false,
      },
    ]);

    const canPerformSearch = computed(() => {
      return !!(translitSearch.value.trim() || textTitleSearch.value.trim());
    });

    const searchTexts = async ({ page, rows }: OareDataTableOptions) => {
      if (canPerformSearch.value) {
        searchLoading.value = true;
        try {
          let { results }: SearchTextsResponse = await server.searchTexts({
            characters: translitSearch.value,
            textTitle: textTitleSearch.value,
            page,
            rows,
          });

          if (results.length === 1 && getIsVisited() !== 'true') {
            actions.showSnackbar(
              'This page appears because the search resolved into only one text. If this is not the text intended, use the browser to return to the search page and simplify the search term.'
            );
            await setIsVisited('true');
            router.push(`/epigraphies/${results[0].uuid}`);
          } else {
            searchResults.value = results;
          }
        } catch (err) {
          actions.showErrorSnackbar(
            'Error searching texts. Please try again.',
            err as Error
          );
        } finally {
          searchLoading.value = false;
        }
      }
    };

    const searchTextsTotal = async () => {
      if (canPerformSearch.value) {
        searchTotalLoading.value = true;
        try {
          totalSearchResults.value = await server.searchTextsTotal({
            characters: translitSearch.value,
            textTitle: textTitleSearch.value,
          });
        } catch (err) {
          actions.showErrorSnackbar(
            'Error getting texts total. Please try again.',
            err as Error
          );
        } finally {
          searchTotalLoading.value = false;
        }
      }
    };

    const resetSearch = async (resetVisited: boolean = true) => {
      totalSearchResults.value = -1;
      textTitleQuery.value = textTitleSearch.value;
      if (resetVisited) {
        await setIsVisited('false');
      }
      searchTextsTotal();
    };

    onMounted(() => {
      resetSearch(false);
    });

    return {
      searchResults,
      textTitleSearch,
      translitSearch,
      searchLoading,
      totalSearchResults,
      canPerformSearch,
      headers,
      highlightedItem,
      searchTexts,
      resetSearch,
      searchTotalLoading,
    };
  },
});
</script>
