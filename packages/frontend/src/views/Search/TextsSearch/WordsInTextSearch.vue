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
                :class="`test-combobox-${index} py-2`"
              >
                <h4>
                  <template v-if="index === 1">
                    <words-in-text-search-info-card></words-in-text-search-info-card> </template
                  >{{ `Search Item #${index}` }}
                </h4>
                <v-combobox
                  v-model="dictItemSelectionUuids[index - 1]"
                  :items="getComboboxItems(index)"
                  item-text="name"
                  return-object
                  clearable
                  deletable-chips
                  chips
                  multiple
                  no-filter
                  hide-selected
                  :search-input.sync="queryText[`queryText${index}`]"
                  @change="updateCombobox(index)"
                  @blur="queryText[`queryText${index}`] = null"
                  @focus="setActiveIndex(index)"
                  item-color="primary"
                  :label="`word/form/spelling/person #${index}`"
                  :rules="[rules]"
                >
                  <template v-slot:selection="data">
                    <v-chip close @click:close="removeChip(data.item, index)">
                      <words-in-text-search-combobox-item
                        v-if="typeof data.item === 'object'"
                        :item="data.item"
                        :key="`${data.item.uuid}-${index}-chip`"
                      />
                      <span v-else>{{ data.item }}</span>
                    </v-chip>
                  </template>
                  <template #item="{ attrs, item, on }">
                    <words-in-text-search-combobox-item
                      :key="`${item.uuid}-${index}-select`"
                      v-bind="attrs"
                      v-on="on"
                      :item="item"
                    />
                  </template>
                  <template slot="append-outer">
                    <span class="mr-2">
                      <v-btn
                        class="test-combobox-btn-any-number"
                        @click="addAnyNumber(index)"
                        >Any Number</v-btn
                      >
                    </span>
                    <span>
                      <v-btn
                        class="test-combobox-btn-word-forms"
                        color="primary"
                        @click="updateUseParse(index - 1)"
                        >Change To Parse Properties</v-btn
                      >
                    </span>
                  </template>
                </v-combobox>
                <v-expand-transition>
                  <v-card
                    v-show="
                      dictItems && index <= numOptionsUsing && expand[index - 1]
                    "
                  >
                    <v-expansion-panels>
                      <v-expansion-panel
                        v-for="(dictItem, i) in dictItems[index - 1]"
                        :key="`${dictItem.name}${index}${i}`"
                      >
                        <v-expansion-panel-header>{{
                          `${dictItem.name} -- ${getNumDictItemsSelected(
                            index - 1,
                            dictItem
                          )}/${dictItem.childDictItems.length} ${
                            dictItem.childDictItems[0].type === 'form'
                              ? 'form'
                              : `${
                                  dictItem.childDictItems[0].type === 'number'
                                    ? 'number'
                                    : `${
                                        dictItem.childDictItems[0].type ===
                                        'person'
                                          ? 'person'
                                          : 'spelling'
                                      }`
                                }`
                          }${
                            dictItem.childDictItems.length > 1 ? 's' : ''
                          } selected`
                        }}</v-expansion-panel-header>
                        <v-expansion-panel-content>
                          <v-list-item-group>
                            <v-list-item
                              ><v-list-item-action
                                ><v-checkbox
                                  @click="
                                    selectAll(
                                      checkboxAll[
                                        `${dictItem.uuid}${index - 1}`
                                      ],
                                      index - 1,
                                      i
                                    )
                                  "
                                  v-model="
                                    checkboxAll[`${dictItem.uuid}${index - 1}`]
                                  "
                                  label="Select All"
                                ></v-checkbox
                              ></v-list-item-action>
                            </v-list-item>
                            <v-list-item
                              v-for="(
                                childDictItem, j
                              ) in dictItem.childDictItems"
                              :key="`${childDictItem.uuid}${index}${i}${j}`"
                            >
                              <v-list-item-action>
                                <v-checkbox
                                  :label="childDictItem.name"
                                  :value="childDictItem.uuid"
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
                      class="test-combobox-btn-parse-props"
                      @click="updateUseParse(index - 1)"
                      >Change To Words, Forms, and Spellings</v-btn
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
          <div class="pt-4 pb-2">
            <v-select
              v-model="sortBy"
              :items="sortByItems"
              item-text="text"
              item-value="value"
              label="Sort Results By"
            ></v-select>
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
          color="primary"
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
  reactive,
} from '@vue/composition-api';
import {
  DictItemComboboxDisplay,
  WordsInTextsSearchResultRow,
  WordsInTextsSearchResponse,
  ParseTreePropertyUuids,
  WordsInTextSearchPayloadItem,
  ParseTreeProperty,
  ChildDictItem,
} from '@oare/types';
import WordsInTextsSearchTable from './components/WordsInTextSearchTable.vue';
import WordsInTextSearchInfoCard from './components/WordsInTextSearchInfoCard.vue';
import useQueryParam from '@/hooks/useQueryParam';
import sl from '@/serviceLocator';
import AddProperties from '@/components/Properties/AddProperties.vue';
import WordsInTextSearchComboboxItem from './components/WordsInTextSearchComboboxItem.vue';
import _ from 'lodash';
import WordGrammar from '@/views/DictionaryWord/components/WordInfo/components/WordGrammar/WordGrammar.vue';

export interface DictItemWordsInTextSearch {
  name: string;
  uuid: string;
  childDictItems: ChildDictItem[];
}

export default defineComponent({
  name: 'WordsInTextsSearch',
  components: {
    WordsInTextsSearchTable,
    WordsInTextSearchInfoCard,
    AddProperties,
    WordsInTextSearchComboboxItem,
    WordGrammar,
  },
  setup() {
    const items: Ref<DictItemComboboxDisplay[]> = ref([]);
    const filteredItems: Ref<DictItemComboboxDisplay[]> = ref([]);
    const searchItems: Ref<WordsInTextSearchPayloadItem[]> = ref([
      {
        uuids: [],
        type: 'form/spelling/number' as 'form/spelling/number' | 'parse',
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
    const dictItemSelectionUuids: Ref<DictItemComboboxDisplay[][]> = ref([]);
    const expand: Ref<Boolean[]> = ref([]);
    const useParse: Ref<{ [index: number]: boolean }> = ref({});
    const dictItems: Ref<DictItemWordsInTextSearch[][]> = ref([]);
    const sequenced = useQueryParam('sequenced', 'true', true);
    const mode: Ref<string> = ref(sequenced.value);
    const meetsRules: Ref<boolean> = ref(true);
    const queryText: { [key: string]: string | null } = reactive({
      ['queryText1']: '',
      ['queryText2']: '',
      ['queryText3']: '',
      ['queryText4']: '',
      ['queryText5']: '',
    });
    const activeIndex = ref(0);
    const numberRegex = new RegExp('^[+-]?([0-9]+([.][0-9]*)?|[.][0-9]+)$');

    const wordsBetween = ref([
      { name: '0', value: 0 },
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

    const sortByItems = ref([
      {
        text: 'Text Name Only',
        value: 'textNameOnly',
      },
      {
        text: 'Word Preceding First Word Match',
        value: 'precedingFirstMatch',
      },
      {
        text: 'Word Following Last Word Match',
        value: 'followingLastMatch',
      },
      { text: 'Ascending Numbers', value: 'ascendingNum' },
      { text: 'Descending Numbers', value: 'descendingNum' },
    ]);

    const sortBy: Ref<string> = ref(sortByItems.value[0].value);

    const checkComboboxEntry = (item: any): boolean => {
      if (item && typeof item === 'object' && Object.keys(item).length === 8) {
        return true;
      }
      return false;
    };

    const rules = (items: any[]): boolean => {
      meetsRules.value = true;
      items.forEach(item => {
        if (!numberRegex.test(item) && !checkComboboxEntry(item)) {
          meetsRules.value = false;
        }
      });
      return meetsRules.value;
    };

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
          searchItems.value[i].numWordsBefore !== 0 &&
          i > 0
        ) {
          allowSearch = false;
          break;
        }
      }
      if (!meetsRules.value) {
        allowSearch = false;
      }
      return allowSearch;
    });

    const filterItems = async (
      itemsToFilter: DictItemComboboxDisplay[],
      queryText: string
    ) => {
      const itemsToReturn = itemsToFilter.filter(item => {
        let itemTextClean = item.name.toLocaleLowerCase();
        const queryTextClean = queryText.toLocaleLowerCase();
        if (
          itemTextClean.includes(queryTextClean) &&
          Math.abs(itemTextClean.length - queryTextClean.length) < 3
        ) {
          return item;
        }
        // const track = Array(itemTextClean.length + 1)
        //   .fill(null)
        //   .map(() => Array(queryTextClean.length + 1).fill(null));
        // for (let i = 0; i <= queryTextClean.length; i += 1) {
        //   track[0][i] = i;
        // }
        // for (let j = 0; j <= itemTextClean.length; j += 1) {
        //   track[j][0] = j;
        // }
        // for (let j = 1; j <= itemTextClean.length; j += 1) {
        //   for (let i = 1; i <= queryTextClean.length; i += 1) {
        //     const indicator =
        //       queryTextClean[i - 1] === itemTextClean[j - 1] ? 0 : 1;
        //     track[j][i] = Math.min(
        //       track[j][i - 1] + 1,
        //       track[j - 1][i] + 1,
        //       track[j - 1][i - 1] + indicator
        //     );
        //   }
        // }
        // if (track[itemTextClean.length][queryTextClean.length] < 3) {
        //   return item;
        // }
      });
      return itemsToReturn;
    };

    const sortItems = async (
      itemsToSort: DictItemComboboxDisplay[],
      queryText: string
    ) => {
      const itemsToReturn = itemsToSort.sort(
        (a: DictItemComboboxDisplay, b: DictItemComboboxDisplay) => {
          const aName = a.name.toLocaleLowerCase();
          const bName = b.name.toLocaleLowerCase();
          const cleanQueryText = queryText.toLocaleLowerCase();
          if (aName === cleanQueryText) {
            return -1;
          }
          if (bName === cleanQueryText) {
            return 1;
          }
          return aName.localeCompare(bName);
        }
      );
      return itemsToReturn;
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
            sortBy: sortBy.value as
              | 'precedingFirstMatch'
              | 'followingLastMatch'
              | 'textNameOnly'
              | 'ascendingNum'
              | 'descendingNum',
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

    const setActiveIndex = (index: number) => {
      activeIndex.value = index;
    };

    const updateCombobox = (index: number) => {
      getDictItems(dictItemSelectionUuids.value[index - 1], index - 1);
      dictItemSelectionUuids.value[index - 1].length < 1
        ? expand.value.splice(index - 1, 1, false)
        : expand.value.splice(index - 1, 1, true);
    };

    const updateNumOptionsUsing = async (increase: boolean) => {
      try {
        if (numOptionsUsing.value < maxOptions && increase) {
          numOptionsUsing.value += 1;
        }
        if (numOptionsUsing.value > 1 && !increase) {
          searchItems.value.splice(numOptionsUsing.value - 1, 1, {
            uuids: [],
            type: 'form/spelling/number' as 'form/spelling/number' | 'parse',
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
      if (searchItems.value[index].type === 'form/spelling/number') {
        searchItems.value[index].type = 'parse';
      } else {
        searchItems.value[index].type = 'form/spelling/number';
      }
      searchItems.value[index].uuids = [];
      searchItems.value.splice(index, 1, searchItems.value[index]);
      expand.value.splice(index, 1, false);
    };

    const addAnyNumber = (index: number) => {
      if (!dictItemSelectionUuids.value[index - 1]) {
        dictItemSelectionUuids.value[index - 1] = [];
        dictItemSelectionUuids.value.splice(1, 1, []);
      }
      dictItemSelectionUuids.value[index - 1].push({
        uuid: '-1',
        referenceUuid: '-1',
        name: 'Any Number',
        wordName: 'Any Number',
        wordUuid: '-1',
        translations: null,
        formInfo: null,
        type: 'number',
      });
      dictItemSelectionUuids.value[index - 1].splice(-1, 1, {
        uuid: '-1',
        referenceUuid: '-1',
        name: 'Any Number',
        wordName: 'Any Number',
        wordUuid: '-1',
        translations: null,
        formInfo: null,
        type: 'number',
      });
      updateCombobox(index);
    };

    const removeChip = (item: DictItemComboboxDisplay, idx: number) => {
      const index = dictItemSelectionUuids.value[idx - 1].indexOf(item);
      if (index >= 0) {
        dictItemSelectionUuids.value[idx - 1].splice(index, 1);
      }
      updateCombobox(idx);
    };

    const selectAll = (val: boolean | null, index: number, idx: number) => {
      let selectedUuids: string[] = (searchItems.value[index]
        .uuids as unknown) as string[];
      dictItems.value[index][idx].childDictItems.forEach(childDictItem => {
        if (selectedUuids.includes(childDictItem.uuid) && !val) {
          selectedUuids.splice(selectedUuids.indexOf(childDictItem.uuid), 1);
        }
        if (!selectedUuids.includes(childDictItem.uuid) && val) {
          selectedUuids.push(childDictItem.uuid);
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
        const selectionUuids: string[] = dictItemSelectionUuids.value[
          index
        ].map(({ uuid }) => uuid);
        if (position === index && !selectionUuids.includes(uuid)) {
          dict[uuidKey] = false;
        }
      });
    };

    const getComboboxItems = (index: number) => {
      if (
        dictItemSelectionUuids.value[index - 1] &&
        dictItemSelectionUuids.value[index - 1].length > 0
      ) {
        return [
          ...filteredItems.value.slice(0, 50),
          ...dictItemSelectionUuids.value[index - 1],
        ];
      }
      return filteredItems.value.slice(0, 50);
    };

    const getDictItems = async (
      selectedItems: (DictItemComboboxDisplay | string)[],
      index: number
    ) => {
      dictItems.value[index] = [];
      searchItems.value[index].uuids = [];
      markSelectAllFalseOnRemoval(checkboxAll.value, index);
      selectedItems.map(async selectedItem => {
        if (typeof selectedItem !== 'object') {
          const dictItemWordsInTextSearch: DictItemWordsInTextSearch = {
            name: selectedItem,
            uuid: selectedItem,
            childDictItems: [
              {
                uuid: selectedItem,
                name: selectedItem,
                type: 'number' as 'form' | 'spelling' | 'number' | 'person',
              },
            ],
          };
          dictItems.value[index].push(dictItemWordsInTextSearch);
          searchItems.value[index].uuids = [
            ...(searchItems.value[index].uuids as string[]),
            selectedItem,
          ];
        } else if (selectedItem.type === 'number') {
          const dictItemWordsInTextSearch: DictItemWordsInTextSearch = {
            name: selectedItem.name,
            uuid: selectedItem.uuid,
            childDictItems: [
              {
                uuid: selectedItem.uuid,
                name: selectedItem.name,
                type: 'number' as 'form' | 'spelling' | 'number',
              },
            ],
          };
          dictItems.value[index].push(dictItemWordsInTextSearch);
          searchItems.value[index].uuids = [
            ...(searchItems.value[index].uuids as string[]),
            selectedItem.uuid,
          ];
        } else if (selectedItem.type === 'person') {
          const childDictItems: ChildDictItem[] = await server.getPersonsByNameUuid(
            selectedItem.uuid
          );
          const dictItemWordsInTextSearch: DictItemWordsInTextSearch = {
            name: selectedItem.name,
            uuid: selectedItem.uuid,
            childDictItems,
          };
          dictItems.value[index].push(dictItemWordsInTextSearch);
          searchItems.value[index].uuids = [
            ...(searchItems.value[index].uuids as string[]),
            ...childDictItems.map(({ uuid }) => uuid),
          ];
        } else if (
          selectedItem.uuid === selectedItem.referenceUuid &&
          selectedItem.type === 'word'
        ) {
          const childDictItems: ChildDictItem[] = items.value
            .filter(item => {
              if (
                item.referenceUuid === selectedItem.uuid &&
                item.uuid !== item.referenceUuid
              ) {
                return item.uuid;
              }
            })
            .map(item => {
              return {
                uuid: item.uuid,
                name: item.name,
                type: item.type as 'form' | 'spelling' | 'number',
              };
            });
          const dictItemWordsInTextSearch: DictItemWordsInTextSearch = {
            name: selectedItem.name,
            uuid: selectedItem.uuid,
            childDictItems,
          };
          dictItems.value[index].push(dictItemWordsInTextSearch);
          searchItems.value[index].uuids = [
            ...(searchItems.value[index].uuids as string[]),
            ...childDictItems.map(({ uuid }) => uuid),
          ];
        } else {
          const parentDictItem = items.value.find(item => {
            if (item.uuid === selectedItem.referenceUuid) return item;
          });
          const childDictItemSiblings: ChildDictItem[] = items.value
            .filter(item => {
              if (
                item.referenceUuid === selectedItem.referenceUuid &&
                item.referenceUuid !== item.uuid
              )
                return item;
            })
            .map(item => {
              return {
                uuid: item.uuid,
                name: item.name,
                type: item.type as 'form' | 'spelling' | 'number',
              };
            });
          if (parentDictItem) {
            const dictItemWordsInTextSearch: DictItemWordsInTextSearch = {
              name: parentDictItem.name,
              uuid: parentDictItem.uuid,
              childDictItems: childDictItemSiblings,
            };
            dictItems.value[index].push(dictItemWordsInTextSearch);
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

    const getNumDictItemsSelected = (
      index: number,
      dictItem: DictItemWordsInTextSearch
    ): number => {
      return new Set(
        (searchItems.value[index].uuids as string[]).filter(uuid => {
          return dictItem.childDictItems
            .map(childDictItem => childDictItem.uuid)
            .includes(uuid);
        })
      ).size;
    };

    watch(
      queryText,
      _.debounce(async () => {
        if (queryText[`queryText${activeIndex.value}`]) {
          filteredItems.value = await filterItems(
            items.value,
            queryText[`queryText${activeIndex.value}`]!!
          );

          filteredItems.value = await sortItems(
            filteredItems.value,
            queryText[`queryText${activeIndex.value}`]!!
          );
        } else {
          filteredItems.value = items.value;
        }
      }, 1000)
    );

    onMounted(async () => {
      loading.value = true;
      try {
        items.value = await server.getDictItems();
        filteredItems.value = items.value;
        for (let i = 0; i < maxOptions; i += 1) {
          expand.value.push(false);
          useParse.value[i] = false;
          searchItems.value.push({
            uuids: [],
            type: 'form/spelling/number' as 'form/spelling/number' | 'parse',
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
      filteredItems,
      activeIndex,
      searchItems,
      sortByItems,
      sortBy,
      useParse,
      setProperties,
      dictItemSelectionUuids,
      wordsBetween,
      numOptionsUsing,
      updateNumOptionsUsing,
      updateCombobox,
      canPerformSearch,
      performSearch,
      selectAll,
      expand,
      dictItems,
      getDictItems,
      getNumDictItemsSelected,
      getComboboxItems,
      searchLoading,
      headers,
      total,
      results,
      checkboxAll,
      page,
      rows,
      sequenced,
      queryText,
      loading,
      maxOptions,
      updateUseParse,
      setActiveIndex,
      removeChip,
      rules,
      addAnyNumber,
    };
  },
});
</script>
