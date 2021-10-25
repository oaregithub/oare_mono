<template>
  <OareContentView title="Connect Lexical Information">
    <v-row class="pa-0 ma-0">
      <v-col cols="8" class="pa-0 ma-0 mb-6">
        Select a word to connect it to the associated word form in the
        dictionary. Words that have yet to be connected are highlighted in red.
        In the case that a word only has one existing match in the dictionary,
        it has been automatically connected for you. It can be manually
        disconnected if desired.
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
            class="oare-title d-flex my-3"
          >
            <sup class="line-num pt-3 mr-2">{{ lineNumber(lineNum) }}</sup>
            <span
              v-if="renderer.isRegion(lineNum)"
              v-html="renderer.lineReading(lineNum)"
            />
            <span v-else>
              <span
                v-for="(word, index) in renderer.getLineWords(lineNum)"
                :key="index"
                v-html="displayDiscourseStatus(word)"
                class="mr-3 cursor-display"
                @click="openDiscourseDialog(word)"
              />
            </span>
          </div>
        </div>
      </div>
    </div>
    <connect-discourse-dialog
      v-if="selectedWord"
      v-model="discourseDialog"
      :word="selectedWord"
      :key="selectedWord.uuid"
      @set-spelling-uuid="setSpellingUuid(selectedWord, $event)"
    />
  </OareContentView>
</template>

<script lang="ts">
import { defineComponent, PropType, computed, ref } from '@vue/composition-api';
import { createTabletRenderer } from '@oare/oare';
import { EpigraphicUnit, TextDiscourseRow, EpigraphicWord } from '@oare/types';
import { formatLineNumber } from '@oare/oare/src/tabletUtils';
import ConnectDiscourseDialog from './components/ConnectDiscourseDialog.vue';
import sl from '@/serviceLocator';

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
  },
  components: {
    ConnectDiscourseDialog,
  },
  setup(props, { emit }) {
    const store = sl.get('store');

    const renderer = computed(() => {
      return createTabletRenderer(props.epigraphicUnits, {
        showNullDiscourse: store.getters.isAdmin,
        textFormat: 'html',
      });
    });

    const lineNumber = (line: number): string => {
      if (renderer.value.isRegion(line)) {
        return '';
      }

      const lineNumber = formatLineNumber(line);
      return lineNumber;
    };

    const displayDiscourseStatus = (word: EpigraphicWord): string | null => {
      const matchingDiscourseRow = props.discourseRows.filter(
        row => row.uuid === word.discourseUuid
      )[0];
      if (
        matchingDiscourseRow &&
        (matchingDiscourseRow.spellingUuid ||
          matchingDiscourseRow.type === 'number')
      ) {
        return word.reading;
      } else {
        return `<mark class="red">${word.reading}</mark>`;
      }
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
          spellingUuid,
        };
      });
      emit('update-discourse-rows', newDiscourseRows);
    };

    return {
      renderer,
      lineNumber,
      displayDiscourseStatus,
      openDiscourseDialog,
      discourseDialog,
      selectedWord,
      setSpellingUuid,
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
