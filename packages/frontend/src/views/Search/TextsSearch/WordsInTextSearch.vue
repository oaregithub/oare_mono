<template>
  <div>
    <div v-if="!loading">
      <v-row>
        <v-col cols="10">
          <div v-for="index in numOptionsUsing" :key="index" class="pr-3">
            <div>
              <div v-show="index !== 1">
                <h4>
                  {{ `Words Between Search Items ${index - 1} & ${index}` }}
                </h4>
                <v-autocomplete
                  v-model="searchItems[index - 1].numWordsBefore"
                  @change="
                    searchItems.splice(index - 1, 1, searchItems[index - 1])
                  "
                  @click:clear="searchItems[index - 1].numWordsBefore = null"
                  :class="`test-numWordsBefore-${index}`"
                  :items="wordsBetween"
                  item-text="name"
                  item-value="value"
                  clearable
                  label="determine how many words between"
                ></v-autocomplete>
              </div>
              <div
                v-show="!useParse[index - 1]"
                :class="`test-autocomplete-${index} py-2`"
              >
                <h4>
                  <template v-if="index === 1">
                    <words-in-text-search-info-card></words-in-text-search-info-card> </template
                  >{{ `Search Item #${index}` }}
                </h4>
                <v-autocomplete
                  v-model="wordAndFormSelectionUuids[index - 1]"
                  :items="items"
                  item-text="wordDisplay"
                  item-value="info"
                  clearable
                  deletable-chips
                  chips
                  multiple
                  :filter="filter"
                  hide-selected
                  @change="
                    getWordForms(
                      wordAndFormSelectionUuids[index - 1],
                      index - 1
                    );
                    wordAndFormSelectionUuids[index - 1].length < 1
                      ? expand.splice(index - 1, 1, false)
                      : expand.splice(index - 1, 1, true);
                  "
                  item-color="primary"
                  :label="`word/form #${index}`"
                >
                  <template slot="append-outer">
                    <v-btn
                      class="test-autocomplete-btn-word-forms"
                      @click="updateUseParse(index - 1)"
                      >Change To Parse Properties</v-btn
                    >
                  </template>
                </v-autocomplete>
                <v-expand-transition>
                  <v-card
                    v-show="
                      wordForms && index <= numOptionsUsing && expand[index - 1]
                    "
                  >
                    <v-expansion-panels>
                      <v-expansion-panel
                        v-for="(word, i) in wordForms[index - 1]"
                        :key="`${word.name}${index}${i}`"
                      >
                        <v-expansion-panel-header>{{
                          `${word.name} -- ${
                            new Set(
                              searchItems[index - 1].uuids.filter(uuid => {
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
                                  v-model="
                                    checkboxAll[`${word.uuid}${index - 1}`]
                                  "
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
                                  v-model="searchItems[index - 1].uuids"
                                ></v-checkbox>
                              </v-list-item-action>
                            </v-list-item>
                          </v-list-item-group>
                        </v-expansion-panel-content>
                      </v-expansion-panel>
                    </v-expansion-panels>
                  </v-card>
                </v-expand-transition>
              </div>
              <div
                v-show="useParse[index - 1]"
                :class="`test-parse-tree-${index} py-2`"
              >
                <h4>
                  <template v-if="index === 1">
                    <words-in-text-search-info-card></words-in-text-search-info-card> </template
                  >{{ `Search Item #${index}` }}
                </h4>
                <div class="d-flex align-start pa-2">
                  <add-properties
                    startingUuid="7ef55f42-4cfc-446f-6d47-f83b725b34d5"
                    :disableMoveUpTree="true"
                    :hideActions="true"
                    :hideInfo="true"
                    :selectMultiple="true"
                    @export-properties="setProperties($event, index - 1)"
                  ></add-properties>
                  <span class="pt-4">
                    <v-btn
                      class="test-autocomplete-btn-parse-props"
                      @click="updateUseParse(index - 1)"
                      >Change To Word Forms</v-btn
                    >
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div class="pt-4 pb-2">
            <v-fade-transition>
              <span v-show="numOptionsUsing < maxOptions" class="pr-2">
                <v-btn
                  class="test-increase-button"
                  fab
                  color="primary"
                  x-small
                  @click="updateNumOptionsUsing(true)"
                  ><v-icon>mdi-plus</v-icon></v-btn
                ></span
              ></v-fade-transition
            >
            <v-fade-transition>
              <span v-show="numOptionsUsing !== 1">
                <v-btn
                  class="test-decrease-button"
                  fab
                  color="primary"
                  x-small
                  @click="updateNumOptionsUsing(false)"
                  ><v-icon>mdi-minus</v-icon></v-btn
                ></span
              ></v-fade-transition
            >
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
    </div>
    <div v-if="loading" class="py-8">
      <v-progress-linear indeterminate></v-progress-linear>
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
  computed,
  ComputedRef,
} from '@vue/composition-api';
import {
  WordFormAutocompleteDisplay,
  WordsInTextsSearchResultRow,
  WordsInTextsSearchResponse,
  ParseTreePropertyUuids,
  WordsInTextSearchPayloadItem,
  ParseTreeProperty,
} from '@oare/types';
import WordsInTextsSearchTable from './components/WordsInTextSearchTable.vue';
import WordsInTextSearchInfoCard from './components/WordsInTextSearchInfoCard.vue';
import useQueryParam from '@/hooks/useQueryParam';
import sl from '@/serviceLocator';
import AddProperties from '@/components/Properties/AddProperties.vue';

export interface WordForWordsInTextSearch {
  name: string;
  uuid: string;
  forms: Array<{ name: string; uuid: string }>;
}

export default defineComponent({
  name: 'WordsInTextsSearch',
  components: {
    WordsInTextsSearchTable,
    WordsInTextSearchInfoCard,
    AddProperties,
  },
  setup() {
    const items: Ref<WordFormAutocompleteDisplay[]> = ref([]);
    const searchItems: Ref<WordsInTextSearchPayloadItem[]> = ref([
      {
        uuids: [],
        type: 'form' as 'form' | 'parse',
        numWordsBefore: null,
      },
    ]);
    const loading = ref(false);
    const searchLoading = ref(false);
    const server = sl.get('serverProxy');
    const actions = sl.get('globalActions');
    const numOptionsUsing: Ref<number> = ref(1);
    const maxOptions = 5;
    const page: Ref<string> = ref(useQueryParam('page', '1', false));
    const rows: Ref<string> = ref(useQueryParam('rows', '25', true));
    const results: Ref<WordsInTextsSearchResultRow[]> = ref([]);
    const total = ref(0);
    const checkboxAll: Ref<{ [uuid: string]: boolean }> = ref({});
    const wordAndFormSelectionUuids: Ref<
      {
        uuid: string;
        wordUuid: string;
        name: string;
      }[][]
    > = ref([]);
    const expand: Ref<Boolean[]> = ref([]);
    const useParse: Ref<{ [index: number]: boolean }> = ref({});
    const wordForms: Ref<WordForWordsInTextSearch[][]> = ref([]);
    const sequenced = useQueryParam('sequenced', 'true', true);
    const mode: Ref<string> = ref(sequenced.value);

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

    const canPerformSearch = computed(() => {
      let allowSearch = true;
      for (let i = 0; i < numOptionsUsing.value; i += 1) {
        if (searchItems.value[i].uuids.length < 1) {
          allowSearch = false;
          break;
        }
        if (
          sequenced.value === 'true' &&
          !searchItems.value[i].numWordsBefore &&
          i > 0
        ) {
          allowSearch = false;
          break;
        }
      }
      return allowSearch;
    });

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
            track[j][i - 1] + 1,
            track[j - 1][i] + 1,
            track[j - 1][i - 1] + indicator
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
            items: JSON.stringify(
              searchItems.value.filter(
                (_val, index) => index < numOptionsUsing.value
              )
            ),
            page: JSON.stringify(pageNum),
            rows: JSON.stringify(rows),
            sequenced: mode.value,
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
          searchItems.value.splice(numOptionsUsing.value - 1, 1, {
            uuids: [],
            type: 'form' as 'form' | 'parse',
            numWordsBefore: null,
          });
          numOptionsUsing.value -= 1;
        }
      } catch (err) {
        actions.showErrorSnackbar(
          'error changing number of search options',
          err as Error
        );
      }
    };

    const updateUseParse = async (index: number) => {
      useParse.value = { ...useParse.value, [index]: !useParse.value[index] };
      if (searchItems.value[index].type === 'form') {
        searchItems.value[index].type = 'parse';
      } else {
        searchItems.value[index].type = 'form';
      }
      searchItems.value[index].uuids = [];
      searchItems.value.splice(index, 1, searchItems.value[index]);
      expand.value.splice(index, 1, false);
    };

    const selectAll = (val: boolean | null, index: number, idx: number) => {
      let selectedUuids: string[] = (searchItems.value[index]
        .uuids as unknown) as string[];
      wordForms.value[index][idx].forms.forEach(form => {
        if (selectedUuids.includes(form.uuid) && !val) {
          selectedUuids.splice(selectedUuids.indexOf(form.uuid), 1);
        }
        if (!selectedUuids.includes(form.uuid) && val) {
          selectedUuids.push(form.uuid);
        }
      });
      searchItems.value[index].uuids = selectedUuids;
      searchItems.value.splice(index, 1, searchItems.value[index]);
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
      searchItems.value[index].uuids = [];
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
          searchItems.value[index].uuids = [...forms.map(({ uuid }) => uuid)];
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
            let searchItemUuids: string[] = searchItems.value[index]
              .uuids as string[];
            searchItems.value[index].uuids = [
              ...searchItemUuids,
              selectedItem.uuid,
            ];
          }
        }
      });
      searchItems.value.splice(index, 1, searchItems.value[index]);
    };

    const arrangeProperties = (
      combinedProperties: ParseTreePropertyUuids[],
      prop: ParseTreePropertyUuids
    ) => {
      let currentProp: ParseTreePropertyUuids = prop;
      let parent: ParseTreePropertyUuids | undefined;
      let propArray: ParseTreePropertyUuids[] = [];
      do {
        propArray.push(currentProp);
        parent = combinedProperties.find(
          par => par.value.uuid === currentProp.variable.parentUuid
        );
        if (parent) {
          currentProp = parent;
        }
      } while (parent);
      return propArray.reverse();
    };

    const setProperties = (
      propertyList: ParseTreeProperty[],
      index: number
    ) => {
      const neededProperties: ParseTreePropertyUuids[] = propertyList.map(
        prop => ({
          variable: {
            uuid: prop.variable.uuid,
            variableName: prop.variable.variableName,
            parentUuid: prop.variable.parentUuid,
            variableUuid: prop.variable.variableUuid,
            level: prop.variable.level,
          },
          value: {
            uuid: prop.value.uuid,
            valueName: prop.value.valueName,
            parentUuid: prop.value.parentUuid,
            valueUuid: prop.value.valueUuid,
            level: prop.value.level,
          },
        })
      );
      let arrangedProperties: ParseTreePropertyUuids[][] = [];
      const parentUuids: string[] = neededProperties.map(
        prop => prop.variable.parentUuid
      );
      neededProperties.forEach(prop => {
        if (
          !parentUuids.includes(prop.value.uuid) &&
          prop.variable.variableName !== 'Primary Classification'
        ) {
          arrangedProperties.push(arrangeProperties(neededProperties, prop));
        }
      });
      searchItems.value[index].uuids = arrangedProperties;
      searchItems.value.splice(index, 1, searchItems.value[index]);
    };

    onMounted(async () => {
      loading.value = true;
      try {
        items.value = await server.getWordsAndForms();
        for (let i = 0; i < maxOptions; i += 1) {
          expand.value.push(false);
          useParse.value[i] = false;
          searchItems.value.push({
            uuids: [],
            type: 'form' as 'form' | 'parse',
            numWordsBefore: null,
          });
        }
      } catch (err) {
        actions.showErrorSnackbar(
          'Error loading words and forms. Please try again.',
          err as Error
        );
      } finally {
        loading.value = false;
      }
    });

    watch([page, rows], () => {
      if (canPerformSearch) {
        performSearch(Number(page.value), Number(rows.value), false);
      }
    });

    watch(sequenced, () => {
      mode.value = sequenced.value;
    });

    return {
      items,
      searchItems,
      useParse,
      setProperties,
      wordAndFormSelectionUuids,
      wordsBetween,
      numOptionsUsing,
      updateNumOptionsUsing,
      canPerformSearch,
      performSearch,
      selectAll,
      expand,
      wordForms,
      getWordForms,
      searchLoading,
      filter,
      headers,
      total,
      results,
      checkboxAll,
      page,
      rows,
      sequenced,
      loading,
      maxOptions,
      updateUseParse,
    };
  },
});
</script>
