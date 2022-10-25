<template>
  <OareContentView title="Bibliography">
    <v-row>
      <v-col cols="2">
        <div class="sticky">
          <v-text-field
            v-model="search"
            label="Search"
            single-line
            hide-details
            clearable
            class="test-search"
          />
          <v-radio-group v-model="selectedType" hide-details>
            <template #label>
              <span class="font-weight-bold">Bibliography Style</span>
            </template>
            <v-radio
              v-for="(type, idx) in types"
              :key="idx"
              :label="type.name"
              :value="type.value"
              class="test-radio-btn-types"
            ></v-radio>
          </v-radio-group>
          <v-radio-group v-model="sortBy" hide-details>
            <template #label>
              <span class="font-weight-bold">Sort By</span>
            </template>
            <v-radio
              v-for="(item, idx) in sortByItems"
              :key="idx"
              :label="item.text"
              :value="item.value"
              class="test-radio-btn-sort-by"
            ></v-radio>
          </v-radio-group>
        </div>
      </v-col>
      <v-col cols="8">
        <v-data-table
          :loading="loading"
          :headers="itemsHeaders"
          :items="filteredBib"
          hide-default-header
          hide-default-footer
          disable-pagination
        >
          <template #[`item.bibliography`]="{ item }">
            <v-row>
              <v-col cols="8">
                <span v-if="!item.bibliography.bib">No Bibliography Data</span>
                <span
                  v-else-if="!item.bibliography.url"
                  v-html="item.bibliography.bib"
                >
                </span>
                <a
                  v-else
                  :href="item.bibliography.url"
                  target="_blank"
                  v-html="item.bibliography.bib"
                ></a>
              </v-col>
            </v-row>
          </template>
        </v-data-table>
      </v-col>
      <v-col cols="2"
        ><div class="sticky">
          <v-radio-group v-model="showItemType" hide-details>
            <template #label>
              <span class="font-weight-bold">Show Items</span>
            </template>
            <v-radio
              v-for="(item, idx) in itemType"
              :key="idx"
              :label="`${item.charAt(0).toUpperCase()}${item.substring(1)}`"
              :value="item"
              class="test-radio-btn-sort-by"
            ></v-radio>
          </v-radio-group></div
      ></v-col>
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
import { DataTableHeader } from 'vuetify';
import _ from 'lodash';

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
    const sortBy = useQueryParam('sortBy', 'title', true);
    const search = useQueryParam('query', '', true);
    const showItemType = useQueryParam('showItemType', 'all', true);
    const itemType: Ref<string[]> = ref(['all']);

    const loading = ref(false);

    const itemsHeaders: Ref<DataTableHeader[]> = ref([
      {
        text: 'Bibliography',
        value: 'bibliography',
        sortable: false,
      },
    ]);
    const sortByItems: Ref<{ text: string; value: string }[]> = ref([
      { text: 'Title', value: 'title' },
      { text: 'Author', value: 'author' },
      { text: 'Date', value: 'date' },
    ]);
    const bibliographyResponse = ref<BibliographyResponse[]>([]);
    const filteredBib = ref<BibliographyResponse[]>([]);

    onMounted(async () => {
      try {
        loading.value = true;
        await updateBibliography();
      } catch (err) {
        actions.showErrorSnackbar(
          `Error loading bibliography. Please try again.`,
          err as Error
        );
      } finally {
        loading.value = false;
      }
    });

    const updateBibliography = async () => {
      bibliographyResponse.value = [];
      filteredBib.value = [];
      itemType.value = ['all'];
      showItemType.value = 'all';
      bibliographyResponse.value = await server.getBibliographies({
        citationStyle: selectedType.value,
      });
      bibliographyResponse.value.forEach(bib => {
        const bibItemTypeClean = bib.itemType?.split(/(?=[A-Z])/g).join(' ');
        if (bibItemTypeClean && !itemType.value.includes(bibItemTypeClean)) {
          itemType.value.push(bibItemTypeClean);
        }
      });
      filteredBib.value = bibliographyResponse.value;
      sortBibliography();
    };

    const filterBibliography = () => {
      filteredBib.value = bibliographyResponse.value.filter(bib => {
        return bib.bibliography?.bib
          ?.replace(/<.+?>/g, '')
          .toLocaleLowerCase()
          .includes(search.value.toLocaleLowerCase());
      });
      sortBibliography();
    };

    const sortBibliography = () => {
      if (sortBy.value === 'title') {
        filteredBib.value = filteredBib.value.sort((a, b) => {
          if (a.title && b.title) {
            const articles = ['a', 'an', 'the', 'à'];
            const aTitle =
              a.title.match(
                /([^!‘“”`@#$%^&*()’_+\-=\[\]{};':"\\|,.<>\/?\s\d])+/g
              ) ?? [];
            const bTitle =
              b.title.match(
                /([^!‘“”`@#$%^&*()’_+\-=\[\]{};':"\\|,.<>\/?\s\d])+/g
              ) ?? [];
            const minLen =
              aTitle.length <= bTitle.length ? aTitle.length : bTitle.length;
            for (let i = 0; i < minLen; i += 1) {
              const aComparison =
                articles.includes(aTitle[i].toLocaleLowerCase()) &&
                i === 0 &&
                aTitle[i + 1]
                  ? aTitle[i + 1]
                  : aTitle[i];
              const bComparison =
                articles.includes(bTitle[i].toLocaleLowerCase()) &&
                i === 0 &&
                bTitle[i + 1]
                  ? bTitle[i + 1]
                  : bTitle[i];
              if (aComparison !== bComparison) {
                return aComparison.localeCompare(bComparison);
              }
            }
            return aTitle.length - bTitle.length;
          } else if (!a.title && b.title) {
            return -1;
          }
          return 1;
        });
      }
      if (sortBy.value === 'author') {
        filteredBib.value = filteredBib.value.sort((a, b) => {
          if (a.authors.length > 0 && b.authors.length > 0) {
            const minLen =
              a.authors.length <= b.authors.length
                ? a.authors.length
                : b.authors.length;
            for (let i = 0; i < minLen; i += 1) {
              const aAuthorFullName = a.authors[i].split(' ');
              const bAuthorFullName = b.authors[i].split(' ');
              const aAuthorLastName =
                aAuthorFullName[aAuthorFullName.length - 1];
              const bAuthorLastName =
                bAuthorFullName[bAuthorFullName.length - 1];
              if (aAuthorLastName !== bAuthorLastName) {
                return aAuthorLastName.localeCompare(bAuthorLastName);
              }
            }
            return a.authors.length - b.authors.length;
          } else if (a.authors.length === 0 && b.authors.length > 0) {
            return 1;
          }
          return -1;
        });
      }
      if (sortBy.value === 'date') {
        filteredBib.value = filteredBib.value.sort((a, b) => {
          let aDate: number | null = null;
          let bDate: number | null = null;
          if (a.date && b.date) {
            aDate = Number(/[0-9]{4}/.exec(a.date));
            bDate = Number(/[0-9]{4}/.exec(b.date));
            if (aDate && bDate) {
              return aDate - bDate;
            } else if (!aDate && bDate) {
              return 1;
            }
            return -1;
          } else if (!a.date && b.date) {
            return 1;
          }
          return -1;
        });
      }
    };

    watch(search, _.debounce(filterBibliography, 100), {
      immediate: false,
    });

    watch(sortBy, sortBibliography);

    watch(showItemType, filterBibliography);

    watch(
      [selectedType],
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
      filteredBib,
      loading,
      search,
      sortBy,
      sortByItems,
      itemType,
      showItemType,
    };
  },
});
</script>
<style>
.sticky {
  position: sticky;
  top: 1.2in;
}
</style>
