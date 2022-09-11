<template>
  <div v-if="renderer" class="mr-10">
    <div v-for="sideName in renderer.sides" :key="sideName" class="d-flex">
      <div class="side-name oare-title mr-4" v-html="formatSide(sideName)" />
      <div>
        <div v-if="renderer.columnsOnSide(sideName).length === 1">
          <div
            v-for="lineNum in renderer.linesOnSide(sideName)"
            :key="lineNum"
            class="oare-title d-flex"
          >
            <sup class="line-num pt-3 mr-2">{{ lineNumber(lineNum) }}</sup>
            <span
              v-if="
                renderer.isRegion(lineNum) || renderer.isUndetermined(lineNum)
              "
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
          <div
            v-for="colNum in renderer.columnsOnSide(sideName)"
            :key="colNum"
            class="pa-1"
          >
            <div class="oare-title mr-1 pb-1">
              col. {{ romanNumeral(colNum) }}
            </div>
            <div
              v-for="lineNum in renderer.linesInColumn(colNum, sideName)"
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
    <connect-spelling-occurrence
      v-if="viewingConnectSpellingDialog"
      :key="`${connectSpellingDialogSpelling}-${connectSpellingDialogDiscourseUuid}`"
      class="test-spelling-occurrence-display"
      :discourseUuid="connectSpellingDialogDiscourseUuid"
      :spelling="connectSpellingDialogSpelling"
      :searchSpellings="server.searchSpellings"
      :getTexts="server.getSpellingTextOccurrences"
      @finish="closeConnectSpellingDialog"
      v-model="viewingConnectSpellingDialog"
    ></connect-spelling-occurrence>
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
      <v-row class="ma-0">
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
      </v-row>
      <v-row class="ma-0">
        <v-btn
          color="primary"
          v-if="canDisconnectSpellings"
          @click="confirmDisconnectDialog = true"
        >
          Disconnect Spelling
        </v-btn>
      </v-row>
    </oare-dialog>
    <oare-dialog
      v-model="confirmDisconnectDialog"
      title="Confirm Disconnect"
      submitText="Yes"
      cancelText="Cancel"
      @click="disconnectSpelling(selectedDiscourseUuid)"
      closeOnSubmit
    >
      Are you sure you want to disconnect this word from the dictionary?
    </oare-dialog>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, PropType, ref } from '@vue/composition-api';
import { createTabletRenderer, TabletRenderer } from '@oare/oare';
import {
  Word,
  EpigraphicUnit,
  EpigraphicWord,
  TextDiscourseRow,
  EpigraphicUnitSide,
} from '@oare/types';
import sl from '@/serviceLocator';
import DictionaryWord from '@/components/DictionaryDisplay/DictionaryWord/index.vue';
import ConnectSpellingOccurrence from './ConnectSpellingOccurrence.vue';
import { formatLineNumber, romanNumeral } from '@oare/oare/src/tabletUtils';

export default defineComponent({
  name: 'EpigraphyReading',
  components: {
    DictionaryWord,
    ConnectSpellingOccurrence,
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
    const viewingConnectSpellingDialog = ref(false);
    const connectSpellingDialogSpelling = ref('');
    const connectSpellingDialogDiscourseUuid = ref('');
    const discourseWordInfo = ref<Word | null>(null);

    const canConnectSpellings = computed(() =>
      store.hasPermission('CONNECT_SPELLING')
    );

    const canDisconnectSpellings = computed(() =>
      store.hasPermission('DISCONNECT_SPELLING')
    );

    const selectedDiscourseUuid = ref<any>('');

    const confirmDisconnectDialog = ref(false);

    async function disconnectSpelling(): Promise<void> {
      try {
        if (selectedDiscourseUuid.value) {
          await server.disconnectSpellings([selectedDiscourseUuid]);
          viewingDialog.value = false;
          actions.showSnackbar('Spelling successfully disconnected.');
        }
      } catch (err) {
        actions.showErrorSnackbar(
          'Error disconnecting spelling. Please try again.',
          err as Error
        );
      }
    }

    const renderer = ref<TabletRenderer>(
      createTabletRenderer(props.epigraphicUnits, {
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

    const openDialog = async (discourseUuid: string | null) => {
      try {
        loading.value = true;
        actions.showSnackbar('Fetching discourse information...');
        selectedDiscourseUuid.value = discourseUuid;

        const spellingUuid = props.localDiscourseInfo
          ? props.localDiscourseInfo.filter(
              row => row.uuid === discourseUuid
            )[0].spellingUuid
          : null;

        if (discourseUuid && !props.localDiscourseInfo) {
          discourseWordInfo.value = await server.getDictionaryInfoByDiscourseUuid(
            discourseUuid
          );
        } else if (spellingUuid && props.localDiscourseInfo) {
          discourseWordInfo.value = await server.getDictionaryInfoBySpellingUuid(
            spellingUuid
          );
        } else {
          discourseWordInfo.value = null;
        }
        actions.closeSnackbar();
        if (discourseWordInfo.value) {
          viewingDialog.value = true;
        } else if (canConnectSpellings.value && discourseUuid) {
          await openConnectSpellingDialog(discourseUuid);
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

    const openConnectSpellingDialog = async (discourseUuid: string) => {
      try {
        const { spelling } = await server.getSpellingByDiscourseUuid(
          discourseUuid
        );
        viewingConnectSpellingDialog.value = true;
        connectSpellingDialogSpelling.value = spelling;
        connectSpellingDialogDiscourseUuid.value = discourseUuid;
      } catch (err) {
        actions.showErrorSnackbar(
          'Failed to load connect spelling view',
          err as Error
        );
      }
    };

    const closeConnectSpellingDialog = async () => {
      try {
        viewingConnectSpellingDialog.value = false;
        connectSpellingDialogSpelling.value = '';
        connectSpellingDialogDiscourseUuid.value = '';
      } catch (err) {
        actions.showErrorSnackbar(
          'Failed to close connect spelling view',
          err as Error
        );
      }
    };

    const formatWord = (word: EpigraphicWord) => {
      const isWordToHighlight =
        props.discourseToHighlight && word.discourseUuid
          ? props.discourseToHighlight.includes(word.discourseUuid)
          : false;
      return isWordToHighlight ? `<mark>${word.reading}</mark>` : word.reading;
    };

    const formatSide = (side: EpigraphicUnitSide) => {
      return side.replace('!', '<sup>!</sup>');
    };

    return {
      renderer,
      lineNumber,
      openDialog,
      loading,
      discourseWordInfo,
      viewingDialog,
      viewingConnectSpellingDialog,
      connectSpellingDialogSpelling,
      connectSpellingDialogDiscourseUuid,
      closeConnectSpellingDialog,
      formatWord,
      formatSide,
      romanNumeral,
      canDisconnectSpellings,
      confirmDisconnectDialog,
      selectedDiscourseUuid,
      server,
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
