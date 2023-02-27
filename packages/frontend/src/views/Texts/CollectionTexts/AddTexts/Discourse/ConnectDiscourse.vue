<template>
  <OareContentView title="Connect Lexical Information" :loading="loading">
    <v-row class="pa-0 ma-0">
      <v-col cols="8" class="pa-0 ma-0 mb-6">
        Select a word to connect it to the associated word form in the
        dictionary. Below each word appears a colored bubble to indicate the
        status of the connected forms. The bubble appears green with the form
        spelling inside if it has already been connected to the word. This is
        done for you automatically if there is only one possible option in the
        dictionary or when one form occurs significantly more often than other
        available options. The bubble appears yellow if there are a number of
        lexical options available for selection and none have been selected.
        Finally, the bubble appears red if there are no forms in the dictionary
        that match the provided spelling. Automatic selections can be unselected
        as needed.
      </v-col>
    </v-row>
    <div v-if="renderer" class="mr-10">
      <div v-for="side in renderer.sides" :key="side.side" class="d-flex">
        <div class="side-name oare-title mr-4">
          {{ side.side }}
        </div>
        <div>
          <div
            v-for="colNum in renderer.columnsOnSide(side.side)"
            :key="colNum"
            class="pa-1"
          >
            <div
              v-if="renderer.columnsOnSide(side.side).length > 1"
              class="oare-title mr-1 pb-1"
            >
              col. {{ romanNumeral(colNum) }}
            </div>
            <div
              v-for="lineNum in renderer.linesInColumn(colNum, side.side)"
              :key="lineNum"
              class="oare-title d-flex my-3 mb-6"
            >
              <sup class="line-num pt-3 mr-2">{{ lineNumber(lineNum) }}</sup>
              <span
                v-if="
                  renderer.isRegion(lineNum) || renderer.isUndetermined(lineNum)
                "
                v-html="renderer.lineReading(lineNum)"
              />
              <v-row v-else class="pa-0 ma-0">
                <connect-discourse-item
                  v-for="(word, index) in renderer.getLineWords(lineNum)"
                  :key="index"
                  :word="getDiscourseWord(word)"
                  :reading="word.reading"
                  class="px-1"
                  @update-spelling-uuid="setSpellingUuid(word, $event)"
                  @loading-forms="loadingForms(word)"
                  @loaded-forms="loadedForms(word)"
                />
              </v-row>
            </div>
          </div>
        </div>
      </div>
    </div>
  </OareContentView>
</template>

<script lang="ts">
import {
  defineComponent,
  PropType,
  ref,
  onMounted,
  watch,
} from '@vue/composition-api';
import { createTabletRenderer, TabletRenderer } from '@oare/oare';
import {
  EpigraphicUnit,
  TextDiscourseRow,
  EpigraphicWord,
  SearchSpellingResultRow,
  LocaleCode,
  EditorDiscourseWord,
} from '@oare/types';
import { formatLineNumber, romanNumeral } from '@oare/oare/src/tabletUtils';
import sl from '@/serviceLocator';
import i18n from '@/i18n';
import ConnectDiscourseItem from '@/views/Texts/CollectionTexts/AddTexts/Discourse/components/ConnectDiscourseItem.vue';

export default defineComponent({
  props: {
    epigraphicUnits: {
      type: Array as PropType<EpigraphicUnit[]>,
      required: true,
    },
    discourseRows: {
      type: Array as PropType<TextDiscourseRow[]>,
      required: true,
    },
    manualDiscourseSelections: {
      type: Array as PropType<string[]>,
      required: true,
    },
  },
  components: {
    ConnectDiscourseItem,
  },
  setup(props, { emit }) {
    const store = sl.get('store');
    const server = sl.get('serverProxy');
    const actions = sl.get('globalActions');

    const loading = ref(false);

    const renderer = ref<TabletRenderer>(
      createTabletRenderer(props.epigraphicUnits, i18n.locale as LocaleCode, {
        showNullDiscourse: store.getters.isAdmin,
        textFormat: 'html',
      })
    );

    const lineNumber = (line: number): string => {
      if (
        renderer.value.isRegion(line) ||
        renderer.value.isUndetermined(line)
      ) {
        return '';
      }
      const lineNumber = formatLineNumber(line);
      return lineNumber;
    };

    const setSpellingUuid = (
      word: EpigraphicWord,
      spellingUuid: string | undefined
    ) => {
      const newDiscourseRows = props.discourseRows.map(row => {
        if (row.uuid !== word.discourseUuid) {
          return row;
        }
        return {
          ...row,
          spellingUuid: spellingUuid || null,
        };
      });
      emit('update-discourse-rows', newDiscourseRows);
      emit('update-manual-selections', word.discourseUuid);
    };

    const searchSpellingResults = ref<{
      [key: string]: SearchSpellingResultRow[];
    }>({});

    onMounted(async () => {
      try {
        loading.value = true;
        const discourseRowsWithSpelling = props.discourseRows.filter(
          row => row.explicitSpelling
        );
        const forms = await Promise.all(
          discourseRowsWithSpelling.map(row =>
            server.searchSpellings(row.explicitSpelling || '')
          )
        );

        discourseRowsWithSpelling.map((row, idx) => {
          searchSpellingResults.value[row.uuid] = forms[idx];
        });
      } catch (err) {
        actions.showErrorSnackbar(
          'Error loading discourse forms. Please try again.',
          err as Error
        );
      } finally {
        loading.value = false;
      }
    });

    const getSelectedForm = (discourseUuid: string) => {
      const spellingUuid = props.discourseRows.filter(
        row => row.uuid === discourseUuid
      )[0].spellingUuid;
      if (!spellingUuid) {
        return '--';
      }

      const discourseForms = searchSpellingResults.value[discourseUuid];
      if (!discourseForms) {
        return '--';
      }

      const relevantForm = discourseForms.filter(
        form => form.spellingUuid === spellingUuid
      )[0].form.form;
      return relevantForm;
    };

    const getColor = (discourseUuid: string | null) => {
      if (!discourseUuid) {
        return 'red';
      }
      const spellingUuid = props.discourseRows.filter(
        row => row.uuid === discourseUuid
      )[0].spellingUuid;
      if (spellingUuid) {
        if (
          props.manualDiscourseSelections.includes(discourseUuid) ||
          (searchSpellingResults.value[discourseUuid] &&
            searchSpellingResults.value[discourseUuid].length === 1)
        ) {
          return 'green';
        }
      }

      const discourseForms = searchSpellingResults.value[discourseUuid];
      if (!discourseForms || discourseForms.length === 0) {
        return 'red';
      }

      return 'yellow';
    };

    const isNumber = (discourseUuid: string) => {
      const discourseRow = props.discourseRows.filter(
        row => row.uuid === discourseUuid
      )[0];
      return discourseRow.type === 'number';
    };

    const isUndetermined = (reading: string) => {
      return reading.includes('...') || reading.match(/x+/);
    };

    const isSeparator = (reading: string) => {
      return reading === '|';
    };

    const getDiscourseWord = (word: EpigraphicWord): EditorDiscourseWord => {
      return {
        discourseUuid: word.discourseUuid,
        spelling:
          props.discourseRows.filter(row => row.uuid === word.discourseUuid)
            .length > 0
            ? props.discourseRows.filter(
                row => row.uuid === word.discourseUuid
              )[0].explicitSpelling || ''
            : '',
        type: word.signs.every(sign => sign.epigType === 'number')
          ? 'number'
          : 'word',
      };
    };

    const formsLoading = ref<string[]>([]);
    const loadingForms = (word: EpigraphicWord) => {
      if (word.discourseUuid) {
        formsLoading.value = formsLoading.value.filter(
          uuid => uuid != word.discourseUuid
        );
        formsLoading.value = [...formsLoading.value, word.discourseUuid];
      }
    };
    const loadedForms = (word: EpigraphicWord) => {
      formsLoading.value = formsLoading.value.filter(
        uuid => uuid != word.discourseUuid
      );
    };
    watch(formsLoading, () => {
      if (formsLoading.value.length === 0) {
        emit('step-complete', true);
      } else {
      }
    });

    return {
      renderer,
      lineNumber,
      setSpellingUuid,
      loading,
      searchSpellingResults,
      getSelectedForm,
      getColor,
      isNumber,
      isUndetermined,
      isSeparator,
      romanNumeral,
      getDiscourseWord,
      formsLoading,
      loadingForms,
      loadedForms,
    };
  },
});
</script>

<style scoped>
.line-num {
  width: 25px;
}

.side-name {
  width: 50px;
}

.cursor-display {
  cursor: pointer;
}
</style>
