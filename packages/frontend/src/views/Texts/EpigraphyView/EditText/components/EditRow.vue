<template>
  <div>
    <v-row class="ml-4 mr-2 my-8 oare-title">
      <v-btn
        v-if="
          currentEditAction === 'removeLine' &&
          !renderer.isRegion(line) &&
          !renderer.isUndetermined(line)
        "
        icon
        color="red"
        small
        class="mr-2 test-remove-line"
        @click="removeLineDialog = true"
        ><v-icon small>mdi-delete</v-icon></v-btn
      >

      <v-btn
        v-if="
          (currentEditAction === 'removeRegionBroken' &&
            renderer.isRegionType(line, 'broken')) ||
          (currentEditAction === 'removeRegionRuling' &&
            renderer.isRegionType(line, 'ruling')) ||
          (currentEditAction === 'removeRegionSealImpression' &&
            renderer.isRegionType(line, 'isSealImpression')) ||
          (currentEditAction === 'removeRegionUninscribed' &&
            renderer.isRegionType(line, 'uninscribed'))
        "
        icon
        color="red"
        small
        class="mr-2 test-remove-region"
        @click="removeRegionDialog = true"
        ><v-icon small>mdi-delete</v-icon></v-btn
      >

      <v-btn
        v-if="
          currentEditAction === 'removeUndeterminedLines' &&
          renderer.isUndetermined(line)
        "
        icon
        color="red"
        small
        class="mr-2 test-remove-undetermined-lines"
        @click="removeUndeterminedLinesDialog = true"
        ><v-icon small>mdi-delete</v-icon></v-btn
      >

      <v-checkbox
        v-if="
          currentEditAction === 'mergeLine' &&
          !renderer.isRegion(line) &&
          !renderer.isUndetermined(line)
        "
        dense
        hide-details
        class="mt-n1 test-merge-line"
        :value="line"
        :input-value="selectedLines"
        @change="$emit('toggle-select-line', line)"
        :disabled="!lineCanBeSelected"
      />

      <sup class="line-num pt-3 mr-2">{{ lineNumber(line) }}</sup>
      <span v-if="renderer.isRegion(line) || renderer.isUndetermined(line)">
        <v-hover v-slot="{ hover }">
          <span
            v-html="renderer.lineReading(line)"
            :class="{
              'blue-line-under cursor-display':
                hover &&
                ((currentEditAction === 'editRegionBroken' &&
                  renderer.isRegionType(line, 'broken')) ||
                  (currentEditAction === 'editRegionRuling' &&
                    renderer.isRegionType(line, 'ruling')) ||
                  (currentEditAction === 'editRegionSealImpression' &&
                    renderer.isRegionType(line, 'isSealImpression')) ||
                  (currentEditAction === 'editRegionUninscribed' &&
                    renderer.isRegionType(line, 'uninscribed')) ||
                  (currentEditAction === 'editUndeterminedLines' &&
                    renderer.isUndetermined(line))),
            }"
            @click="handleRegionClick(line)"
            class="test-editor-region"
          />
        </v-hover>
      </span>
      <span v-else>
        <insert-button
          v-if="
            currentEditAction === 'addWord' ||
            currentEditAction === 'addDivider'
          "
          class="ml-4 mr-2"
          @insert="handleInsertWord(undefined)"
        />
        <span
          v-for="(word, index) in renderer.getLineWords(line)"
          :key="index"
          :class="{ 'mr-2': !word.isContraction }"
        >
          <div class="d-inline-block">
            <v-row class="ma-0" justify="center">
              <v-hover v-slot="{ hover }">
                <span
                  :class="{
                    'red-line-through cursor-display':
                      hover &&
                      ((currentEditAction === 'removeWord' &&
                        !word.isDivider) ||
                        (currentEditAction === 'removeDivider' &&
                          word.isDivider)),
                    'blue-line-under cursor-display':
                      hover &&
                      ((currentEditAction === 'addSign' && !word.isDivider) ||
                        (currentEditAction === 'addUndeterminedSigns' &&
                          !word.isDivider) ||
                        (currentEditAction === 'reorderSign' &&
                          !word.isDivider) ||
                        (currentEditAction === 'splitWord' && !word.isDivider)),
                  }"
                  class="test-editor-word"
                  @click="handleWordClick(word)"
                >
                  <span v-for="(sign, signIdx) in word.signs" :key="signIdx">
                    <v-hover v-slot="{ hover: hover2 }">
                      <span
                        v-html="sign.reading"
                        :class="{
                          'red-line-through cursor-display':
                            hover2 &&
                            ((currentEditAction === 'removeSign' &&
                              sign.epigType === 'sign') ||
                              (currentEditAction ===
                                'removeUndeterminedSigns' &&
                                sign.epigType === 'undeterminedSigns')),
                          'blue-line-under cursor-display':
                            hover2 &&
                            ((currentEditAction === 'editSign' &&
                              sign.epigType === 'sign') ||
                              (currentEditAction === 'editUndeterminedSigns' &&
                                sign.epigType === 'undeterminedSigns') ||
                              (currentEditAction === 'editDivider' &&
                                word.isDivider)),
                        }"
                        @click="handleSignClick(word, sign)"
                        class="test-editor-sign"
                      />
                    </v-hover>
                    <span>{{ sign.separator }}</span>
                  </span>
                </span>
              </v-hover>
            </v-row>
            <v-row class="ma-0" justify="center">
              <v-checkbox
                v-if="
                  currentEditAction === 'mergeWord' &&
                  !word.isDivider &&
                  word.discourseUuid
                "
                dense
                hide-details
                class="mt-n1 mr-n1 test-merge-word-check"
                :value="word"
                :input-value="selectedWords"
                @change="$emit('toggle-select-word', word)"
                :disabled="!wordCanBeSelected(word)"
              />
            </v-row>
          </div>
          <insert-button
            v-if="
              currentEditAction === 'addWord' ||
              currentEditAction === 'addDivider'
            "
            class="ml-2"
            @insert="handleInsertWord(word)"
          />
          <v-hover
            v-if="
              currentEditAction === 'splitLine' &&
              index < renderer.getLineWords(line).length - 1
            "
            class="ml-2"
            v-slot="{ hover }"
          >
            <v-btn
              fab
              x-small
              dark
              :elevation="hover ? 5 : 0"
              :color="hover ? 'grey darken-3' : 'grey lighten-2'"
              width="25px"
              height="25px"
              class="test-split-button"
              @click="handleSplitLine(word)"
            >
              <v-icon x-small> mdi-content-cut </v-icon>
            </v-btn>
          </v-hover>
        </span>
      </span>
    </v-row>

    <oare-dialog
      v-model="removeLineDialog"
      :title="`Remove line ${line}?`"
      submitText="Yes"
      cancelText="No"
      :persistent="false"
      @submit="removeLine"
      :submitLoading="editTextLoading"
      >Are you sure you want to remove this line? <b>WARNING: </b>All content
      still on this line upon deletion will also be deleted.</oare-dialog
    >

    <oare-dialog
      v-model="removeRegionDialog"
      :title="removeRegionDialogText.title"
      submitText="Yes"
      cancelText="No"
      :persistent="false"
      @submit="removeRegion"
      :submitLoading="editTextLoading"
      >{{
        `Are you sure you want to remove this ${removeRegionDialogText.item}?`
      }}</oare-dialog
    >

    <oare-dialog
      v-model="removeUndeterminedLinesDialog"
      title="Remove broken lines?"
      submitText="Yes"
      cancelText="No"
      :persistent="false"
      @submit="removeUndeterminedLines"
      :submitLoading="editTextLoading"
      >Are you sure you want to remove these broken lines?</oare-dialog
    >

    <oare-dialog
      v-model="removeWordDialog"
      :title="`Remove Word / Number?`"
      submitText="Yes"
      cancelText="No"
      :persistent="false"
      @submit="removeWord"
      :submitLoading="editTextLoading"
      >Are you sure you want to remove
      <b v-if="wordToRemove" v-html="wordToRemove.reading" /> from line
      {{ line }}? <b>WARNING: </b>All signs in this unit will also be removed.
      If the word/number you are removing is the only unit on its line, the line
      will also be removed.</oare-dialog
    >

    <remove-sign-dialog
      v-if="wordBeingRemovedFrom && signToRemove"
      v-model="removeSignDialog"
      :word="wordBeingRemovedFrom"
      :sign="signToRemove"
      :textUuid="textUuid"
      :line="line"
      :currentEditAction="currentEditAction"
      @reset-renderer="resetRenderer"
      @reset-current-edit-action="resetCurrentEditAction"
    />

    <oare-dialog
      v-model="removeDividerDialog"
      :title="`Remove Word Divider?`"
      submitText="Yes"
      cancelText="No"
      :persistent="false"
      @submit="removeDivider"
      :submitLoading="editTextLoading"
      >Are you sure you want to remove this word divider from line {{ line }}?
      <b>WARNING: </b>If the word divider you are removing is the only unit on
      its line, the line will also be removed.</oare-dialog
    >

    <edit-region-dialog
      v-if="regionLineToEdit"
      v-model="editRegionDialog"
      :line="regionLineToEdit"
      :textUuid="textUuid"
      :renderer="renderer"
      :regionType="regionType"
      @reset-renderer="resetRenderer"
      @reset-current-edit-action="resetCurrentEditAction"
    />

    <edit-undetermined-lines-dialog
      v-if="undeterminedLinesToEdit"
      v-model="editUndeterminedLinesDialog"
      :line="undeterminedLinesToEdit"
      :textUuid="textUuid"
      :renderer="renderer"
      @reset-renderer="resetRenderer"
      @reset-current-edit-action="resetCurrentEditAction"
    />

    <add-word-dialog
      v-model="addWordDialog"
      :key="
        addWordPreviousWord ? addWordPreviousWord.discourseUuid : 'undefined'
      "
      :previousWord="addWordPreviousWord"
      :textUuid="textUuid"
      :renderer="renderer"
      :column="column"
      :side="side"
      @reset-renderer="resetRenderer"
      @reset-current-edit-action="resetCurrentEditAction"
      :line="line"
    />

    <add-sign-dialog
      v-if="wordToAddSignTo"
      v-model="addSignDialog"
      :key="wordToAddSignTo.discourseUuid"
      :wordToAddSignTo="wordToAddSignTo"
      :textUuid="textUuid"
      :renderer="renderer"
      @reset-renderer="resetRenderer"
      @reset-current-edit-action="resetCurrentEditAction"
      :line="line"
      :side="side"
      :column="column"
    />

    <add-undetermined-signs-dialog
      v-if="wordToAddUndeterminedSignsTo"
      v-model="addUndeterminedSignsDialog"
      :side="side"
      :column="column"
      :wordToAddUndeterminedSignsTo="wordToAddUndeterminedSignsTo"
      :key="wordToAddUndeterminedSignsTo.discourseUuid"
      :textUuid="textUuid"
      @reset-renderer="resetRenderer"
      @reset-current-edit-action="resetCurrentEditAction"
      :renderer="renderer"
      :line="line"
    />

    <edit-sign-dialog
      v-if="signToEdit && wordBeingEdited"
      v-model="editSignDialog"
      :sign="signToEdit"
      :renderer="renderer"
      :textUuid="textUuid"
      :line="line"
      :side="side"
      :column="column"
      :word="wordBeingEdited"
      :key="signToEdit.uuid"
      @reset-renderer="resetRenderer"
      @reset-current-edit-action="resetCurrentEditAction"
    />

    <edit-undetermined-signs-dialog
      v-if="undeterminedSignToEdit"
      v-model="editUndeterminedSignsDialog"
      :textUuid="textUuid"
      :undeterminedSigns="undeterminedSignToEdit"
      :key="undeterminedSignToEdit.uuid"
      @reset-renderer="resetRenderer"
      @reset-current-edit-action="resetCurrentEditAction"
    />

    <oare-dialog
      v-model="addDividerDialog"
      title="Add Word Divider?"
      submitText="Yes"
      cancelText="No"
      :persistent="false"
      @submit="addDivider"
      :submitLoading="editTextLoading"
    >
      <span v-if="addDividerPreviousWord"
        >Are you sure you want to add a word divider to line {{ line }} after
        the word <b v-html="addDividerPreviousWord.reading" />?</span
      >
      <span v-else
        >Are you sure you want to add a word divider to the beginning of line
        {{ line }}?</span
      >
    </oare-dialog>

    <oare-dialog
      v-if="dividerToEdit"
      v-model="editDividerDialog"
      title="Edit Divider Markup"
      :submitLoading="editDividerLoading"
      @submit="editDivider"
    >
      <v-row justify="center" class="ma-0">
        Select or unselect markup options.
      </v-row>
      <v-row justify="center" class="ma-0 mb-6">
        Some options have additional optional inputs.
      </v-row>
      <markup-selector
        :newSign="dividerToEdit.reading"
        :referenceUuid="dividerToEdit.uuid"
        :existingMarkup="dividerToEdit.markups"
        class="mx-4 mb-4"
        @update-markup="updateDividerMarkup"
      />
    </oare-dialog>

    <reorder-signs-dialog
      v-if="wordToReorderSignsIn"
      v-model="reorderSignsDialog"
      :word="wordToReorderSignsIn"
      :textUuid="textUuid"
      :key="wordToReorderSignsIn.discourseUuid"
      @reset-renderer="resetRenderer"
      @reset-current-edit-action="resetCurrentEditAction"
    />

    <oare-dialog
      v-model="splitLineDialog"
      :title="`Split line ${line}?`"
      submitText="Yes"
      cancelText="No"
      :persistent="false"
      @submit="splitLine"
      :submitLoading="splitLineLoading"
      >Are you sure you want to split this line?</oare-dialog
    >

    <split-word-dialog
      v-if="wordToSplit"
      v-model="splitWordDialog"
      :word="wordToSplit"
      :textUuid="textUuid"
      :key="wordToSplit.discourseUuid"
      @reset-renderer="resetRenderer"
      @reset-current-edit-action="resetCurrentEditAction"
    />
  </div>
</template>

<script lang="ts">
import {
  defineComponent,
  PropType,
  ref,
  watch,
  computed,
  ComputedRef,
} from '@vue/composition-api';
import { TabletRenderer } from '@oare/oare';
import { formatLineNumber } from '@oare/oare/src/tabletUtils';
import {
  EditTextAction,
  EpigraphicWord,
  EpigraphicSign,
  RemoveLinePayload,
  RemoveRegionPayload,
  RemoveUndeterminedLinesPayload,
  RemoveWordPayload,
  RemoveDividerPayload,
  EpigraphicUnitSide,
  AddDividerPayload,
  MarkupType,
  MarkupUnit,
  EditDividerPayload,
  SplitLinePayload,
} from '@oare/types';
import sl from '@/serviceLocator';
import RemoveSignDialog from './RemoveSignDialog.vue';
import EditRegionDialog from './EditRegionDialog.vue';
import EditUndeterminedLinesDialog from './EditUndeterminedLinesDialog.vue';
import InsertButton from './InsertButton.vue';
import AddWordDialog from './AddWordDialog.vue';
import AddSignDialog from './AddSignDialog.vue';
import AddUndeterminedSignsDialog from './AddUndeterminedSignsDialog.vue';
import EditSignDialog from './EditSignDialog.vue';
import EditUndeterminedSignsDialog from './EditUndeterminedSignsDialog.vue';
import MarkupSelector from './MarkupSelector.vue';
import ReorderSignsDialog from './ReorderSignsDialog.vue';
import SplitWordDialog from './SplitWordDialog.vue';

export default defineComponent({
  props: {
    renderer: {
      type: Object as PropType<TabletRenderer>,
      required: true,
    },
    line: {
      type: Number,
      required: true,
    },
    currentEditAction: {
      type: String as PropType<EditTextAction>,
      required: false,
    },
    textUuid: {
      type: String,
      required: true,
    },
    selectedLines: {
      type: Array as PropType<number[]>,
      required: true,
    },
    column: {
      type: Number,
      required: true,
    },
    side: {
      type: String as PropType<EpigraphicUnitSide>,
      required: true,
    },
    selectedWords: {
      type: Array as PropType<EpigraphicWord[]>,
      required: true,
    },
  },
  components: {
    RemoveSignDialog,
    EditRegionDialog,
    EditUndeterminedLinesDialog,
    InsertButton,
    AddWordDialog,
    AddSignDialog,
    AddUndeterminedSignsDialog,
    EditSignDialog,
    EditUndeterminedSignsDialog,
    MarkupSelector,
    ReorderSignsDialog,
    SplitWordDialog,
  },
  setup(props, { emit }) {
    const server = sl.get('serverProxy');
    const actions = sl.get('globalActions');

    const editTextLoading = ref(false);

    const lineNumber = (line: number): string => {
      if (
        props.renderer.isRegion(line) ||
        props.renderer.isUndetermined(line)
      ) {
        return '';
      }

      const lineNumber = formatLineNumber(line);
      return lineNumber;
    };

    const resetRenderer = () => {
      emit('reset-renderer');
    };

    const resetCurrentEditAction = () => {
      emit('reset-current-edit-action');
    };

    const removeLineDialog = ref(false);
    const removeLine = async () => {
      try {
        editTextLoading.value = true;
        const payload: RemoveLinePayload = {
          type: 'removeLine',
          textUuid: props.textUuid,
          line: props.line,
        };
        await server.editText(payload);
        resetRenderer();
      } catch (err) {
        actions.showErrorSnackbar(
          'Error removing line. Please try again.',
          err as Error
        );
      } finally {
        removeLineDialog.value = false;
        resetCurrentEditAction();
        editTextLoading.value = false;
      }
    };
    watch(removeLineDialog, () => {
      if (!removeLineDialog.value) {
        resetCurrentEditAction();
      }
    });

    const removeRegionDialogText: ComputedRef<{ title: string; item: string }> =
      computed(() => {
        if (props.currentEditAction === 'removeRegionBroken') {
          return {
            title: 'Remove Broken Area?',
            item: 'broken area',
          };
        } else if (props.currentEditAction === 'removeRegionRuling') {
          return {
            title: 'Remove Ruling?',
            item: 'ruling',
          };
        } else if (props.currentEditAction === 'removeRegionSealImpression') {
          return {
            title: 'Remove Seal Impression?',
            item: 'seal impression',
          };
        } else {
          return {
            title: 'Remove Uninscribed Line(s)?',
            item: 'uninscribed line(s)',
          };
        }
      });
    const removeRegionDialog = ref(false);
    const removeRegion = async () => {
      try {
        editTextLoading.value = true;
        const unitsOnLine = props.renderer.getUnitsOnLine(props.line);
        if (unitsOnLine.length !== 1) {
          throw new Error(
            'Cannot remove region with more than one unit on line.'
          );
        }
        if (
          props.currentEditAction !== 'removeRegionBroken' &&
          props.currentEditAction !== 'removeRegionRuling' &&
          props.currentEditAction !== 'removeRegionSealImpression' &&
          props.currentEditAction !== 'removeRegionUninscribed'
        ) {
          throw new Error('Cannot remove region with invalid action.');
        }

        const payload: RemoveRegionPayload = {
          type: props.currentEditAction,
          textUuid: props.textUuid,
          uuid: unitsOnLine[0].uuid,
        };
        await server.editText(payload);
        resetRenderer();
      } catch (err) {
        actions.showErrorSnackbar(
          'Error removing region. Please try again.',
          err as Error
        );
      } finally {
        removeRegionDialog.value = false;
        resetCurrentEditAction();
        editTextLoading.value = false;
      }
    };
    watch(removeRegionDialog, () => {
      if (!removeRegionDialog.value) {
        resetCurrentEditAction();
      }
    });

    const removeUndeterminedLinesDialog = ref(false);
    const removeUndeterminedLines = async () => {
      try {
        editTextLoading.value = true;
        const unitsOnLine = props.renderer.getUnitsOnLine(props.line);
        if (unitsOnLine.length !== 1) {
          throw new Error(
            'Cannot remove broken lines with more than one unit on line.'
          );
        }
        const payload: RemoveUndeterminedLinesPayload = {
          type: 'removeUndeterminedLines',
          textUuid: props.textUuid,
          uuid: unitsOnLine[0].uuid,
        };
        await server.editText(payload);
        resetRenderer();
      } catch (err) {
        actions.showErrorSnackbar(
          'Error removing broken lines. Please try again.',
          err as Error
        );
      } finally {
        removeUndeterminedLinesDialog.value = false;
        resetCurrentEditAction();
        editTextLoading.value = false;
      }
    };
    watch(removeUndeterminedLinesDialog, () => {
      if (!removeUndeterminedLinesDialog.value) {
        resetCurrentEditAction();
      }
    });

    const handleWordClick = (word: EpigraphicWord) => {
      if (props.currentEditAction === 'removeWord') {
        removeWordDialog.value = true;
        wordToRemove.value = word;
      } else if (props.currentEditAction === 'removeDivider') {
        removeDividerDialog.value = true;
        dividerToRemove.value = word;
      } else if (props.currentEditAction === 'addSign') {
        addSignDialog.value = true;
        wordToAddSignTo.value = word;
      } else if (props.currentEditAction === 'addUndeterminedSigns') {
        addUndeterminedSignsDialog.value = true;
        wordToAddUndeterminedSignsTo.value = word;
      } else if (props.currentEditAction === 'reorderSign') {
        reorderSignsDialog.value = true;
        wordToReorderSignsIn.value = word;
      } else if (props.currentEditAction === 'splitWord') {
        splitWordDialog.value = true;
        wordToSplit.value = word;
      }
    };

    const addSignDialog = ref(false);
    const wordToAddSignTo = ref<EpigraphicWord>();
    watch(addSignDialog, () => {
      if (!addSignDialog.value) {
        wordToAddSignTo.value = undefined;
        resetCurrentEditAction();
      }
    });

    const addUndeterminedSignsDialog = ref(false);
    const wordToAddUndeterminedSignsTo = ref<EpigraphicWord>();
    watch(addUndeterminedSignsDialog, () => {
      if (!addUndeterminedSignsDialog.value) {
        wordToAddUndeterminedSignsTo.value = undefined;
        resetCurrentEditAction();
      }
    });

    const removeWordDialog = ref(false);
    const wordToRemove = ref<EpigraphicWord>();
    const removeWord = async () => {
      try {
        editTextLoading.value = true;
        if (!wordToRemove.value) {
          throw new Error('No word selected for removal.');
        } else if (!wordToRemove.value.discourseUuid) {
          throw new Error('Word does not have a discourse UUID.');
        }
        const payload: RemoveWordPayload = {
          type: 'removeWord',
          textUuid: props.textUuid,
          discourseUuid: wordToRemove.value.discourseUuid,
          line: props.line,
        };
        await server.editText(payload);
        resetRenderer();
      } catch (err) {
        actions.showErrorSnackbar(
          'Error removing word. Please try again.',
          err as Error
        );
      } finally {
        removeWordDialog.value = false;
        resetCurrentEditAction();
        editTextLoading.value = false;
        wordToRemove.value = undefined;
      }
    };
    watch(removeWordDialog, () => {
      if (!removeWordDialog.value) {
        resetCurrentEditAction();
      }
    });

    const removeDividerDialog = ref(false);
    const dividerToRemove = ref<EpigraphicWord>();
    const removeDivider = async () => {
      try {
        editTextLoading.value = true;
        if (!dividerToRemove.value) {
          throw new Error('No word divider selected for removal.');
        } else if (dividerToRemove.value.uuids.length > 1) {
          throw new Error(
            'Cannot remove word divider with more than one UUID.'
          );
        }
        const payload: RemoveDividerPayload = {
          type: 'removeDivider',
          textUuid: props.textUuid,
          uuid: dividerToRemove.value.uuids[0],
          line: props.line,
        };
        await server.editText(payload);
        resetRenderer();
      } catch (err) {
        actions.showErrorSnackbar(
          'Error removing word divider. Please try again.',
          err as Error
        );
      } finally {
        removeDividerDialog.value = false;
        resetCurrentEditAction();
        editTextLoading.value = false;
        dividerToRemove.value = undefined;
      }
    };
    watch(removeDividerDialog, () => {
      if (!removeDividerDialog.value) {
        resetCurrentEditAction();
      }
    });

    const handleSignClick = (word: EpigraphicWord, sign: EpigraphicSign) => {
      if (
        props.currentEditAction === 'removeSign' &&
        sign.epigType === 'sign'
      ) {
        wordBeingRemovedFrom.value = word;
        signToRemove.value = sign;
        removeSignDialog.value = true;
      } else if (
        props.currentEditAction === 'removeUndeterminedSigns' &&
        sign.epigType === 'undeterminedSigns'
      ) {
        wordBeingRemovedFrom.value = word;
        signToRemove.value = sign;
        removeSignDialog.value = true;
      } else if (
        props.currentEditAction === 'editSign' &&
        sign.epigType === 'sign'
      ) {
        wordBeingEdited.value = word;
        signToEdit.value = sign;
        editSignDialog.value = true;
      } else if (
        props.currentEditAction === 'editUndeterminedSigns' &&
        sign.epigType === 'undeterminedSigns'
      ) {
        undeterminedSignToEdit.value = sign;
        editUndeterminedSignsDialog.value = true;
      } else if (props.currentEditAction === 'editDivider') {
        editDividerDialog.value = true;
        dividerToEdit.value = sign;
        dividerMarkupUnits.value = sign.markups;
      }
    };

    const regionType = ref<MarkupType>();
    const handleRegionClick = (line: number) => {
      if (props.currentEditAction === 'editRegionBroken') {
        setupEditRegionDialog(line, 'broken');
      } else if (props.currentEditAction === 'editRegionRuling') {
        setupEditRegionDialog(line, 'ruling');
      } else if (props.currentEditAction === 'editRegionSealImpression') {
        setupEditRegionDialog(line, 'isSealImpression');
      } else if (props.currentEditAction === 'editRegionUninscribed') {
        setupEditRegionDialog(line, 'uninscribed');
      } else if (props.currentEditAction === 'editUndeterminedLines') {
        undeterminedLinesToEdit.value = line;
        editUndeterminedLinesDialog.value = true;
      }
    };
    const setupEditRegionDialog = (line: number, type: MarkupType) => {
      regionLineToEdit.value = line;
      regionType.value = type;
      editRegionDialog.value = true;
    };

    const editRegionDialog = ref(false);
    const regionLineToEdit = ref<number>();
    watch(editRegionDialog, () => {
      if (!editRegionDialog.value) {
        regionLineToEdit.value = undefined;
        regionType.value = undefined;
        resetCurrentEditAction();
      }
    });

    const editUndeterminedLinesDialog = ref(false);
    const undeterminedLinesToEdit = ref<number>();
    watch(editUndeterminedLinesDialog, () => {
      if (!editUndeterminedLinesDialog.value) {
        undeterminedLinesToEdit.value = undefined;
        resetCurrentEditAction();
      }
    });

    const removeSignDialog = ref(false);
    const wordBeingRemovedFrom = ref<EpigraphicWord>();
    const signToRemove = ref<EpigraphicSign>();
    watch(removeSignDialog, () => {
      if (!removeSignDialog.value) {
        wordBeingRemovedFrom.value = undefined;
        signToRemove.value = undefined;
        resetCurrentEditAction();
      }
    });

    const lineCanBeSelected = computed(() => {
      if (props.selectedLines.includes(props.line)) {
        return true;
      }

      if (props.selectedLines.length === 0) {
        return true;
      }

      if (props.selectedLines.length >= 2) {
        return false;
      }

      if (props.selectedLines.length === 1) {
        const selectedLine = props.selectedLines[0];
        const lines = props.renderer.lines;
        const selectedLineIndex = lines.indexOf(selectedLine);
        const lineIndex = lines.indexOf(props.line);

        const selectedLineColumn = props.renderer
          .getUnitsOnLine(selectedLine)
          .find(unit => unit.column)?.column;

        if (
          (lineIndex === selectedLineIndex + 1 ||
            lineIndex === selectedLineIndex - 1) &&
          selectedLineColumn === props.column
        ) {
          return true;
        }
      }

      return false;
    });

    const handleInsertWord = (word: EpigraphicWord | undefined) => {
      if (props.currentEditAction === 'addWord') {
        setupAddWordDialog(word);
      } else if (props.currentEditAction === 'addDivider') {
        addDividerPreviousWord.value = word;
        addDividerDialog.value = true;
      }
    };

    const addWordDialog = ref(false);
    watch(addWordDialog, () => {
      if (!addWordDialog.value) {
        resetCurrentEditAction();
      }
    });
    const addWordPreviousWord = ref<EpigraphicWord>();
    const setupAddWordDialog = (previousWord: EpigraphicWord | undefined) => {
      // Can be undefined if first word
      addWordPreviousWord.value = previousWord;
      addWordDialog.value = true;
    };

    const addDividerDialog = ref(false);
    watch(addDividerDialog, () => {
      if (!addDividerDialog.value) {
        resetCurrentEditAction();
      }
    });
    const addDividerPreviousWord = ref<EpigraphicWord>();

    const addDivider = async () => {
      try {
        editTextLoading.value = true;

        const payload: AddDividerPayload = {
          type: 'addDivider',
          textUuid: props.textUuid,
          side: props.side,
          column: props.column,
          line: props.line,
          signUuidBefore: addDividerPreviousWord.value
            ? addDividerPreviousWord.value.signs[
                addDividerPreviousWord.value.signs.length - 1
              ].uuid
            : null,
        };
        await server.editText(payload);
        resetRenderer();
      } catch (err) {
        actions.showErrorSnackbar(
          'Error adding word divider. Please try again.',
          err as Error
        );
      } finally {
        addDividerDialog.value = false;
        resetCurrentEditAction();
        editTextLoading.value = false;
        addDividerPreviousWord.value = undefined;
      }
    };

    const editSignDialog = ref(false);
    watch(editSignDialog, () => {
      if (!editSignDialog.value) {
        resetCurrentEditAction();
      }
    });
    const signToEdit = ref<EpigraphicSign>();
    const wordBeingEdited = ref<EpigraphicWord>();

    const editUndeterminedSignsDialog = ref(false);
    watch(editUndeterminedSignsDialog, () => {
      if (!editUndeterminedSignsDialog.value) {
        resetCurrentEditAction();
      }
    });
    const undeterminedSignToEdit = ref<EpigraphicSign>();

    const editDividerDialog = ref(false);
    watch(editDividerDialog, () => {
      if (!editDividerDialog.value) {
        resetCurrentEditAction();
      }
    });
    const dividerToEdit = ref<EpigraphicSign>();

    const editDividerLoading = ref(false);
    const editDivider = async () => {
      try {
        editDividerLoading.value = true;

        if (!dividerToEdit.value) {
          throw new Error('No divider to edit');
        }

        const payload: EditDividerPayload = {
          type: 'editDivider',
          textUuid: props.textUuid,
          uuid: dividerToEdit.value.uuid,
          markup: dividerMarkupUnits.value,
        };

        await server.editText(payload);
        resetRenderer();
      } catch (err) {
        actions.showErrorSnackbar(
          'Error editing divider. Please try again.',
          err as Error
        );
      } finally {
        editDividerDialog.value = false;
        resetCurrentEditAction();
        editDividerLoading.value = false;
        dividerToEdit.value = undefined;
        dividerMarkupUnits.value = [];
      }
    };
    const dividerMarkupUnits = ref<MarkupUnit[]>([]);
    const updateDividerMarkup = (markup: MarkupUnit[]) => {
      dividerMarkupUnits.value = markup;
    };
    const markupIsDifferent = computed(() => {
      if (!dividerToEdit.value) {
        return false;
      }
      const originalMarkup = dividerToEdit.value.markups.sort((a, b) =>
        a.type.localeCompare(b.type)
      );
      const newMarkup = dividerMarkupUnits.value.sort((a, b) =>
        a.type.localeCompare(b.type)
      );

      if (originalMarkup.length !== newMarkup.length) {
        return true;
      }
      for (let i = 0; i < newMarkup.length; i++) {
        if (
          newMarkup[i].type !== originalMarkup[i].type ||
          newMarkup[i].startChar !== originalMarkup[i].startChar ||
          newMarkup[i].endChar !== originalMarkup[i].endChar ||
          newMarkup[i].altReading !== originalMarkup[i].altReading
        ) {
          return true;
        }
      }
      return false;
    });

    const reorderSignsDialog = ref(false);
    watch(reorderSignsDialog, () => {
      if (!reorderSignsDialog.value) {
        resetCurrentEditAction();
      }
    });
    const wordToReorderSignsIn = ref<EpigraphicWord>();

    const wordCanBeSelected = (word: EpigraphicWord) => {
      if (
        props.selectedWords
          .map(w => w.discourseUuid)
          .includes(word.discourseUuid)
      ) {
        return true;
      }

      if (props.selectedWords.length === 0) {
        return true;
      }

      if (props.selectedWords.length >= 2) {
        return false;
      }

      if (props.selectedWords.length === 1) {
        const selectedWord = props.selectedWords[0];
        const minObjOnTablet = Math.min(
          ...selectedWord.signs.map(s => s.objOnTablet)
        );
        const maxObjOnTablet = Math.max(
          ...selectedWord.signs.map(s => s.objOnTablet)
        );

        if (word.signs.map(s => s.objOnTablet).includes(minObjOnTablet - 1)) {
          return true;
        }

        if (word.signs.map(s => s.objOnTablet).includes(maxObjOnTablet + 1)) {
          return true;
        }
      }

      return false;
    };

    const handleSplitLine = (wordBefore: EpigraphicWord) => {
      const lastSign = wordBefore.signs[wordBefore.signs.length - 1];
      splitLineSignBefore.value = lastSign.uuid;
      splitLineDialog.value = true;
    };
    const splitLineDialog = ref(false);
    watch(splitLineDialog, () => {
      if (!splitLineDialog.value) {
        resetCurrentEditAction();
        splitLineSignBefore.value = undefined;
      }
    });
    const splitLineSignBefore = ref<string>();

    const splitLineLoading = ref(false);
    const splitLine = async () => {
      try {
        splitLineLoading.value = true;

        if (!splitLineSignBefore.value) {
          throw new Error('No sign before split line');
        }

        const payload: SplitLinePayload = {
          type: 'splitLine',
          textUuid: props.textUuid,
          side: props.side,
          column: props.column,
          line: props.line,
          previousUuid: splitLineSignBefore.value,
        };

        await server.editText(payload);
        resetRenderer();
      } catch (err) {
        actions.showErrorSnackbar(
          'Error splitting line. Please try again.',
          err as Error
        );
      } finally {
        splitLineDialog.value = false;
        resetCurrentEditAction();
        splitLineLoading.value = false;
        splitLineSignBefore.value = undefined;
      }
    };

    const splitWordDialog = ref(false);
    watch(splitWordDialog, () => {
      if (!splitWordDialog.value) {
        resetCurrentEditAction();
      }
    });
    const wordToSplit = ref<EpigraphicWord>();

    return {
      lineNumber,
      resetRenderer,
      resetCurrentEditAction,
      removeLineDialog,
      editTextLoading,
      removeLine,
      removeRegionDialog,
      removeRegion,
      removeUndeterminedLinesDialog,
      removeUndeterminedLines,
      handleWordClick,
      removeWordDialog,
      wordToRemove,
      removeWord,
      removeDividerDialog,
      dividerToRemove,
      removeDivider,
      removeSignDialog,
      signToRemove,
      handleSignClick,
      wordBeingRemovedFrom,
      lineCanBeSelected,
      handleRegionClick,
      editRegionDialog,
      regionLineToEdit,
      editUndeterminedLinesDialog,
      undeterminedLinesToEdit,
      handleInsertWord,
      addWordDialog,
      addWordPreviousWord,
      setupAddWordDialog,
      addSignDialog,
      wordToAddSignTo,
      addUndeterminedSignsDialog,
      wordToAddUndeterminedSignsTo,
      addDividerDialog,
      addDividerPreviousWord,
      addDivider,
      removeRegionDialogText,
      regionType,
      editSignDialog,
      signToEdit,
      wordBeingEdited,
      editUndeterminedSignsDialog,
      undeterminedSignToEdit,
      editDividerDialog,
      dividerToEdit,
      editDividerLoading,
      editDivider,
      dividerMarkupUnits,
      updateDividerMarkup,
      markupIsDifferent,
      reorderSignsDialog,
      wordToReorderSignsIn,
      wordCanBeSelected,
      handleSplitLine,
      splitLineDialog,
      splitLineSignBefore,
      splitLineLoading,
      splitLine,
      splitWordDialog,
      wordToSplit,
    };
  },
});
</script>

<style scoped>
.line-num {
  width: 25px;
}

.red-line-through {
  text-decoration: line-through;
  text-decoration-color: #f44336;
}

.blue-line-under {
  text-decoration: underline;
  text-decoration-color: #2196f3;
}

.cursor-display {
  cursor: pointer;
}
</style>
