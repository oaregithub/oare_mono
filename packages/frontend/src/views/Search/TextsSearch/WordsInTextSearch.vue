<template>
  <div>
    <v-row>
      <v-col cols="7">
        <div v-for="index in numOptionsUsing" :key="index">
          <v-autocomplete
            v-model="wordAndFormSelectionUuids[index - 1]"
            :items="items"
            item-text="wordDisplay"
            item-value="info"
            clearable
            :class="`test-autocomplete-${index}`"
            deletable-chips
            :loading="formsLoading"
            chips
            multiple
            :filter="filter"
            hide-selected
            @change="
              getWordForms(wordAndFormSelectionUuids[index - 1], index - 1);
              wordAndFormSelectionUuids[index - 1].length < 1
                ? (expand[index - 1] = false)
                : (expand[index - 1] = true);
            "
            item-color="primary"
            :label="`word/form #${index}`"
          >
            <template v-if="index === 1" slot="prepend-inner">
              <words-in-text-search-info-card></words-in-text-search-info-card>
            </template>
          </v-autocomplete>
          <v-expand-transition>
            <v-card
              v-if="wordForms && index <= numOptionsUsing"
              v-show="expand[index - 1]"
            >
              <v-expansion-panels>
                <v-expansion-panel
                  v-for="(word, i) in wordForms[index - 1]"
                  :key="`${word.name}${index}${i}`"
                >
                  <v-expansion-panel-header>{{
                    `${word.name} -- ${
                      new Set(
                        wordAndFormSearchUuids[index - 1].filter(uuid => {
                          return word.forms
                            .map(form => form.uuid)
                            .includes(uuid);
                        })
                      ).size
                    }/${word.forms.length} form${
                      word.forms.length > 1 ? 's' : ''
                    } selected`
                  }}</v-expansion-panel-header>
                  <v-expansion-panel-content>
                    <v-list-item-group>
                      <v-list-item
                        ><v-list-item-action
                          ><v-checkbox
                            @click="
                              selectAll(
                                checkboxAll[`${word.uuid}${index - 1}`],
                                index - 1,
                                i
                              )
                            "
                            v-model="checkboxAll[`${word.uuid}${index - 1}`]"
                            label="Select All"
                          ></v-checkbox
                        ></v-list-item-action>
                      </v-list-item>
                      <v-list-item
                        v-for="(form, j) in word.forms"
                        :key="`${form.uuid}${index}${i}${j}`"
                      >
                        <v-list-item-action>
                          <v-checkbox
                            :label="form.name"
                            :value="form.uuid"
                            v-model="wordAndFormSearchUuids[index - 1]"
                          ></v-checkbox>
                        </v-list-item-action>
                      </v-list-item>
                    </v-list-item-group>
                  </v-expansion-panel-content>
                </v-expansion-panel>
              </v-expansion-panels>
            </v-card>
          </v-expand-transition>
          <v-autocomplete
            v-if="index < numOptionsUsing"
            v-model="numWordsBetween[index - 1]"
            :class="`test-numWordsBetween-${index}`"
            :items="wordsBetween"
            item-text="name"
            item-value="value"
            clearable
            hide-selected
            item-color="primary"
            label="determine how many words between"
          ></v-autocomplete>
          <div v-if="index === numOptionsUsing" class="pt-4 pb-2">
            <span
              v-if="index === numOptionsUsing && index < maxOptions"
              class="pr-2"
            >
              <v-btn
                class="test-increase-button"
                fab
                color="primary"
                x-small
                @click="updateNumOptionsUsing(true)"
                ><v-icon>mdi-plus</v-icon></v-btn
              ></span
            >
            <span v-if="index === numOptionsUsing && index !== 1">
              <v-btn
                class="test-decrease-button"
                fab
                color="primary"
                x-small
                @click="updateNumOptionsUsing(false)"
                ><v-icon>mdi-minus</v-icon></v-btn
              ></span
            >
          </div>
        </div>
      </v-col>
      <v-col>
        <v-radio-group
          label="Search Mode"
          v-model="sequenced"
          class="test-radio-sequence"
          :disabled="numOptionsUsing < 2"
        >
          <v-radio label="Sequenced" value="true"></v-radio>
          <v-radio label="Unsequenced" value="false"></v-radio>
        </v-radio-group>
      </v-col>
    </v-row>
    <div class="py-3">
      <v-btn
        @click="performSearch(1, Number(rows), true)"
        class="test-submit"
        :disabled="!canPerformSearch"
        >Search</v-btn
      >
    </div>
    <words-in-texts-search-table
      :items="results"
      :total="total"
      :page="Number(page)"
      @update:page="page = `${$event}`"
      :rows="Number(rows)"
      @update:rows="rows = `${$event}`"
      :loading="searchLoading"
    >
    </words-in-texts-search-table>
  </div>
</template>

<script lang="ts">
import {
  defineComponent,
  ref,
  Ref,
  onMounted,
  watch,
} from '@vue/composition-api';
import {
  WordFormAutocompleteDisplay,
  WordsInTextsSearchResultRow,
  WordsInTextsSearchResponse,
} from '@oare/types';
import WordsInTextsSearchTable from './components/WordsInTextSearchTable.vue';
import WordsInTextSearchInfoCard from './components/WordsInTextSearchInfoCard.vue';
import useQueryParam from '@/hooks/useQueryParam';
import sl from '@/serviceLocator';

export interface WordForWordsInTextSearch {
  name: string;
  uuid: string;
  forms: Array<{ name: string; uuid: string }>;
}

export default defineComponent({
  name: 'WordsInTextsSearch',
  components: { WordsInTextsSearchTable, WordsInTextSearchInfoCard },
  setup() {
    const items: Ref<WordFormAutocompleteDisplay[]> = ref([]);
    const filteredItems: Ref<{
      [index: string]: WordFormAutocompleteDisplay[];
    }> = ref({});
    const loading = ref(false);
    const searchLoading = ref(false);
    const formsLoading = ref(false);
    const server = sl.get('serverProxy');
    const actions = sl.get('globalActions');
    const numOptionsUsing: Ref<number> = ref(1);
    const maxOptions = 5;
    const canPerformSearch: Ref<boolean> = ref(false);
    const page: Ref<string> = ref(useQueryParam('page', '1', false));
    const rows: Ref<string> = ref(useQueryParam('rows', '25', true));
    const results: Ref<WordsInTextsSearchResultRow[]> = ref([]);
    const total = ref(0);
    const checkboxAll: Ref<{ [uuid: string]: boolean }> = ref({});
    const allUuids: Ref<string[][]> = ref([]);
    const wordAndFormSelectionUuids: Ref<
      {
        uuid: string;
        wordUuid: string;
        name: string;
      }[][]
    > = ref([[]]);
    const wordAndFormSearchUuids: Ref<string[][]> = ref([[]]);
    const numWordsBetween: Ref<number[]> = ref([]);
    const expand: Ref<Boolean[]> = ref([]);
    const wordForms: Ref<WordForWordsInTextSearch[][]> = ref([]);
    const sequenced = useQueryParam('sequenced', 'true', true);

    const wordsBetween = ref([
      { name: '<= 1', value: 1 },
      { name: '<= 2', value: 2 },
      { name: '<= 3', value: 3 },
      { name: '<= 4', value: 4 },
      { name: '<= 5', value: 5 },
      { name: '<= 6', value: 6 },
      { name: '<= 7', value: 7 },
      { name: '<= 8', value: 8 },
      { name: '<= 9', value: 9 },
      { name: '<= 10', value: 10 },
      { name: '<= 10+', value: -1 },
    ]);

    const headers = ref([
      {
        text: 'Text Name',
        value: 'name',
      },
      {
        text: 'Matching Discourse',
        value: 'discourse',
      },
    ]);

    const filter = (item: any, queryText: string, itemText: string) => {
      const itemTextClean = itemText.slice(0, -6).toLocaleLowerCase();
      const queryTextClean = queryText.toLocaleLowerCase();
      const track = Array(itemTextClean.length + 1)
        .fill(null)
        .map(() => Array(queryTextClean.length + 1).fill(null));
      for (let i = 0; i <= queryTextClean.length; i += 1) {
        track[0][i] = i;
      }
      for (let j = 0; j <= itemTextClean.length; j += 1) {
        track[j][0] = j;
      }
      for (let j = 1; j <= itemTextClean.length; j += 1) {
        for (let i = 1; i <= queryTextClean.length; i += 1) {
          const indicator =
            queryTextClean[i - 1] === itemTextClean[j - 1] ? 0 : 1;
          track[j][i] = Math.min(
            track[j][i - 1] + 1, // deletion
            track[j - 1][i] + 1, // insertion
            track[j - 1][i - 1] + indicator // substitution
          );
        }
      }
      if (track[itemTextClean.length][queryTextClean.length] < 3) {
        return item;
      }
    };

    const performSearch = async (
      pageNum: number,
      rows: number,
      resetPage: boolean
    ) => {
      searchLoading.value = true;
      total.value = 0;
      try {
        const response: WordsInTextsSearchResponse = await server.getWordsInTextSearchResults(
          {
            uuids: JSON.stringify(wordAndFormSearchUuids.value),
            numWordsBetween: JSON.stringify(numWordsBetween.value),
            page: JSON.stringify(pageNum),
            rows: JSON.stringify(rows),
            sequenced: sequenced.value,
          }
        );
        results.value = response.results;
        total.value = response.total;
        if (resetPage) {
          page.value = '1';
        }
      } catch (err) {
        actions.showErrorSnackbar(
          'Error performing words in texts search. Please try again.',
          err as Error
        );
      } finally {
        searchLoading.value = false;
      }
    };

    const updateNumOptionsUsing = async (increase: boolean) => {
      try {
        if (numOptionsUsing.value < maxOptions && increase) {
          numOptionsUsing.value += 1;
        }
        if (numOptionsUsing.value > 1 && !increase) {
          numOptionsUsing.value -= 1;
          if (wordAndFormSelectionUuids.value.length > numOptionsUsing.value) {
            wordAndFormSelectionUuids.value.pop();
          }
          if (wordAndFormSearchUuids.value.length > numOptionsUsing.value) {
            wordAndFormSearchUuids.value.pop();
          }
          if (wordForms.value.length > numOptionsUsing.value) {
            wordForms.value.pop();
          }
          if (numWordsBetween.value.length > numOptionsUsing.value - 1) {
            numWordsBetween.value.pop();
          }
        }
      } catch (err) {
        actions.showErrorSnackbar(
          'error changing number of search options',
          err as Error
        );
      }
    };

    const selectAll = (val: boolean | null, index: number, idx: number) => {
      wordForms.value[index][idx].forms.forEach(form => {
        if (wordAndFormSearchUuids.value[index].includes(form.uuid) && !val) {
          wordAndFormSearchUuids.value[index].splice(
            wordAndFormSearchUuids.value[index].indexOf(form.uuid),
            1
          );
        }
        if (!wordAndFormSearchUuids.value[index].includes(form.uuid) && val) {
          wordAndFormSearchUuids.value[index].push(form.uuid);
        }
      });
    };

    const markSelectAllFalseOnRemoval = (
      dict: { [uuid: string]: boolean },
      index: number
    ) => {
      Object.keys(dict).forEach((uuidKey: string) => {
        const position: number = Number(uuidKey.slice(-1));
        const uuid: string = uuidKey.slice(0, -1);
        const selectionUuids: string[] = wordAndFormSelectionUuids.value[
          index
        ].map(({ uuid }) => uuid);
        if (position === index && !selectionUuids.includes(uuid)) {
          dict[uuidKey] = false;
        }
      });
    };

    const getWordForms = (
      selectedItems: Array<{
        uuid: string;
        wordUuid: string;
        name: string;
      }>,
      index: number
    ) => {
      wordForms.value[index] = [];
      wordAndFormSearchUuids.value[index] = [];
      markSelectAllFalseOnRemoval(checkboxAll.value, index);
      selectedItems.forEach(selectedItem => {
        if (selectedItem.uuid === selectedItem.wordUuid) {
          const forms: Array<{ uuid: string; name: string }> = items.value
            .filter(item => {
              if (
                item.info.wordUuid === selectedItem.uuid &&
                item.info.uuid !== item.info.wordUuid
              ) {
                return item.info.uuid;
              }
            })
            .map(item => {
              return { uuid: item.info.uuid, name: item.info.name };
            });
          const wordForWordsInTextSearch: WordForWordsInTextSearch = {
            name: selectedItem.name,
            uuid: selectedItem.uuid,
            forms: forms,
          };
          wordForms.value[index].push(wordForWordsInTextSearch);
          wordAndFormSearchUuids.value[index].push(
            ...forms.map(({ uuid }) => uuid)
          );
        } else {
          const word = items.value.find(item => {
            if (item.info.uuid === selectedItem.wordUuid) return item;
          });
          const formSiblings = items.value
            .filter(item => {
              if (
                item.info.wordUuid === selectedItem.wordUuid &&
                item.info.wordUuid !== item.info.uuid
              )
                return item;
            })
            .map(item => {
              return { uuid: item.info.uuid, name: item.info.name };
            });
          if (word) {
            const wordForWordsInTextSearch: WordForWordsInTextSearch = {
              name: word.info.name,
              uuid: word.info.uuid,
              forms: formSiblings,
            };
            wordForms.value[index].push(wordForWordsInTextSearch);
            wordAndFormSearchUuids.value[index].push(selectedItem.uuid);
          }
        }
      });
    };

    onMounted(async () => {
      try {
        items.value = await server.getWordsAndForms();
        for (let i = 0; i < maxOptions; i += 1) {
          expand.value.push(false);
          allUuids.value.push([]);
        }
      } catch (err) {
        actions.showErrorSnackbar(
          'Error loading words and forms. Please try again.',
          err as Error
        );
      }
    });

    watch([page, rows], () => {
      if (canPerformSearch.value) {
        performSearch(Number(page.value), Number(rows.value), false);
      }
    });

    watch(
      [
        wordAndFormSearchUuids,
        wordAndFormSelectionUuids,
        numOptionsUsing,
        numWordsBetween,
        sequenced,
        checkboxAll,
      ],
      () => {
        canPerformSearch.value = true;
        if (
          wordAndFormSelectionUuids.value.length < 1 ||
          wordAndFormSearchUuids.value.length < 1
        ) {
          canPerformSearch.value = false;
          return;
        }
        if (
          wordAndFormSelectionUuids.value.length !== 1 &&
          numWordsBetween.value.length < 1 &&
          sequenced.value === 'true'
        ) {
          canPerformSearch.value = false;
          return;
        }
        if (
          wordAndFormSelectionUuids.value.length !== numOptionsUsing.value ||
          wordAndFormSearchUuids.value.length !== numOptionsUsing.value
        ) {
          canPerformSearch.value = false;
          return;
        }
        wordAndFormSelectionUuids.value.forEach(wordAndFormSelection => {
          if (wordAndFormSelection.length < 1) {
            canPerformSearch.value = false;
            return;
          }
        });

        wordAndFormSearchUuids.value.forEach(wordAndFormSearch => {
          if (wordAndFormSearch.length < 1) {
            canPerformSearch.value = false;
            return;
          }
        });
        if (numWordsBetween.value.length > 0 && sequenced.value !== 'false') {
          numWordsBetween.value.forEach(val => {
            if (typeof val !== 'number') {
              canPerformSearch.value = false;
              return;
            }
          });
        }
      }
    );

    return {
      items,
      wordAndFormSelectionUuids,
      numWordsBetween,
      wordsBetween,
      numOptionsUsing,
      updateNumOptionsUsing,
      canPerformSearch,
      performSearch,
      selectAll,
      expand,
      wordForms,
      formsLoading,
      getWordForms,
      wordAndFormSearchUuids,
      searchLoading,
      filter,
      headers,
      total,
      results,
      checkboxAll,
      page,
      rows,
      sequenced,
      allUuids,
      loading,
      maxOptions,
    };
  },
});
</script>
