<template>
  <div>
    <v-card flat min-height="700px">
      <v-row justify="space-around" class="ma-0">
        <edit-column
          v-for="(column, idx) in renderer.columnsOnSide(side)"
          :key="idx"
          :column="column"
          :renderer="renderer"
          :side="side"
          :textUuid="textUuid"
          :currentEditAction="currentEditAction"
          :selectedLines="selectedLines"
          @reset-current-edit-action="resetCurrentEditAction"
          @reset-renderer="resetRenderer"
          @toggle-select-line="handleSelectLine($event)"
          :selectedWords="selectedWords"
          @toggle-select-word="handleSelectWord($event)"
        />
      </v-row>
    </v-card>

    <oare-dialog
      v-model="addColumnDialog"
      :title="`Add Column to ${side}`"
      :persistent="false"
      :submitLoading="editTextLoading"
      :submitDisabled="columnToAdd === undefined"
      @submit="addColumn"
    >
      <v-row class="ma-0"
        >Select where you would like to add a new column.</v-row
      >
      <v-row justify="center" align="center" class="mt-8 mb-6">
        <insert-button
          @insert="columnToAdd = 1"
          :showCheck="columnToAdd === 1"
        />
        <span v-for="(col, idx) in renderer.columnsOnSide(side)" :key="idx">
          <v-icon size="80" class="mx-2">mdi-text-long</v-icon>
          <insert-button
            @insert="columnToAdd = idx + 2"
            :showCheck="columnToAdd === idx + 2"
          />
        </span>
      </v-row>
    </oare-dialog>

    <oare-dialog
      v-model="mergeLineDialog"
      title="Merge Lines?"
      :persistent="false"
      submitText="Yes"
      cancelText="No"
      :submitLoading="editTextLoading"
      @submit="mergeLines"
      >Are you sure you want to merge lines {{ Math.min(...selectedLines) }} and
      {{ Math.max(...selectedLines) }}? The content on these lines will
      subsequently all appear on line
      {{ Math.min(...selectedLines) }}.</oare-dialog
    >

    <oare-dialog
      v-model="mergeWordsDialog"
      title="Merge Words/Numbers"
      :persistent="false"
      :submitLoading="editTextLoading"
      @submit="mergeWords"
      :submitDisabled="!mergeWordsFormsLoaded"
      :width="600"
      :key="selectedWords"
      ><v-row class="ma-0 my-4" justify="center">
        The new word will become:
        <b class="ml-1" v-html="getUpdatedSignsWithSeparators()"
      /></v-row>

      <v-row class="ma-0 pa-0 mb-4" justify="center">
        Use the interface below to connect the updated word to the correct
        dictionary spelling.
      </v-row>
      <v-row class="ma-0 pa-0 mb-8" justify="center">
        Click on the word to view the available options for selection. In some
        cases, a selection will have been made automatically based on a
        spelling's prevalence. The selection bubble appears red when there are
        no matching options, yellow when there are available options but none
        have been automatically selected, and green if an option has been
        selected, whether automatically or manually. Automatic selections can
        also be disconnected or changed by clicking on the word.
      </v-row>
      <v-row v-if="editorDiscourseWord" class="ma-0 pa-0 mb-8" justify="center">
        <connect-discourse-item
          :word="editorDiscourseWord"
          @update-spelling-uuid="mergeWordsSpellingUuid = $event"
          @loaded-forms="mergeWordsFormsLoaded = true"
        /> </v-row
    ></oare-dialog>
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
import {
  EpigraphicUnitSide,
  EditTextAction,
  AddColumnPayload,
  MergeLinePayload,
  MergeWordPayload,
  EpigraphicWord,
  EditorDiscourseWord,
  EpigraphicUnitType,
  MarkupType,
} from '@oare/types';
import EditColumn from './EditColumn.vue';
import sl from '@/serviceLocator';
import InsertButton from './InsertButton.vue';
import ConnectDiscourseItem from '@/views/Texts/CollectionTexts/AddTexts/Discourse/components/ConnectDiscourseItem.vue';

export default defineComponent({
  props: {
    renderer: {
      type: Object as PropType<TabletRenderer>,
      required: true,
    },
    side: {
      type: String as PropType<EpigraphicUnitSide>,
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
  },
  components: {
    EditColumn,
    InsertButton,
    ConnectDiscourseItem,
  },
  setup(props, { emit }) {
    const server = sl.get('serverProxy');
    const actions = sl.get('globalActions');

    const editTextLoading = ref(false);

    const addColumnDialog = ref(false);
    const columnToAdd = ref<number>();
    const addColumn = async () => {
      try {
        editTextLoading.value = true;

        if (columnToAdd.value === undefined) {
          throw new Error('No column selected');
        }

        const payload: AddColumnPayload = {
          type: 'addColumn',
          textUuid: props.textUuid,
          side: props.side,
          column: columnToAdd.value,
        };
        await server.editText(payload);
        resetRenderer();
      } catch (err) {
        actions.showErrorSnackbar(
          'Error adding column. Please try again.',
          err as Error
        );
      } finally {
        addColumnDialog.value = false;
        resetCurrentEditAction();
        editTextLoading.value = false;
        columnToAdd.value = undefined;
      }
    };
    watch(addColumnDialog, () => {
      if (!addColumnDialog.value) {
        columnToAdd.value = undefined;
        resetCurrentEditAction();
      }
    });

    const resetRenderer = () => {
      emit('reset-renderer');
    };

    const resetCurrentEditAction = () => {
      emit('reset-current-edit-action');
    };

    watch(
      () => props.currentEditAction,
      () => {
        if (props.currentEditAction === 'addColumn') {
          addColumnDialog.value = true;
        }
      }
    );

    const mergeLineDialog = ref(false);
    const selectedLines = ref<number[]>([]);
    const handleSelectLine = (line: number) => {
      if (selectedLines.value.includes(line)) {
        selectedLines.value = selectedLines.value.filter(l => l !== line);
      } else {
        selectedLines.value.push(line);
      }
    };
    watch(selectedLines, () => {
      if (selectedLines.value.length === 2) {
        mergeLineDialog.value = true;
      }
    });
    watch(mergeLineDialog, () => {
      if (!mergeLineDialog.value) {
        selectedLines.value = [];
        resetCurrentEditAction();
      }
    });
    const mergeLines = async () => {
      try {
        editTextLoading.value = true;
        if (selectedLines.value.length !== 2) {
          throw new Error('Two lines must be selected in order to merge.');
        }
        const payload: MergeLinePayload = {
          type: 'mergeLine',
          textUuid: props.textUuid,
          firstLine: Math.min(...selectedLines.value),
          secondLine: Math.max(...selectedLines.value),
        };
        await server.editText(payload);
        resetRenderer();
      } catch (err) {
        actions.showErrorSnackbar('Error merging lines. Please try again.');
      } finally {
        selectedLines.value = [];
        mergeLineDialog.value = false;
        resetCurrentEditAction();
        editTextLoading.value = false;
      }
    };

    const mergeWordsDialog = ref(false);
    const selectedWords = ref<EpigraphicWord[]>([]);
    const handleSelectWord = (word: EpigraphicWord) => {
      if (
        selectedWords.value
          .map(w => w.discourseUuid!)
          .includes(word.discourseUuid!)
      ) {
        selectedWords.value = selectedWords.value.filter(
          w => w.discourseUuid! !== word.discourseUuid!
        );
      } else {
        selectedWords.value.push(word);
      }
    };
    watch(selectedWords, () => {
      if (selectedWords.value.length === 2) {
        mergeWordsDialog.value = true;
      }
    });
    watch(mergeWordsDialog, () => {
      if (!mergeWordsDialog.value) {
        selectedWords.value = [];
        mergeWordsFormsLoaded.value = false;
        mergeWordsSpellingUuid.value = undefined;
        resetCurrentEditAction();
      }
    });
    const mergeWords = async () => {
      try {
        editTextLoading.value = true;
        if (selectedWords.value.length !== 2) {
          throw new Error('Two words must be selected in order to merge.');
        }
        const payload: MergeWordPayload = {
          type: 'mergeWord',
          textUuid: props.textUuid,
          discourseUuids: selectedWords.value.map(w => w.discourseUuid!),
          spelling: getUpdatedSignsWithSeparators(),
          spellingUuid: mergeWordsSpellingUuid.value || null,
        };
        await server.editText(payload);
        resetRenderer();
      } catch (err) {
        actions.showErrorSnackbar('Error merging words. Please try again.');
      } finally {
        selectedWords.value = [];
        mergeWordsDialog.value = false;
        resetCurrentEditAction();
        editTextLoading.value = false;
      }
    };
    const mergeWordsFormsLoaded = ref(false);
    const mergeWordsSpellingUuid = ref<string>();
    const editorDiscourseWord: ComputedRef<EditorDiscourseWord | undefined> =
      computed(() => {
        if (selectedWords.value.length === 0) {
          return undefined;
        }
        const newWord = getUpdatedSignsWithSeparators();
        return {
          discourseUuid: selectedWords.value[0].discourseUuid,
          spelling: newWord,
          type: 'word',
        };
      });

    const getUpdatedSignsWithSeparators = () => {
      if (selectedWords.value.length !== 2) {
        return '';
      }

      const firstMin = Math.min(
        ...selectedWords.value[0].signs.map(sign => sign.objOnTablet)
      );
      const secondMin = Math.min(
        ...selectedWords.value[1].signs.map(sign => sign.objOnTablet)
      );

      const firstIndexIsFirstPiece = firstMin < secondMin;

      const firstPieces: {
        reading: string;
        type: EpigraphicUnitType | null;
        markup: MarkupType[];
      }[] = selectedWords.value[firstIndexIsFirstPiece ? 0 : 1].signs.map(
        sign => ({
          reading: sign.reading || '',
          type: sign.type,
          markup: sign.markups.map(unit => unit.type),
        })
      );

      const secondPieces: {
        reading: string;
        type: EpigraphicUnitType | null;
        markup: MarkupType[];
      }[] = selectedWords.value[firstIndexIsFirstPiece ? 1 : 0].signs.map(
        sign => ({
          reading: sign.reading || '',
          type: sign.type,
          markup: sign.markups.map(unit => unit.type),
        })
      );

      const newPieces = [...firstPieces, ...secondPieces];

      const newWord = newPieces.map((sign, index) => {
        const nextSign =
          index !== newPieces.length - 1 ? newPieces[index + 1] : null;

        let newSeparator = '';
        if (nextSign) {
          if (
            !sign.markup.includes('phoneticComplement') &&
            nextSign.markup.includes('phoneticComplement')
          ) {
            newSeparator = '';
          }
          if (
            sign.type === 'determinative' ||
            nextSign.type === 'determinative'
          ) {
            newSeparator = '';
          }
          if (sign.type === 'phonogram' || nextSign.type === 'phonogram') {
            newSeparator = '-';
          }
          if (sign.type === 'number' && nextSign.type === 'number') {
            newSeparator = '+';
          }
          if (sign.type === 'logogram' || nextSign.type === 'logogram') {
            newSeparator = '.';
          }
        }

        return {
          ...sign,
          separator: newSeparator,
        };
      });

      let newWordReading = '';
      newWord.forEach(sign => {
        newWordReading += sign.reading;
        if (sign.separator) {
          newWordReading += sign.separator;
        }
      });
      return newWordReading
        .replace(/([[\]{}⸢⸣«»‹›:;*?\\!])|(".+")|('.+')|(^\/)+/g, '')
        .replace(/<[^>]*>/g, '')
        .replace(/\([^()]*\)/g, '');
    };

    return {
      editTextLoading,
      addColumnDialog,
      addColumn,
      resetRenderer,
      resetCurrentEditAction,
      selectedLines,
      handleSelectLine,
      mergeLineDialog,
      mergeLines,
      columnToAdd,
      mergeWordsDialog,
      selectedWords,
      handleSelectWord,
      mergeWords,
      mergeWordsFormsLoaded,
      mergeWordsSpellingUuid,
      editorDiscourseWord,
      getUpdatedSignsWithSeparators,
    };
  },
});
</script>
