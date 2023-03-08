<template>
  <oare-dialog
    :value="value"
    @input="$emit('input', $event)"
    title="Edit Sign"
    :persistent="false"
    :submitLoading="editSignLoading"
    :submitDisabled="step === 1 ? !stepOneComplete : !formsLoaded"
    @submit="step === 1 ? step++ : editSign()"
    :submitText="step === 1 ? 'Next' : 'Submit'"
    :width="600"
    :showActionButton="step === 2"
    actionButtonText="Back"
    @action="goBack"
  >
    <div v-if="step === 1">
      <v-row justify="center" class="ma-0 my-2">
        Type the updated sign below without markup.
      </v-row>
      <row
        class="mt-4 mx-12"
        :autofocus="true"
        :isCurrentRow="true"
        :row="row"
        :showDeleteButton="false"
        :outlined="true"
        @update-row-content="row = $event"
        :restrictToSign="true"
      />
      <v-row justify="center" class="mt-6 mb-4">
        <v-btn color="info" @click="markupDialog = true">Edit Markup</v-btn>
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

    <oare-dialog
      v-model="markupDialog"
      title="Edit Sign Markup"
      :persistent="false"
      :showSubmit="false"
      :showCancel="false"
    >
      <v-row justify="center" class="ma-0">
        Select or unselect markup options.
      </v-row>
      <v-row justify="center" class="ma-0 mb-6">
        Some options have additional optional inputs.
      </v-row>
      <markup-selector
        v-if="row.signs && row.signs.length === 1"
        :newSign="row.signs[0]"
        :referenceUuid="sign.uuid"
        :existingMarkup="sign.markups"
        class="mx-4 mb-4"
        @update-markup="updateMarkup"
      />
    </oare-dialog>
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
  EpigraphicWord,
  EpigraphicUnitSide,
  EpigraphicSign,
  RowTypes,
  EditorDiscourseWord,
  EpigraphicUnitType,
  MarkupType,
  MarkupUnit,
  EditSignPayload,
} from '@oare/types';
import sl from '@/serviceLocator';
import { RowWithLine } from '@/views/Texts/CollectionTexts/AddTexts/Editor/components/Column.vue';
import { v4 } from 'uuid';
import Row from '@/views/Texts/CollectionTexts/AddTexts/Editor/components/Row.vue';
import ConnectDiscourseItem from '@/views/Texts/CollectionTexts/AddTexts/Discourse/components/ConnectDiscourseItem.vue';
import MarkupSelector from './MarkupSelector.vue';

export default defineComponent({
  props: {
    value: {
      type: Boolean,
      required: true,
    },
    sign: {
      type: Object as PropType<EpigraphicSign>,
      required: true,
    },
    word: {
      type: Object as PropType<EpigraphicWord>,
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
    ConnectDiscourseItem,
    MarkupSelector,
  },
  setup(props, { emit }) {
    const server = sl.get('serverProxy');
    const actions = sl.get('globalActions');

    const row = ref<RowWithLine>({
      type: 'Line' as RowTypes,
      uuid: v4(),
      isEditing: false,
      hasErrors: false,
      text:
        props.sign.reading
          ?.replace(/([[\]{}⸢⸣«»‹›:;*?\\!])|(".+")|('.+')|(^\/)+/g, '')
          .replace(/<[^>]*>/g, '')
          .replace(/\([^()]*\)/g, '') || undefined,
      line: 0,
    });

    const editSignLoading = ref(false);

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

    const editSign = async () => {
      try {
        editSignLoading.value = true;

        const newSpelling = getUpdatedSignsWithSeparators();

        if (!row.value.signs || row.value.signs.length !== 1) {
          throw new Error('Incorrect signs value. Cannot edit at this time.');
        }

        const payload: EditSignPayload = {
          type: 'editSign',
          textUuid: props.textUuid,
          uuid: props.sign.uuid,
          spelling: newSpelling,
          spellingUuid: spellingUuid.value || null,
          discourseUuid: props.word.discourseUuid,
          markup: markupUnits.value,
          sign: row.value.signs[0],
        };
        await server.editText(payload);
        emit('reset-renderer');
      } catch (err) {
        actions.showErrorSnackbar(
          'Error editing sign. Please try again.',
          err as Error
        );
      } finally {
        emit('input', false);
        emit('reset-current-edit-action');
        editSignLoading.value = false;
      }
    };

    const spellingUuid = ref<string>();

    const getUpdatedSignsWithSeparators = () => {
      const pieces: {
        reading: string;
        type: EpigraphicUnitType | null;
        markup: MarkupType[];
      }[] = props.word.signs.map(sign => ({
        reading: sign.reading || '',
        type: sign.type,
        markup: sign.markups.map(unit => unit.type),
      }));

      const newSign = row.value.signs![0];

      const indexOfSign = props.word.signs.findIndex(
        sign => sign.uuid === props.sign.uuid
      );

      const newPieces = [
        ...pieces.slice(0, indexOfSign),
        {
          reading: newSign.reading || '',
          type: newSign.readingType || null,
          markup: newSign.markup
            ? newSign.markup.markup.map(unit => unit.type)
            : [],
        },
        ...pieces.slice(indexOfSign + 1),
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

    const editorDiscourseWord: ComputedRef<EditorDiscourseWord> = computed(
      () => {
        const newWord = getUpdatedSignsWithSeparators();
        return {
          discourseUuid: props.word.discourseUuid,
          spelling: newWord,
          type: 'word',
        };
      }
    );

    const goBack = () => {
      step.value = 1;
      spellingUuid.value = undefined;
    };

    const markupUnits = ref<MarkupUnit[]>(props.sign.markups);
    const updateMarkup = (markup: MarkupUnit[]) => {
      markupUnits.value = markup;
    };

    const markupDialog = ref(false);

    const formsLoaded = ref(false);

    return {
      editSignLoading,
      editSign,
      row,
      step,
      stepOneComplete,
      spellingUuid,
      getUpdatedSignsWithSeparators,
      editorDiscourseWord,
      goBack,
      markupUnits,
      updateMarkup,
      markupDialog,
      formsLoaded,
    };
  },
});
</script>