<template>
  <oare-dialog
    :value="value"
    @input="$emit('input', $event)"
    title="Add Line"
    :persistent="false"
    :submitLoading="addLineLoading"
    @submit="step === 1 ? step++ : addLine()"
    :submitDisabled="!stepOneComplete"
    :width="800"
    :submitText="step === 1 ? 'Next' : 'Submit'"
    :showActionButton="step === 2"
    actionButtonText="Back"
    @action="goBack"
  >
    <div v-if="step === 1">
      <v-row class="ma-0 mx-12">
        <special-chars />
      </v-row>
      <row
        class="mt-12"
        :autofocus="true"
        :isCurrentRow="true"
        :row="row"
        :showDeleteButton="false"
        :outlined="true"
        @update-row-content="row = $event"
      />
    </div>
    <div v-else-if="step === 2">
      <v-row class="ma-0 pa-0 mb-4" justify="center">
        Use the interface below to connect the each word on the new line to the
        correct dictionary spelling.
      </v-row>
      <v-row class="ma-0 pa-0 mb-8" justify="center">
        Click on a word to view the available options for selection. In some
        cases, a selection will have been made automatically based on a
        spelling's prevalence. The selection bubble appears red when there are
        no matching options, yellow when there are available options but none
        have been automatically selected, and green if an option has been
        selected, whether automatically or manually. Automatic selections can
        also be disconnected or changed by clicking on the word.
      </v-row>
      <v-row class="ma-0 pa-0 mb-8" justify="center">
        <connect-discourse-item
          v-for="(word, idx) in editorDiscourseWords"
          :key="idx"
          :word="word"
          class="mx-1"
          @update-spelling-uuid="
            setDiscourseSpelling(word.discourseUuid, $event)
          "
        />
      </v-row>
    </div>
  </oare-dialog>
</template>

<script lang="ts">
import {
  defineComponent,
  ref,
  PropType,
  computed,
  ComputedRef,
} from '@vue/composition-api';
import sl from '@/serviceLocator';
import { TabletRenderer } from '@oare/oare';
import Row from '@/views/Texts/CollectionTexts/AddTexts/Editor/components/Row.vue';
import { RowWithLine } from '@/views/Texts/CollectionTexts/AddTexts/Editor/components/Column.vue';
import {
  AddLinePayload,
  RowTypes,
  EpigraphicUnitSide,
  RowContent,
  DiscourseSpelling,
  EditorDiscourseWord,
} from '@oare/types';
import SpecialChars from '@/views/Texts/CollectionTexts/AddTexts/Editor/components/SpecialChars.vue';
import { v4 } from 'uuid';
import ConnectDiscourseItem from '@/views/Texts/CollectionTexts/AddTexts/Discourse/components/ConnectDiscourseItem.vue';

export default defineComponent({
  props: {
    value: {
      type: Boolean,
      required: true,
    },
    previousLineNumber: {
      type: Number,
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
  },
  components: {
    Row,
    SpecialChars,
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

    const addLineLoading = ref(false);

    const addLine = async () => {
      try {
        addLineLoading.value = true;
        if (!row.value) {
          throw new Error('No row data');
        }

        let previousObjectOnTablet: number | undefined = undefined;
        if (props.previousLineNumber) {
          const unitsOnPreviousLine = props.renderer.getUnitsOnLine(
            props.previousLineNumber
          );
          previousObjectOnTablet =
            unitsOnPreviousLine[unitsOnPreviousLine.length - 1].objOnTablet;
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
        const payload: AddLinePayload = {
          type: 'addLine',
          textUuid: props.textUuid,
          side: props.side,
          column: props.column,
          row: rowContent,
          previousObjectOnTablet,
          discourseSpellings: discourseSpellings.value,
        };
        await server.editText(payload);
        emit('reset-renderer');
      } catch (err) {
        actions.showErrorSnackbar(
          'Error adding line. Please try again.',
          err as Error
        );
      } finally {
        addLineLoading.value = false;
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

    const discourseSpellings = ref<DiscourseSpelling[]>([]);
    const setDiscourseSpelling = (
      discourseUuid: string,
      spellingUuid: string | null
    ) => {
      discourseSpellings.value = discourseSpellings.value.filter(
        item => item.discourseUuid !== discourseUuid
      );
      if (spellingUuid) {
        discourseSpellings.value.push({
          discourseUuid,
          spellingUuid,
        });
      }
    };

    const editorDiscourseWords: ComputedRef<EditorDiscourseWord[]> = computed(
      () => {
        return row.value && row.value.words
          ? row.value.words.map(word => ({
              ...word,
              type:
                row.value.signs &&
                row.value.signs
                  .filter(sign => sign.discourseUuid === word.discourseUuid)
                  .every(sign => sign.readingType === 'number')
                  ? 'number'
                  : 'word',
            }))
          : [];
      }
    );

    const goBack = () => {
      step.value = 1;
      discourseSpellings.value = [];
    };

    return {
      addLineLoading,
      addLine,
      row,
      stepOneComplete,
      step,
      discourseSpellings,
      setDiscourseSpelling,
      editorDiscourseWords,
      goBack,
    };
  },
});
</script>
