<template>
  <OareContentView title="Connect Lexical Information" :loading="loading">
    <v-row class="pa-0 ma-0">
      <v-col cols="8" class="pa-0 ma-0 mb-6">
        Select a word to connect it to the associated word form in the
        dictionary. Below each word appears a colored bubble to indicate the
        status of the connected forms. The bubble appears green with the form
        spelling inside if it has already been connected to the word. This is
        done for you automatically if there is only one possible option in the
        dictionary (though it can be disconnected if desired). The bubble
        appears yellow if there are a number of lexical options available for
        selection. In some instances, a yellow bubble will show a form spelling
        selected automatically. When this occurs, the selected form was
        automatically selected for you due to its common occurrence in other
        texts, but can be adjusted if necessary. Finally, the bubble appears red
        if there are no forms in the dictionary that match the provided
        spelling.
      </v-col>
    </v-row>
    <div v-if="renderer" class="mr-10">
      <div v-for="sideName in renderer.sides" :key="sideName" class="d-flex">
        <div class="side-name oare-title mr-4">
          {{ sideName }}
        </div>
        <div>
          <div
            v-for="lineNum in renderer.linesOnSide(sideName)"
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
              <div
                v-for="(word, index) in renderer.getLineWords(lineNum)"
                :key="index"
                class="px-1 cursor-display d-inline-block"
                @click="openDiscourseDialog(word)"
              >
                <v-row class="pa-0 ma-0" justify="center">
                  <span v-html="word.reading" />
                </v-row>
                <v-row
                  class="pa-0 text-body-2 ma-0 grey--text"
                  justify="center"
                >
                  <v-chip
                    v-if="
                      word.discourseUuid
                        ? !isNumber(word.discourseUuid) &&
                          !isUndetermined(word.reading || '') &&
                          !isSeparator(word.reading || '')
                        : false
                    "
                    :color="getColor(word.discourseUuid)"
                    small
                    >{{
                      word.discourseUuid
                        ? getSelectedForm(word.discourseUuid)
                        : '--'
                    }}</v-chip
                  >
                </v-row>
              </div>
            </v-row>
          </div>
        </div>
      </div>
    </div>
    <connect-discourse-dialog
      v-if="selectedWord"
      v-model="discourseDialog"
      :word="selectedWord"
      :forms="searchSpellingResults[selectedWord.uuid]"
      :key="selectedWord.uuid"
      @set-spelling-uuid="setSpellingUuid(selectedWord, $event)"
    />
  </OareContentView>
</template>

<script lang="ts">
import {
  defineComponent,
  PropType,
  ref,
  onMounted,
} from '@vue/composition-api';
import { createTabletRenderer, TabletRenderer } from '@oare/oare';
import {
  EpigraphicUnit,
  TextDiscourseRow,
  EpigraphicWord,
  SearchSpellingResultRow,
  LocaleCode,
} from '@oare/types';
import { formatLineNumber } from '@oare/oare/src/tabletUtils';
import ConnectDiscourseDialog from './components/ConnectDiscourseDialog.vue';
import sl from '@/serviceLocator';
import i18n from '@/i18n';

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
    ConnectDiscourseDialog,
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

    const selectedWord = ref<TextDiscourseRow>();
    const discourseDialog = ref(false);
    const openDiscourseDialog = (word: EpigraphicWord) => {
      const discourseRow = props.discourseRows.filter(
        row => row.uuid === word.discourseUuid
      )[0];
      selectedWord.value = discourseRow;
      discourseDialog.value = true;
    };

    const setSpellingUuid = (
      word: TextDiscourseRow | undefined,
      spellingUuid: string | undefined
    ) => {
      const newDiscourseRows = props.discourseRows.map(row => {
        if (row !== word) {
          return row;
        }
        return {
          ...row,
          spellingUuid: spellingUuid || null,
        };
      });
      emit('update-discourse-rows', newDiscourseRows);
      if (word) {
        emit('update-manual-selections', word.uuid);
      }
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

    return {
      renderer,
      lineNumber,
      openDiscourseDialog,
      discourseDialog,
      selectedWord,
      setSpellingUuid,
      loading,
      searchSpellingResults,
      getSelectedForm,
      getColor,
      isNumber,
      isUndetermined,
      isSeparator,
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
