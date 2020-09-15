<template>
  <div>
    <v-row>
      <v-col cols="8">
        {{ $t("search.textTitle") }}
        <v-text-field
          v-model="textTitleSearch"
          placeholder="Text title"
          @keyup.enter="triggerSearch"
          outlined
        />
        {{ $t("search.characterSequenceDescription") }}
        <v-text-field
          v-model="transliterationSearch"
          :placeholder="$t('search.characterSequences')"
          @keyup.enter="triggerSearch"
          outlined
        ></v-text-field>
        <v-btn
          @click="triggerSearch"
          color="primary"
          :disabled="!canPerformSearch"
          >{{ $t("search.searchBtnText") }}</v-btn
        >
      </v-col>
    </v-row>
    <result-table
      :searchResults="searchResults"
      :loading="searchLoading"
      :totalSearchResults="totalSearchResults"
      :page.sync="page"
      :rows.sync="rows"
      :headers="headers"
    >
      <template #item.name="{item}">
        <router-link :to="'/epigraphies/' + item.uuid">
          {{ item.name }}
        </router-link>
      </template>
    </result-table>
  </div>
</template>

<script lang="ts">
import {
  defineComponent,
  ref,
  Ref,
  computed,
  watch,
} from '@vue/composition-api';
import { SearchResultRow, SearchResult } from '@/types/search';
import { updateUrl, formattedSearchCharacter } from './utils';
import server from '@/serverProxy';
import ResultTable from './ResultTable.vue';
import { highlightedItem } from './utils';

export default defineComponent({
  name: 'TextsSearch',
  components: {
    ResultTable,
  },
  setup(props, context) {
    const searchResults: Ref<SearchResultRow[]> = ref([]);
    const textTitleSearch = ref('');
    const transliterationSearch = ref('');
    const searchLoading = ref(false);
    const totalSearchResults = ref(0);
    const page = ref(1);
    const rows = ref(10);

    const headers = ref([
      {
        text: 'Text Name',
        value: 'name',
      },
      {
        text: 'Matching Lines',
        value: 'matches',
      },
    ]);

    const searchCharsArray = computed(() => {
      let chars = transliterationSearch.value
        .trim()
        .split(/[\s\-.]+/)
        .map(formattedSearchCharacter);

      if (chars.length === 1 && chars[0] === '') {
        return [];
      }
      return chars;
    });

    const canPerformSearch = computed(() => {
      return transliterationSearch.value.trim() || textTitleSearch.value.trim();
    });

    const queryUrl = computed(() => ({
      page: String(page.value),
      rows: String(rows.value),
      title: textTitleSearch.value,
      query: transliterationSearch.value,
    }));

    watch(page, () => updateUrl(queryUrl.value), { lazy: true });
    watch(rows, () => updateUrl(queryUrl.value), { lazy: true });

    const triggerSearch = () => {
      if (canPerformSearch.value) {
        updateUrl({
          ...queryUrl.value,
          page: '1',
        });
      }
    };

    const setSearchParamsToQueryValues = () => {
      const {
        root: {
          $route: { query },
        },
      } = context;
      textTitleSearch.value = query.title ? String(query.title) : '';
      transliterationSearch.value = query.query ? String(query.query) : '';
      page.value = query.page ? Number(query.page) : 1;
      rows.value = query.rows ? Number(rows.value) : 10;
      searchResults.value = [];
    };

    const searchTexts = async () => {
      searchLoading.value = true;
      let { totalRows, results }: SearchResult = await server.searchTexts(
        [...searchCharsArray.value],
        textTitleSearch.value,
        {
          page: page.value,
          rows: rows.value,
        }
      );

      totalSearchResults.value = totalRows;
      searchResults.value = results;

      searchLoading.value = false;
    };

    watch(
      () => context.root.$route.query,
      () => {
        setSearchParamsToQueryValues();

        if (canPerformSearch.value) {
          searchTexts();
        }
      },
      { deep: true }
    );

    return {
      searchResults,
      textTitleSearch,
      transliterationSearch,
      searchLoading,
      totalSearchResults,
      canPerformSearch,
      triggerSearch,
      page,
      rows,
      headers,
      highlightedItem,
    };
  },
});
</script>

<style></style>
