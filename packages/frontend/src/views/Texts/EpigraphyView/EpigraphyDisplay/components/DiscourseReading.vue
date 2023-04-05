<template>
  <div>
    <p class="mt-5 oare-title font-weight-regular">
      <span v-for="side in discourseRenderer.sides" :key="side">
        <span class="mr-1">({{ convertSideNumberToSide(side) }})</span>
        <span
          v-for="line in discourseRenderer.linesOnSide(side)"
          :key="line"
          class="mr-1"
        >
          <sup v-if="!discourseRenderer.isRegion(line)"
            >{{ formatLineNumber(line, false) }})</sup
          >
          <span v-if="!commentMode">
            <span
              v-for="(word, idx) in discourseRenderer.wordsOnLine(line)"
              :key="idx"
              v-html="formatWord(word)"
              class="cursor-display"
              @click="openDialog(word.uuid, word.type)"
            />
          </span>
          <span v-else>
            <span
              v-for="(word, idx) in discourseRenderer.wordsOnLine(line)"
              :key="idx"
            >
              <UtilList
                @comment-clicked="openComment(word.uuid, word.display)"
                :hasEdit="false"
                :hasDelete="false"
                :hideMenu="!canComment"
              >
                <template #activator="{ on, attrs }">
                  <span
                    v-html="formatWord(word)"
                    class="cursor-display"
                    v-on="on"
                    v-bind="attrs"
                  />
                </template>
              </UtilList>
            </span>
          </span>
        </span>
      </span>
    </p>
    <v-row align="center" v-if="canInsertParentDiscourse && !disableEditing">
      <v-switch
        v-model="articulateDiscourseHierarchy"
        label="Articulate Discourse Hierarchy"
        class="mx-6"
      />
    </v-row>
    <v-row
      align="center"
      v-if="
        canInsertParentDiscourse &&
        articulateDiscourseHierarchy &&
        !disableEditing
      "
    >
      <v-btn
        :disabled="discourseSelections.length < 1"
        color="primary"
        @click="insertParentDiscourseDialog = true"
        class="mx-6 mb-6"
        >Insert Parent Discourse</v-btn
      >
      <component
        :is="insertParentDiscourseComponent"
        v-model="insertParentDiscourseDialog"
        :key="insertParentDiscourseKey"
        :discourseSelections="discourseSelections"
        :textUuid="textUuid"
      />
    </v-row>
    <v-treeview
      open-all
      :items="discourseUnits"
      item-children="units"
      item-key="uuid"
      item-text="spelling"
    >
      <template #label="{ item }">
        <v-row class="ma-0 pa-0" align="center">
          <v-checkbox
            v-if="
              articulateDiscourseHierarchy &&
              item.type !== 'discourseUnit' &&
              showCheckbox(item) &&
              !disableEditing
            "
            hide-details
            dense
            multiple
            v-model="discourseSelections"
            :value="item"
            class="ml-2 my-2"
            :disabled="!canSelectDiscourseUnit(item)"
          />
          <span v-if="editingUuid !== item.uuid" class="ma-0 pa-0">
            <v-btn
              icon
              v-if="
                (item.translation || item.type === 'discourseUnit') &&
                allowEditing
              "
              @click="startEdit(item)"
              class="mr-1 test-discourse-startedit"
            >
              <v-icon>mdi-pencil</v-icon>
            </v-btn>
            <v-menu
              :close-on-content-click="false"
              offset-x
              open-on-hover
              :open-delay="400"
            >
              <template v-slot:activator="{ on, attrs }">
                <span
                  :class="{
                    'red--text': item.type === 'paragraph',
                    'blue--text': item.type === 'sentence',
                    'purple--text': item.type === 'clause',
                    'green--text': item.type === 'phrase',
                    'orange--text': item.type === 'region',
                    'ml-10':
                      !showCheckbox(item) &&
                      articulateDiscourseHierarchy &&
                      item.type !== 'discourseUnit',
                  }"
                  style="white-space: normal"
                  v-html="discourseReading(item)"
                  v-bind="attrs"
                  v-on="on"
                  class="pr-8"
                  @click="openDialog(item.uuid, item.type)"
                ></span>
              </template>

              <discourse-properties-card
                :discourseUuid="item.uuid"
                :key="item.uuid"
              />
            </v-menu>
          </span>
          <div
            v-else-if="
              (item.translation || item.type === 'discourseUnit') &&
              allowEditing
            "
          >
            <v-textarea
              label="Translation"
              auto-grow
              outlined
              rows="1"
              v-model="inputTranslation"
              class="ma-1 test-discourse-box"
              dense
              hide-details
            ></v-textarea>
            <OareLoaderButton
              :loading="editLoading"
              color="primary"
              @click="discourseEdit(item)"
              class="ma-1 test-discourse-button"
              >Save</OareLoaderButton
            >
            <v-btn color="primary" @click="editingUuid = ''" class="ma-1"
              >Cancel</v-btn
            >
          </div>
        </v-row>
      </template>
    </v-treeview>
    <component
      v-if="canComment"
      :is="commentComponent"
      v-model="isCommenting"
      :item="`${commentDialogItem.replace(/<[em/]{2,3}>/gi, '')}`"
      :uuid="commentDialogUuid"
      :key="commentDialogUuid"
      :route="`/epigraphies/${textUuid}/${commentDialogUuid}`"
      ><span v-html="commentDialogItem"></span
    ></component>
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
import {
  defineComponent,
  ref,
  PropType,
  computed,
  watch,
} from '@vue/composition-api';
import {
  DiscourseUnit,
  Word,
  LocaleCode,
  DiscourseDisplayUnit,
} from '@oare/types';
import { DiscourseHtmlRenderer, convertSideNumberToSide } from '@oare/oare';
import { formatLineNumber } from '@oare/oare/src/tabletUtils';
import DictionaryWord from '@/views/DictionaryWord/index.vue';
import ConnectSpellingOccurrence from './ConnectSpellingOccurrence.vue';
import DiscoursePropertiesCard from './DiscoursePropertiesCard.vue';
import UtilList from '@/components/UtilList/index.vue';
import sl from '@/serviceLocator';
import i18n from '@/i18n';

export default defineComponent({
  props: {
    discourseUnits: {
      type: Array as PropType<DiscourseUnit[]>,
      required: true,
    },
    textUuid: {
      type: String,
      required: false,
    },
    disableEditing: {
      type: Boolean,
      default: false,
    },
    commentMode: {
      type: Boolean,
      default: false,
    },
    discourseToHighlight: {
      type: String,
      required: false,
    },
  },
  components: {
    DiscoursePropertiesCard,
    DictionaryWord,
    ConnectSpellingOccurrence,
    UtilList,
  },
  setup({ discourseUnits, textUuid, disableEditing, discourseToHighlight }) {
    const discourseRenderer = new DiscourseHtmlRenderer(
      discourseUnits,
      i18n.locale as LocaleCode
    );
    const server = sl.get('serverProxy');
    const editingUuid = ref('');
    const inputTranslation = ref('');
    const store = sl.get('store');
    const actions = sl.get('globalActions');
    const loading = ref(false);
    const viewingDialog = ref(false);
    const discourseWordInfo = ref<Word | null>(null);
    const viewingConnectSpellingDialog = ref(false);
    const connectSpellingDialogSpelling = ref('');
    const connectSpellingDialogDiscourseUuid = ref('');
    const isCommenting = ref(false);
    const commentDialogUuid = ref('');
    const commentDialogItem = ref('');

    const allowEditing = computed(
      () => !disableEditing && store.hasPermission('EDIT_TRANSLATION')
    );

    const canConnectSpellings = computed(() =>
      store.hasPermission('CONNECT_SPELLING')
    );

    const discourseReading = (discourse: DiscourseUnit) => {
      let reading;
      if (
        (discourse.type === 'discourseUnit' || discourse.type === 'sentence') &&
        discourse.translation
      ) {
        reading = discourse.translation;
      } else if (discourse.type === 'paragraph' && discourse.paragraphLabel) {
        reading = `<strong><em>${discourse.paragraphLabel}</em></strong>`;
      } else if (
        (discourse.type === 'clause' || discourse.type === 'phrase') &&
        discourse.paragraphLabel
      ) {
        reading = `<em>${discourse.paragraphLabel}</em>`;
      } else if (
        (discourse.type === 'word' || discourse.type === 'number') &&
        discourse.transcription &&
        discourse.explicitSpelling
      ) {
        reading = `${discourse.transcription} (${discourse.explicitSpelling})`;
      } else {
        reading = discourse.explicitSpelling;
      }

      return reading || '';
    };

    const startEdit = (discourse: DiscourseUnit) => {
      editingUuid.value = discourse.uuid || '';
      if (discourse.translation) {
        inputTranslation.value = discourse.translation || '';
      } else {
        inputTranslation.value = discourse.explicitSpelling || '';
      }
    };

    const editLoading = ref(false);
    const discourseEdit = async (discourse: DiscourseUnit) => {
      try {
        if (!textUuid) {
          throw new Error('No text uuid');
        }
        if (discourse.translation) {
          await server.updateDiscourseTranslation(
            discourse.uuid,
            inputTranslation.value,
            textUuid
          );
        } else {
          await server.createDiscourseTranslation(
            discourse.uuid,
            inputTranslation.value,
            textUuid
          );
        }
        editLoading.value = true;
      } catch (err) {
        actions.showErrorSnackbar(
          'Failed to update translations. Please try again.',
          err as Error
        );
      } finally {
        discourse.translation = inputTranslation.value;
        editingUuid.value = '';
        editLoading.value = false;
      }
    };

    const articulateDiscourseHierarchy = ref(false);

    const discourseSelections = ref<DiscourseUnit[]>([]);

    const canSelectDiscourseUnit = (unit: DiscourseUnit): boolean => {
      if (discourseSelections.value.length === 0) {
        return true;
      }
      if (discourseSelections.value[0].parentUuid !== unit.parentUuid) {
        return false;
      }
      const childNumArray = discourseSelections.value.map(
        selection => selection.childNum!
      );
      const minimumChildNumInText = Math.min(...childNumArray);
      const maximumChildNumInText = Math.max(...childNumArray);
      if (
        unit.childNum === minimumChildNumInText - 1 ||
        unit.childNum === maximumChildNumInText + 1 ||
        unit.childNum === minimumChildNumInText ||
        unit.childNum === maximumChildNumInText
      ) {
        return true;
      }
      return false;
    };

    const showCheckbox = (unit: DiscourseUnit): boolean => {
      if (unit.type === 'discourseUnit') {
        return false;
      }

      if (
        unit.type === 'region' &&
        unit.explicitSpelling?.includes('uninscribed')
      ) {
        return false;
      }

      if (unit.type === 'region' && unit.explicitSpelling?.includes('ruling')) {
        return false;
      }

      return true;
    };

    const formatWord = (word: DiscourseDisplayUnit) => {
      const isWordToHighlight =
        discourseToHighlight && word.uuid
          ? discourseToHighlight.includes(word.uuid)
          : false;
      return isWordToHighlight
        ? ` <mark>${word.display}</mark>`
        : ` ${word.display}`;
    };

    watch(articulateDiscourseHierarchy, () => {
      if (!articulateDiscourseHierarchy.value) {
        discourseSelections.value = [];
      }
    });

    const insertParentDiscourseDialog = ref(false);

    const insertParentDiscourseKey = ref(false);
    watch(insertParentDiscourseDialog, () => {
      if (insertParentDiscourseDialog.value) {
        insertParentDiscourseKey.value = !insertParentDiscourseKey.value;
      } else {
        discourseSelections.value = [];
        articulateDiscourseHierarchy.value = false;
      }
    });

    const canInsertParentDiscourse = computed(
      () => textUuid && store.hasPermission('INSERT_PARENT_DISCOURSE_ROWS')
    );

    const insertParentDiscourseComponent = computed(() =>
      textUuid && canInsertParentDiscourse.value
        ? () => import('./InsertParentDiscourseDialog.vue')
        : null
    );

    const openDialog = async (discourseUuid: string, discourseType: string) => {
      try {
        if (discourseType != 'word') {
          return;
        } else {
          loading.value = true;
          actions.showSnackbar('Fetching discourse information...');

          if (discourseUuid) {
            discourseWordInfo.value = await server.getDictionaryInfoByDiscourseUuid(
              discourseUuid
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

    const canComment = computed(() => store.hasPermission('ADD_COMMENTS'));

    const openComment = (uuid: string, item: string) => {
      commentDialogUuid.value = uuid;
      commentDialogItem.value = item;
      isCommenting.value = true;
    };

    // To avoid circular dependencies
    const commentComponent = computed(() =>
      canComment.value
        ? () => import('@/components/CommentItemDisplay/index.vue')
        : null
    );

    return {
      discourseRenderer,
      discourseReading,
      startEdit,
      discourseEdit,
      formatLineNumber,
      editingUuid,
      inputTranslation,
      allowEditing,
      editLoading,
      articulateDiscourseHierarchy,
      discourseSelections,
      canSelectDiscourseUnit,
      insertParentDiscourseDialog,
      insertParentDiscourseKey,
      canInsertParentDiscourse,
      insertParentDiscourseComponent,
      openDialog,
      loading,
      discourseWordInfo,
      viewingDialog,
      viewingConnectSpellingDialog,
      connectSpellingDialogSpelling,
      connectSpellingDialogDiscourseUuid,
      closeConnectSpellingDialog,
      convertSideNumberToSide,
      server,
      showCheckbox,
      canComment,
      openComment,
      commentDialogItem,
      commentDialogUuid,
      commentComponent,
      isCommenting,
      formatWord,
    };
  },
});
</script>

<style scoped>
.cursor-display {
  cursor: pointer;
}
</style>
