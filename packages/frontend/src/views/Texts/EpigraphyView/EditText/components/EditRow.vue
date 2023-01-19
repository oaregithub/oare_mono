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
        class="mr-2"
        @click="removeLineDialog = true"
        ><v-icon small>mdi-delete</v-icon></v-btn
      >

      <v-btn
        v-if="currentEditAction === 'removeRegion' && renderer.isRegion(line)"
        icon
        color="red"
        small
        class="mr-2"
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
        class="mr-2"
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
        class="mt-n1"
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
                ((currentEditAction === 'editRegion' &&
                  renderer.isRegion(line)) ||
                  (currentEditAction === 'editUndeterminedLines' &&
                    renderer.isUndetermined(line))),
            }"
            @click="handleRegionClick(line)"
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
          <v-hover v-slot="{ hover }">
            <span
              :class="{
                'red-line-through cursor-display':
                  hover &&
                  ((currentEditAction === 'removeWord' && !word.isDivider) ||
                    (currentEditAction === 'removeDivider' && word.isDivider)),
                'blue-line-under cursor-display':
                  hover &&
                  (currentEditAction === 'addSign' ||
                    currentEditAction === 'addUndeterminedSigns'),
              }"
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
                          (currentEditAction === 'removeUndeterminedSigns' &&
                            sign.epigType === 'undeterminedSigns')),
                    }"
                    @click="handleSignClick(word, sign)"
                  />
                </v-hover>
                <span>{{ sign.separator }}</span>
              </span>
            </span>
          </v-hover>
          <insert-button
            v-if="
              currentEditAction === 'addWord' ||
              currentEditAction === 'addDivider'
            "
            class="ml-2"
            @insert="handleInsertWord(word)"
          />
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
      :title="`Remove region?`"
      submitText="Yes"
      cancelText="No"
      :persistent="false"
      @submit="removeRegion"
      :submitLoading="editTextLoading"
      >Are you sure you want to remove this region?</oare-dialog
    >

    <oare-dialog
      v-model="removeUndeterminedLinesDialog"
      :title="`Remove undetermined lines?`"
      submitText="Yes"
      cancelText="No"
      :persistent="false"
      @submit="removeUndeterminedLines"
      :submitLoading="editTextLoading"
      >Are you sure you want to remove these undetermined lines?</oare-dialog
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
      :title="`Remove Divider?`"
      submitText="Yes"
      cancelText="No"
      :persistent="false"
      @submit="removeDivider"
      :submitLoading="editTextLoading"
      >Are you sure you want to remove this divider from line {{ line }}?
      <b>WARNING: </b>If the divider you are removing is the only unit on its
      line, the line will also be removed.</oare-dialog
    >

    <edit-region-dialog
      v-if="regionLineToEdit"
      v-model="editRegionDialog"
      :line="regionLineToEdit"
      :textUuid="textUuid"
      :renderer="renderer"
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
      :key="addWordPreviousWord"
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
      :key="wordToAddSignTo"
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
      :key="wordToAddUndeterminedSignsTo"
      :textUuid="textUuid"
      @reset-renderer="resetRenderer"
      @reset-current-edit-action="resetCurrentEditAction"
      :renderer="renderer"
      :line="line"
    />

    <oare-dialog
      v-model="addDividerDialog"
      title="Add Divider?"
      submitText="Yes"
      cancelText="No"
      :persistent="false"
      @submit="addDivider"
      :submitLoading="editTextLoading"
    >
      <span v-if="addDividerPreviousWord"
        >Are you sure you want to add a divider to line {{ line }} after the
        word <b v-html="addDividerPreviousWord.reading" />?</span
      >
      <span v-else
        >Are you sure you want to add a divider to the beginning of line
        {{ line }}?</span
      >
    </oare-dialog>
  </div>
</template>

<script lang="ts">
import {
  defineComponent,
  PropType,
  ref,
  watch,
  computed,
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
} from '@oare/types';
import sl from '@/serviceLocator';
import RemoveSignDialog from './RemoveSignDialog.vue';
import EditRegionDialog from './EditRegionDialog.vue';
import EditUndeterminedLinesDialog from './EditUndeterminedLinesDialog.vue';
import InsertButton from './InsertButton.vue';
import AddWordDialog from './AddWordDialog.vue';
import AddSignDialog from './AddSignDialog.vue';
import AddUndeterminedSignsDialog from './AddUndeterminedSignsDialog.vue';

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
  },
  components: {
    RemoveSignDialog,
    EditRegionDialog,
    EditUndeterminedLinesDialog,
    InsertButton,
    AddWordDialog,
    AddSignDialog,
    AddUndeterminedSignsDialog,
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
        const payload: RemoveRegionPayload = {
          type: 'removeRegion',
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
            'Cannot remove undetermined lines with more than one unit on line.'
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
          'Error removing undetermined lines. Please try again.',
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
          throw new Error('No divider selected for removal.');
        } else if (dividerToRemove.value.uuids.length > 1) {
          throw new Error('Cannot remove divider with more than one UUID.');
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
          'Error removing divider. Please try again.',
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
      }
    };

    const handleRegionClick = (line: number) => {
      if (props.currentEditAction === 'editRegion') {
        regionLineToEdit.value = line;
        editRegionDialog.value = true;
      } else if (props.currentEditAction === 'editUndeterminedLines') {
        undeterminedLinesToEdit.value = line;
        editUndeterminedLinesDialog.value = true;
      }
    };

    const editRegionDialog = ref(false);
    const regionLineToEdit = ref<number>();
    watch(editRegionDialog, () => {
      if (!editRegionDialog.value) {
        regionLineToEdit.value = undefined;
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
          'Error adding divider. Please try again.',
          err as Error
        );
      } finally {
        addDividerDialog.value = false;
        resetCurrentEditAction();
        editTextLoading.value = false;
        addDividerPreviousWord.value = undefined;
      }
    };

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
