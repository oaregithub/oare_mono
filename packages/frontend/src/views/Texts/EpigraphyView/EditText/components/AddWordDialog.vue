<template>
  <oare-dialog
    :value="value"
    @input="$emit('input', $event)"
    title="Add Word / Number"
    :persistent="false"
    :submitLoading="addWordLoading"
    @submit="step === 1 ? step++ : addWord()"
    :submitDisabled="
      step === 1
        ? !stepOneComplete
        : !formsLoaded && !editorDiscourseWord.type === 'number'
    "
    :submitText="step === 1 ? 'Next' : 'Submit'"
    :width="600"
    :showActionButton="step === 2"
    actionButtonText="Back"
    @action="goBack"
  >
    <div v-show="step === 1">
      <v-row justify="center" class="ma-0 mt-2">
        <span>Enter the new word below without markup.</span>
      </v-row>

      <row
        class="mt-6"
        :autofocus="true"
        :isCurrentRow="true"
        :row="row"
        :showDeleteButton="false"
        :outlined="true"
        @update-row-content="row = $event"
        :restrictToWord="true"
      />

      <v-row justify="center" class="ma-0 mt-2">
        Markup will automatically be applied according to the surrounding signs.
      </v-row>

      <v-row justify="center" class="ma-0 mb-2">
        As needed, this can be edited manually later.
      </v-row>
    </div>

    <div
      v-if="
        step === 2 && editorDiscourseWord && editorDiscourseWord.type === 'word'
      "
    >
      <v-row class="ma-0 pa-0 mb-4" justify="center">
        Use the interface below to connect the new word to the correct
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
      <v-row class="ma-0 pa-0 mb-8" justify="center">
        <connect-discourse-item
          :word="editorDiscourseWord"
          @update-spelling-uuid="spellingUuid = $event"
          @loaded-forms="formsLoaded = true"
        />
      </v-row>
    </div>

    <div
      v-if="
        step === 2 &&
        editorDiscourseWord &&
        editorDiscourseWord.type === 'number'
      "
    >
      <v-row class="ma-0 pa-0 mb-4" justify="center">
        Adding a number does not require any additional information.
      </v-row>

      <v-row class="ma-0 pa-0 mb-4" justify="center">
        Click submit to add the number
        <b class="mx-1">{{ editorDiscourseWord.spelling }}</b>
        to the text.
      </v-row>
    </div>
  </oare-dialog>
</template>

<script lang="ts">
import {
  defineComponent,
  PropType,
  ref,
  computed,
  ComputedRef,
} from '@vue/composition-api';
import {
  EpigraphicWord,
  EpigraphicUnitSide,
  RowTypes,
  RowContent,
  AddWordEditPayload,
  EditorDiscourseWord,
} from '@oare/types';
import sl from '@/serviceLocator';
import { TabletRenderer } from '@oare/oare';
import Row from '@/views/Texts/CollectionTexts/AddTexts/Editor/components/Row.vue';
import { RowWithLine } from '@/views/Texts/CollectionTexts/AddTexts/Editor/components/Column.vue';
import { v4 } from 'uuid';
import GrammarDisplay from '@/views/DictionaryWord/components/WordInfo/components/Forms/components/GrammarDisplay.vue';
import ConnectDiscourseItem from '../../../CollectionTexts/AddTexts/Discourse/components/ConnectDiscourseItem.vue';

export default defineComponent({
  props: {
    value: {
      type: Boolean,
      required: true,
    },
    previousWord: {
      type: Object as PropType<EpigraphicWord>,
      required: false,
    },
    textUuid: {
      type: String,
      required: true,
    },
    renderer: {
      type: Object as PropType<TabletRenderer>,
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
    line: {
      type: Number,
      required: true,
    },
  },
  components: {
    Row,
    GrammarDisplay,
    ConnectDiscourseItem,
  },
  setup(props, { emit }) {
    const server = sl.get('serverProxy');
    const actions = sl.get('globalActions');

    const row = ref<RowWithLine>({
      type: 'Line' as RowTypes,
      uuid: v4(),
      isEditing: false,
      hasErrors: false,
      text: '',
      line: 0,
    });

    const addWordLoading = ref(false);

    const addWord = async () => {
      try {
        addWordLoading.value = true;
        if (!row.value) {
          throw new Error('No row data');
        }

        if (row.value.words?.length !== 1) {
          throw new Error('More than one word entered for addition');
        }

        const rowContent: RowContent = {
          uuid: row.value.uuid,
          type: 'Line',
          lines: [],
          value: 1,
          text: row.value.text,
          signs: row.value.signs,
          words: row.value.words,
          reading: row.value.reading,
          hasErrors: row.value.hasErrors,
        };

        const payload: AddWordEditPayload = {
          type: 'addWord',
          textUuid: props.textUuid,
          side: props.side,
          column: props.column,
          line: props.line,
          row: rowContent,
          previousWord: props.previousWord,
          spellingUuid: spellingUuid.value || undefined,
        };
        await server.editText(payload);
        emit('reset-renderer');
      } catch (err) {
        actions.showErrorSnackbar(
          'Error adding word. Please try again.',
          err as Error
        );
      } finally {
        addWordLoading.value = false;
        emit('reset-current-edit-action');
        emit('input', false);
      }
    };

    const stepOneComplete = computed(() => {
      return (
        row.value &&
        row.value.signs &&
        row.value.signs.length > 0 &&
        row.value.signs.every(sign => sign.type) &&
        !row.value.hasErrors
      );
    });

    const step = ref(1);

    const spellingUuid = ref<string | null>(null);

    const editorDiscourseWord: ComputedRef<EditorDiscourseWord | undefined> =
      computed(() => {
        if (row.value && row.value.words) {
          return {
            ...row.value.words[0],
            type:
              row.value.signs &&
              row.value.signs.every(sign => sign.readingType === 'number')
                ? 'number'
                : 'word',
          };
        } else {
          return undefined;
        }
      });

    const goBack = () => {
      step.value = 1;
      spellingUuid.value = null;
    };

    const formsLoaded = ref(false);

    return {
      row,
      addWordLoading,
      addWord,
      stepOneComplete,
      step,
      spellingUuid,
      editorDiscourseWord,
      goBack,
      formsLoaded,
    };
  },
});
</script>
