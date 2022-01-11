<template>
  <div v-if="renderer" class="mr-10">
    <div v-for="sideName in renderer.sides" :key="sideName" class="d-flex">
      <div class="side-name oare-title mr-4">
        {{ sideName }}
      </div>
      <div>
        <div v-if="renderer.columnsOnSide(sideName) < 1">
          <div
            v-for="lineNum in renderer.linesOnSide(sideName)"
            :key="lineNum"
            class="oare-title d-flex"
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
                v-html="formatWord(word)"
                class="cursor-display test-rendered-word"
                :class="{ 'mr-1': !word.isContraction }"
                @click="openDialog(word.discourseUuid)"
              />
            </span>
          </div>
        </div>
        <div v-else>
          <div v-for="colNum in renderer.columnsOnSide(sideName)" :key="colNum" class="column-display">
            <div v-if="colNum == 0" class="oare-title mr-1">
              column: {{ colNum + 1}}  
            </div>
            <div v-else class="oare-title mr-1">
              column: {{ colNum }}
            </div>
            <div
              v-for="lineNum in renderer.linesInColumn(colNum)"
              :key="lineNum"
              class="oare-title d-flex"
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
                  v-html="formatWord(word)"
                  class="cursor-display test-rendered-word"
                  :class="{ 'mr-1': !word.isContraction }"
                  @click="openDialog(word.discourseUuid)"
                />
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <oare-dialog
      v-if="viewingDialog"
      class="test-rendering-word-dialog"
      :closeButton="true"
      :persistent="false"
      :show-cancel="false"
      :show-submit="false"
      :submitLoading="loading"
      :width="600"
      v-model="viewingDialog"
    >
      <dictionary-word
        v-if="discourseWordInfo"
        :uuid="discourseWordInfo.uuid"
        :selected-word-info="discourseWordInfo"
        :allow-commenting="false"
        :allow-editing="false"
        :allow-deleting="false"
        :allow-breadcrumbs="false"
      >
      </dictionary-word>
    </oare-dialog>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, computed, ref } from '@vue/composition-api';
import { createTabletRenderer } from '@oare/oare';
import {
  Word,
  EpigraphicUnit,
  EpigraphicWord,
  TextDiscourseRow,
} from '@oare/types';
import sl from '@/serviceLocator';
import DictionaryWord from '@/components/DictionaryDisplay/DictionaryWord/index.vue';
import { formatLineNumber } from '@oare/oare/src/tabletUtils';

export default defineComponent({
  name: 'EpigraphyReading',
  components: {
    DictionaryWord,
  },
  props: {
    epigraphicUnits: {
      type: Array as PropType<EpigraphicUnit[]>,
      required: true,
    },
    discourseToHighlight: {
      type: String,
      required: false,
    },
    localDiscourseInfo: {
      type: Array as PropType<TextDiscourseRow[]>,
      required: false,
    },
  },
  setup(props) {
    const store = sl.get('store');
    const server = sl.get('serverProxy');
    const actions = sl.get('globalActions');
    const loading = ref(false);
    const viewingDialog = ref(false);
    const discourseWordInfo = ref<Word | null>(null);

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

    const openDialog = async (discourseUuid: string | null) => {
      try {
        loading.value = true;
        actions.showSnackbar('Fetching discourse information...');

        const spellingUuid = props.localDiscourseInfo
          ? props.localDiscourseInfo.filter(
              row => row.uuid === discourseUuid
            )[0].spellingUuid
          : null;

        if (discourseUuid && !props.localDiscourseInfo) {
          discourseWordInfo.value =
            await server.getDictionaryInfoByDiscourseUuid(discourseUuid);
        } else if (spellingUuid && props.localDiscourseInfo) {
          discourseWordInfo.value =
            await server.getDictionaryInfoBySpellingUuid(spellingUuid);
        } else {
          discourseWordInfo.value = null;
        }

        actions.closeSnackbar();
        if (discourseWordInfo.value) {
          viewingDialog.value = true;
        } else {
          actions.showSnackbar(
            'No information exists for this text discourse word'
          );
        }
      } catch (err) {
        actions.showErrorSnackbar(
          'Failed to retrieve text discourse word info',
          err as Error
        );
      } finally {
        loading.value = false;
      }
    };

    const formatWord = (word: EpigraphicWord) => {
      const isWordToHighlight =
        props.discourseToHighlight && word.discourseUuid
          ? props.discourseToHighlight.includes(word.discourseUuid)
          : false;
      return isWordToHighlight ? `<mark>${word.reading}</mark>` : word.reading;
    };

    return {
      renderer,
      lineNumber,
      openDialog,
      loading,
      discourseWordInfo,
      viewingDialog,
      formatWord,
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

.column-display {
  padding-bottom: 10px;
}

.cursor-display {
  cursor: pointer;
}
</style>
