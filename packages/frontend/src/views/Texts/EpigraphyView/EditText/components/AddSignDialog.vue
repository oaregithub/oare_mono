<template>
  <oare-dialog
    :value="value"
    @input="$emit('input', $event)"
    :persistent="false"
    :submitLoading="addSignLoading"
    :submitDisabled="step === 1 ? !stepOneComplete : !formsLoaded"
    @submit="step === 1 ? step++ : addSign()"
    :submitText="step === 1 ? 'Next' : 'Submit'"
    :width="600"
    :showActionButton="step === 2"
    actionButtonText="Back"
    @action="goBack"
  >
    <template #title>
      Add Sign to <span class="ml-1" v-html="wordToAddSignTo.reading" />
    </template>

    <div v-if="step === 1">
      <v-row justify="center" class="ma-0 mt-2">
        <span
          >Select the position where you would like to add the new sign.</span
        >
      </v-row>

      <v-row justify="center" align="center" class="mt-6 mb-6 oare-title">
        <insert-button
          @insert="insertIndex = 0"
          :showCheck="insertIndex === 0"
        />
        <span v-for="(sign, signIdx) in wordToAddSignTo.signs" :key="signIdx">
          <span class="mx-2" v-html="sign.reading" />
          <insert-button
            @insert="insertIndex = signIdx + 1"
            :showCheck="insertIndex === signIdx + 1"
          />
        </span>
      </v-row>

      <v-row
        v-if="insertIndex !== undefined"
        justify="center"
        class="ma-0 my-2"
      >
        Type the new sign below without markup.
      </v-row>

      <row
        v-if="insertIndex !== undefined"
        class="mt-10 mx-12"
        :autofocus="true"
        :isCurrentRow="true"
        :row="row"
        :showDeleteButton="false"
        :outlined="true"
        @update-row-content="row = $event"
        :restrictToSign="true"
      />

      <v-row
        v-if="insertIndex !== undefined"
        justify="center"
        class="ma-0 mt-2"
      >
        Markup will automatically be applied according to the surrounding signs.
      </v-row>

      <v-row
        v-if="insertIndex !== undefined"
        justify="center"
        class="ma-0 mb-2"
      >
        As needed, this can be edited manually later.
      </v-row>
    </div>

    <div v-if="step === 2">
      <v-row class="ma-0 my-4" justify="center">
        The word will be updated to become:
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
      <v-row class="ma-0 pa-0 mb-8" justify="center">
        <connect-discourse-item
          :word="editorDiscourseWord"
          @update-spelling-uuid="spellingUuid = $event"
          @loaded-forms="formsLoaded = true"
        />
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
import { TabletRenderer } from '@oare/oare';
import {
  EpigraphicUnitType,
  EpigraphicWord,
  RowTypes,
  AddSignPayload,
  EpigraphicUnitSide,
  MarkupType,
  EditorDiscourseWord,
} from '@oare/types';
import InsertButton from './InsertButton.vue';
import Row from '@/views/Texts/CollectionTexts/AddTexts/Editor/components/Row.vue';
import { RowWithLine } from '@/views/Texts/CollectionTexts/AddTexts/Editor/components/Column.vue';
import { v4 } from 'uuid';
import sl from '@/serviceLocator';
import ConnectDiscourseItem from '@/views/Texts/CollectionTexts/AddTexts/Discourse/components/ConnectDiscourseItem.vue';

export default defineComponent({
  props: {
    value: {
      type: Boolean,
      required: true,
    },
    renderer: {
      type: Object as PropType<TabletRenderer>,
      required: true,
    },
    textUuid: {
      type: String,
      required: true,
    },
    wordToAddSignTo: {
      type: Object as PropType<EpigraphicWord>,
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
    InsertButton,
    Row,
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

    const addSignLoading = ref(false);

    const insertIndex = ref<number>();

    const step = ref(1);

    const stepOneComplete = computed(() => {
      return (
        row.value &&
        row.value.signs &&
        row.value.signs.length > 0 &&
        row.value.signs.every(sign => sign.type) &&
        !row.value.hasErrors
      );
    });

    const addSign = async () => {
      try {
        addSignLoading.value = true;

        const newSpelling = getUpdatedSignsWithSeparators();

        if (
          !row.value.signs ||
          row.value.signs.length !== 1 ||
          insertIndex.value === undefined
        ) {
          throw new Error('Incorrect signs value. Cannot add at this time.');
        }

        const payload: AddSignPayload = {
          type: 'addSign',
          textUuid: props.textUuid,
          sign: row.value.signs[0],
          signUuidBefore:
            insertIndex.value === 0
              ? null
              : props.wordToAddSignTo.signs[insertIndex.value - 1].uuid,
          spellingUuid: spellingUuid.value || null,
          spelling: newSpelling,
          side: props.side,
          column: props.column,
          line: props.line,
          discourseUuid: props.wordToAddSignTo.discourseUuid,
        };
        await server.editText(payload);
        emit('reset-renderer');
      } catch (err) {
        actions.showErrorSnackbar(
          'Error adding sign. Please try again.',
          err as Error
        );
      } finally {
        emit('input', false);
        emit('reset-current-edit-action');
        addSignLoading.value = false;
      }
    };

    const spellingUuid = ref<string>();

    const getUpdatedSignsWithSeparators = () => {
      const pieces: {
        reading: string;
        type: EpigraphicUnitType | null;
        markup: MarkupType[];
      }[] = props.wordToAddSignTo.signs.map(sign => ({
        reading: sign.reading || '',
        type: sign.type,
        markup: sign.markups.map(unit => unit.type),
      }));

      const newSign = row.value.signs![0];

      const newPieces = [
        ...pieces.slice(0, insertIndex.value!),
        {
          reading: newSign.reading || '',
          type: newSign.readingType || null,
          markup: newSign.markup
            ? newSign.markup.markup.map(unit => unit.type)
            : [],
        },
        ...pieces.slice(insertIndex.value),
      ];

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
          } else if (
            sign.type === 'determinative' ||
            nextSign.type === 'determinative'
          ) {
            newSeparator = '';
          } else if (
            sign.type === 'phonogram' ||
            nextSign.type === 'phonogram'
          ) {
            newSeparator = '-';
          } else if (sign.type === 'number' && nextSign.type === 'number') {
            newSeparator = '+';
          } else if (sign.type === 'logogram' || nextSign.type === 'logogram') {
            newSeparator = '.';
          }
        }

        let newReading = sign.reading;
        if (sign.type === 'determinative') {
          newReading = `(${newReading})`;
        }

        return {
          ...sign,
          reading: newReading,
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
        .replace(/<[^>]*>/g, '');
    };

    const editorDiscourseWord: ComputedRef<EditorDiscourseWord> = computed(
      () => {
        const newWord = getUpdatedSignsWithSeparators();
        return {
          discourseUuid: props.wordToAddSignTo.discourseUuid,
          spelling: newWord,
          type: 'word',
        };
      }
    );

    const goBack = () => {
      step.value = 1;
      spellingUuid.value = undefined;
    };

    const formsLoaded = ref(false);

    return {
      addSignLoading,
      addSign,
      insertIndex,
      row,
      step,
      stepOneComplete,
      spellingUuid,
      getUpdatedSignsWithSeparators,
      editorDiscourseWord,
      goBack,
      formsLoaded,
    };
  },
});
</script>
