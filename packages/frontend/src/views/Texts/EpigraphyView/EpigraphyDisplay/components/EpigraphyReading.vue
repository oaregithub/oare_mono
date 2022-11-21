<template>
  <div v-if="renderer" class="mr-10">
    <div>
      <v-switch
        v-model="interLinearView"
        class="test-interlinear-switch"
        label="Interlinear View"
      ></v-switch>
    </div>
    <div v-for="sideName in renderer.sides" :key="sideName" class="d-flex">
      <div class="side-name oare-title mr-4" v-html="formatSide(sideName)" />
      <div>
        <div v-if="renderer.columnsOnSide(sideName).length === 1">
          <div
            v-for="lineNum in renderer.linesOnSide(sideName)"
            :key="lineNum"
            class="oare-title d-flex"
            :class="{ 'mb-3': interLinearView }"
          >
            <sup class="line-num pt-3 mr-2">{{ lineNumber(lineNum) }}</sup>
            <span
              v-if="renderer.isRegion(lineNum)"
              v-html="renderer.lineReading(lineNum)"
              @click="openConnectSealImpressionDialog(lineNum)"
              class="cursor-display"
            />
            <span
              v-else-if="renderer.isUndetermined(lineNum)"
              v-html="renderer.lineReading(lineNum)"
            />
            <span v-else>
              <span v-show="!interLinearView">
                <span
                  v-for="(word, index) in renderer.getLineWords(lineNum)"
                  :key="index"
                  v-html="formatWord(word)"
                  class="cursor-display test-rendered-word"
                  :class="{ 'mr-1': !word.isContraction }"
                  @click="openDialog(word.discourseUuid)"
                />
              </span>
              <div class="test-interlinear-view" v-show="interLinearView">
                <v-row>
                  <v-col
                    v-for="(word, index) in renderer.getLineWords(lineNum)"
                    :key="index"
                  >
                    <div>
                      <span
                        v-html="formatWord(word)"
                        class="cursor-display test-rendered-word"
                        @click="openDialog(word.discourseUuid)"
                      >
                      </span>
                    </div>
                    <div v-if="word.word && !word.isNumber">
                      <span
                        v-html="`<em>${word.word}</em>`"
                        class="cursor-display test-rendered-word"
                        @click="openDialog(word.discourseUuid)"
                      ></span>
                    </div>
                    <div v-if="word.translation">
                      <span
                        v-html="formatTranslation(word.translation)"
                        class="cursor-display test-rendered-word"
                        @click="openDialog(word.discourseUuid)"
                      ></span>
                    </div>
                    <div v-if="word.form">
                      <span
                        v-html="`<em>${word.form}</em>`"
                        class="cursor-display test-rendered-word"
                        @click="openDialog(word.discourseUuid)"
                      ></span>
                    </div>
                    <div v-if="word.parseInfo && word.parseInfo.length > 0">
                      <span
                        v-html="
                          formGrammarString({
                            uuid: '',
                            form: '',
                            properties: word.parseInfo,
                          })
                        "
                        class="cursor-display test-rendered-word"
                        @click="openDialog(word.discourseUuid)"
                      ></span>
                    </div>
                  </v-col>
                </v-row>
              </div>
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
              :class="{ 'mb-3': interLinearView }"
            >
              <sup class="line-num pt-3 mr-2">{{ lineNumber(lineNum) }}</sup>
              <span
                v-if="renderer.isRegion(lineNum)"
                v-html="renderer.lineReading(lineNum)"
                @click="openConnectSealImpressionDialog(lineNum)"
                class="cursor-display"
              />
              <span v-else>
                <span v-show="!interLinearView">
                  <span
                    v-for="(word, index) in renderer.getLineWords(lineNum)"
                    :key="index"
                    v-html="formatWord(word)"
                    class="cursor-display test-rendered-word"
                    :class="{ 'mr-1': !word.isContraction }"
                    @click="openDialog(word.discourseUuid)"
                  />
                </span>
                <div class="test-interlinear-view" v-show="interLinearView">
                  <v-row>
                    <v-col
                      v-for="(word, index) in renderer.getLineWords(lineNum)"
                      :key="index"
                    >
                      <div>
                        <span
                          v-html="formatWord(word)"
                          class="cursor-display test-rendered-word"
                          @click="openDialog(word.discourseUuid)"
                        >
                        </span>
                      </div>
                      <div v-if="word.word && !word.isNumber">
                        <span
                          v-html="formatDictionaryWord(word.word)"
                          class="cursor-display test-rendered-word"
                          @click="openDialog(word.discourseUuid)"
                        ></span>
                      </div>
                      <div v-if="word.translation">
                        <span
                          v-html="formatTranslation(word.translation)"
                          class="cursor-display test-rendered-word"
                          @click="openDialog(word.discourseUuid)"
                        ></span>
                      </div>
                      <div v-if="word.form">
                        <span
                          v-html="formatForm(word.form)"
                          class="cursor-display test-rendered-word"
                          @click="openDialog(word.discourseUuid)"
                        ></span>
                      </div>
                      <div v-if="word.parseInfo && word.parseInfo.length > 0">
                        <span
                          v-html="
                            formGrammarString({
                              uuid: '',
                              form: '',
                              properties: word.parseInfo,
                            })
                          "
                          class="cursor-display test-rendered-word"
                          @click="openDialog(word.discourseUuid)"
                        ></span>
                      </div>
                    </v-col>
                  </v-row>
                </div>
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
      :getTexts="server.getSpellingOccurrencesTexts"
      @finish="closeConnectSpellingDialog"
      v-model="viewingConnectSpellingDialog"
    ></connect-spelling-occurrence>
    <oare-dialog
      v-if="viewingConnectSealDialog && canConnectSealImpression"
      class="test-rendering-word-dialog"
      :closeButton="true"
      :persistent="false"
      :show-cancel="false"
      :show-submit="false"
      :width="600"
      :hideDivider="true"
      v-model="viewingConnectSealDialog"
    >
      <single-seal
        v-if="sealLink.linkedSealUuid"
        :uuid="sealLink.linkedSealUuid"
      ></single-seal>
      <seal-list
        v-else
        :showRadioBtns="true"
        :hideImages="true"
        :textEpigraphyUuid="sealLink.textEpigraphyUuid"
        :showConnectSeal="true"
        @finish="viewingConnectSealDialog = false"
      ></seal-list>
    </oare-dialog>
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
          class="test-disconnect-word"
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
      @submit="disconnectSpelling"
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
  LocaleCode,
} from '@oare/types';
import sl from '@/serviceLocator';
import DictionaryWord from '@/views/DictionaryWord/index.vue';
import SealList from '@/views/Seals/SealList.vue';
import SingleSeal from '@/views/Seals/SingleSeal.vue';
import ConnectSpellingOccurrence from './ConnectSpellingOccurrence.vue';
import { formatLineNumber, romanNumeral } from '@oare/oare/src/tabletUtils';
import i18n from '@/i18n';
import utils from '@/utils';

export interface EpigraphySealLink {
  textEpigraphyUuid: string;
  linkedSealUuid: string | null;
}

export default defineComponent({
  name: 'EpigraphyReading',
  components: {
    DictionaryWord,
    ConnectSpellingOccurrence,
    SealList,
    SingleSeal,
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
    const viewingConnectSealDialog = ref(false);
    const connectSpellingDialogSpelling = ref('');
    const connectSpellingDialogDiscourseUuid = ref('');
    const discourseWordInfo = ref<Word | null>(null);
    const sealLink = ref<EpigraphySealLink | null>(null);
    const interLinearView = ref(false);

    const canConnectSpellings = computed(() =>
      store.hasPermission('CONNECT_SPELLING')
    );

    const canDisconnectSpellings = computed(() =>
      store.hasPermission('DISCONNECT_SPELLING')
    );

    const canConnectSealImpression = computed(() =>
      store.hasPermission('ADD_SEAL_LINK')
    );

    const selectedDiscourseUuid = ref('');

    const confirmDisconnectDialog = ref(false);

    const disconnectSpelling = async (): Promise<void> => {
      try {
        if (selectedDiscourseUuid.value) {
          await server.disconnectSpellings([selectedDiscourseUuid.value]);
          viewingDialog.value = false;
          actions.showSnackbar('Word successfully disconnected.');
        }
      } catch (err) {
        actions.showErrorSnackbar(
          'Error disconnecting word. Please try again.',
          err as Error
        );
      }
    };

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

    const openDialog = async (discourseUuid: string | null) => {
      try {
        loading.value = true;
        actions.showSnackbar('Fetching discourse information...');
        if (discourseUuid) {
          selectedDiscourseUuid.value = discourseUuid;
        }
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

    const openConnectSealImpressionDialog = async (lineNum: number) => {
      try {
        if (canConnectSealImpression.value) {
          const region: EpigraphicUnit | null = renderer.value.getRegionUnitByLine(
            lineNum
          );
          if (
            region &&
            region.uuid &&
            region.markups[0].type.includes('SealImpression')
          ) {
            sealLink.value = {
              textEpigraphyUuid: region.uuid,
              linkedSealUuid: await server.getLinkedSeal(region.uuid),
            };

            viewingConnectSealDialog.value = true;
          } else {
            actions.showSnackbar('No region information');
          }
        }
      } catch (err) {
        actions.showErrorSnackbar(
          'error retrieving region information',
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

    const formatTranslation = (translation: string) => {
      return translation.length > 25
        ? `&quot;${translation.slice(0, 22)}...&quot;`
        : `${
            translation !== 'PN' && translation !== 'GN' ? '&quot;' : ''
          }${translation}${
            translation !== 'PN' && translation !== 'GN' ? '&quot;' : ''
          }`;
    };

    const formatForm = (form: string) => {
      return `<em>${form}</em>`;
    };

    const formatDictionaryWord = (dictionaryWord: string) => {
      return `<em>${dictionaryWord}</em>`;
    };

    return {
      renderer,
      lineNumber,
      openDialog,
      openConnectSealImpressionDialog,
      loading,
      discourseWordInfo,
      viewingDialog,
      viewingConnectSpellingDialog,
      viewingConnectSealDialog,
      connectSpellingDialogSpelling,
      connectSpellingDialogDiscourseUuid,
      closeConnectSpellingDialog,
      formatWord,
      formatSide,
      formatTranslation,
      formatDictionaryWord,
      formatForm,
      romanNumeral,
      formGrammarString: utils.formGrammarString,
      canDisconnectSpellings,
      canConnectSealImpression,
      confirmDisconnectDialog,
      disconnectSpelling,
      selectedDiscourseUuid,
      server,
      sealLink,
      interLinearView,
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
