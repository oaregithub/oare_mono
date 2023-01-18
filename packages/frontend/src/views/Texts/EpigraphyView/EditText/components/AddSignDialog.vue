<template>
  <oare-dialog
    :value="value"
    @input="$emit('input', $event)"
    :persistent="false"
    :submitLoading="addSignLoading"
    :submitDisabled="step !== 2 || formsLoading"
    @submit="addSign"
    :width="600"
  >
    <template #title>
      Add Sign to <span class="ml-1" v-html="wordToAddSignTo.reading" />
    </template>

    <div v-show="step === 1">
      <v-row justify="center" class="ma-0 mt-2">
        <span
          >Select the position where you would like to add the new sign.</span
        >
      </v-row>

      <v-row justify="center" align="center" class="mt-6 mb-6 oare-title">
        <insert-button v-if="insertIndex !== 0" @insert="insertIndex = 0" />
        <v-btn
          v-else
          fab
          x-small
          dark
          color="info"
          width="25px"
          height="25px"
          elevation="0"
        >
          <v-icon> mdi-check </v-icon>
        </v-btn>
        <span v-for="(sign, signIdx) in wordToAddSignTo.signs" :key="signIdx">
          <span class="mx-2" v-html="sign.reading" />
          <insert-button
            v-if="insertIndex !== signIdx + 1"
            @insert="insertIndex = signIdx + 1"
          />
          <v-btn
            v-else
            fab
            x-small
            dark
            color="info"
            width="25px"
            height="25px"
            elevation="0"
          >
            <v-icon> mdi-check </v-icon>
          </v-btn>
        </span>
      </v-row>

      <v-row
        v-if="insertIndex !== undefined"
        justify="center"
        class="ma-0 my-2"
      >
        Type the new sign below.
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

      <v-row class="ma-0 mt-8" justify="center">
        <v-btn color="primary" :disabled="!stepOneComplete" @click="step = 2"
          >Next Step</v-btn
        >
      </v-row>
    </div>

    <div v-if="step === 2">
      <v-row class="ma-0 mt-4">
        The word will be updated to become:
        <b class="ml-1" v-html="getUpdatedSignsWithSeparators()"
      /></v-row>

      <v-progress-linear class="mt-4" indeterminate v-if="formsLoading" />

      <v-row v-else-if="forms.length > 0" class="ma-0 mt-4">
        <span
          ><b class="mr-1" v-html="getUpdatedSignsWithSeparators()" />appears in
          the following lexical form(s). Select the appropriate form to link
          this occurrence to the dictionary. You may submit without selecting a
          lexical form, but please note that the word will not be properly
          connected.</span
        >
      </v-row>
      <v-row v-else class="ma-0 mt-4">
        <span
          ><b class="mr-1" v-html="getUpdatedSignsWithSeparators()" />does not
          appear in any forms. As such, it cannot be connected to the dictionary
          at this time.</span
        >
      </v-row>

      <div v-if="!formsLoading && forms.length > 0">
        <v-row class="ma-0 mt-4">
          <v-radio-group v-model="selectedOption">
            <v-radio
              v-for="option in forms"
              :key="option.spellingUuid"
              :value="option.spellingUuid"
            >
              <template #label>
                <b class="mr-1">{{ option.word }} - </b>
                <b class="mr-1">
                  <i>{{ option.form.form }}</i>
                </b>
                <grammar-display :form="option.form" :allowEditing="false" />
              </template>
            </v-radio>
          </v-radio-group>
        </v-row>
        <v-row class="ma-0">
          <v-btn
            v-if="forms.length > 0"
            @click="selectedOption = undefined"
            color="primary"
            :disabled="!selectedOption"
          >
            Disconnect
          </v-btn>
        </v-row>
      </div>
    </div>
  </oare-dialog>
</template>

<script lang="ts">
import {
  defineComponent,
  PropType,
  ref,
  computed,
  watch,
} from '@vue/composition-api';
import { TabletRenderer } from '@oare/oare';
import {
  EpigraphicUnitType,
  EpigraphicWord,
  RowTypes,
  SearchSpellingResultRow,
  AddSignPayload,
  EpigraphicUnitSide,
} from '@oare/types';
import InsertButton from './InsertButton.vue';
import Row from '@/views/Texts/CollectionTexts/AddTexts/Editor/components/Row.vue';
import { RowWithLine } from '@/views/Texts/CollectionTexts/AddTexts/Editor/components/Column.vue';
import { v4 } from 'uuid';
import sl from '@/serviceLocator';
import GrammarDisplay from '@/views/DictionaryWord/components/WordInfo/components/Forms/components/GrammarDisplay.vue';

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
    GrammarDisplay,
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

        const newSpelling = getUpdatedSignsWithSeparators().replace(
          /<[^>]*>/g,
          ''
        );

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
          spellingUuid: selectedOption.value || null,
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

    const forms = ref<SearchSpellingResultRow[]>([]);
    const selectedOption = ref<string>();
    const formsLoading = ref(false);

    watch(step, async () => {
      if (step.value === 2) {
        try {
          formsLoading.value = true;
          const searchString = getUpdatedSignsWithSeparators().replace(
            /<[^>]*>/g,
            ''
          );
          forms.value = await server.searchSpellings(searchString);
        } catch (err) {
          actions.showErrorSnackbar(
            'Error loading spelling options. Please try again.',
            err as Error
          );
        } finally {
          formsLoading.value = false;
        }
      }
    });

    const getUpdatedSignsWithSeparators = () => {
      const pieces: {
        reading: string;
        type: EpigraphicUnitType | null;
      }[] = props.wordToAddSignTo.signs.map(sign => ({
        reading: sign.reading || '',
        type: sign.type,
      }));

      const newSign = row.value.signs![0];

      const newPieces = [
        ...pieces.slice(0, insertIndex.value!),
        {
          reading: newSign.reading || '',
          type: newSign.readingType || null,
        },
        ...pieces.slice(insertIndex.value),
      ];

      const newWord = newPieces.map((sign, index) => {
        const nextSign =
          index !== newPieces.length - 1 ? newPieces[index + 1] : null;

        let newSeparator = '';
        if (nextSign) {
          // FIXME support for PC
          /* if (
            !sign.markups
              .map(unit => unit.type)
              .includes('phoneticComplement') &&
            nextSign.markups
              .map(unit => unit.type)
              .includes('phoneticComplement')
          ) {
            newSeparator = '';
          } */
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
      return newWordReading;
    };

    return {
      addSignLoading,
      addSign,
      insertIndex,
      row,
      step,
      stepOneComplete,
      forms,
      formsLoading,
      selectedOption,
      getUpdatedSignsWithSeparators,
    };
  },
});
</script>
