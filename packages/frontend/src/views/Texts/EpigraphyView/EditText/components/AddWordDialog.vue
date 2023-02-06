<template>
  <oare-dialog
    :value="value"
    @input="$emit('input', $event)"
    title="Add Word"
    :persistent="false"
    :submitLoading="addWordLoading"
    @submit="addWord"
    :submitDisabled="!stepTwoComplete"
    :width="600"
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

      <v-row class="ma-0 mt-8" justify="center">
        <v-btn color="primary" :disabled="!stepOneComplete" @click="step = 2"
          >Next Step</v-btn
        >
      </v-row>
    </div>
    <div v-if="row">
      <div
        v-for="(word, idx) in row.words"
        :key="idx"
        v-show="step === idx + 2"
      >
        <v-progress-linear class="mt-4" indeterminate v-if="formsLoading" />

        <v-row v-else-if="forms.length > 0" class="ma-0 mt-4">
          <span
            ><b class="mr-1">{{ word.spelling }}</b> appears in the following
            lexical form(s). Select the appropriate form to link this occurrence
            to the dictionary. You may submit without selecting a lexical form,
            but please note that the word will not be properly connected.</span
          >
        </v-row>
        <v-row v-else class="ma-0 mt-4">
          <span
            ><b class="mr-1">{{ word.spelling }}</b> does not appear in any
            forms. As such, it cannot be connected to the dictionary at this
            time.</span
          >
        </v-row>
        <div v-if="!formsLoading && forms.length > 0">
          <v-row class="ma-0 mt-4">
            <v-radio-group @change="spellingUuid = $event">
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
              @click="spellingUuid = null"
              color="primary"
            >
              Disconnect
            </v-btn>
          </v-row>
        </div>

        <v-row class="ma-0 mt-8" justify="center">
          <v-btn color="info" @click="step--" class="mr-1">Previous Step</v-btn>
          <v-btn
            v-if="idx !== row.words.length - 1"
            color="primary"
            :disabled="!stepOneComplete"
            @click="step++"
            class="ml-1"
            >Next Step</v-btn
          >
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
import {
  EpigraphicWord,
  EpigraphicUnitSide,
  RowTypes,
  SearchSpellingResultRow,
  RowContent,
  AddWordEditPayload,
} from '@oare/types';
import sl from '@/serviceLocator';
import { TabletRenderer } from '@oare/oare';
import Row from '@/views/Texts/CollectionTexts/AddTexts/Editor/components/Row.vue';
import { RowWithLine } from '@/views/Texts/CollectionTexts/AddTexts/Editor/components/Column.vue';
import { v4 } from 'uuid';
import GrammarDisplay from '@/views/DictionaryWord/components/WordInfo/components/Forms/components/GrammarDisplay.vue';

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

    const stepTwoComplete = computed(() => {
      return row.value && row.value.words;
    });

    const step = ref(1);

    const forms = ref<SearchSpellingResultRow[]>([]);
    const formsLoading = ref(false);
    const getPossibleSpellings = async (spelling: string) => {
      try {
        formsLoading.value = true;
        forms.value = await server.searchSpellings(spelling);
      } catch (err) {
        actions.showErrorSnackbar(
          'Error loading spelling options. Please try again.',
          err as Error
        );
      } finally {
        formsLoading.value = false;
      }
    };

    watch(step, async () => {
      if (step.value === 2) {
        const spelling =
          row.value && row.value.words
            ? row.value.words[step.value - 2].spelling
            : null;
        if (spelling) {
          await getPossibleSpellings(spelling);
        }
      }
    });

    const spellingUuid = ref<string | null>(null);

    return {
      row,
      addWordLoading,
      addWord,
      stepOneComplete,
      stepTwoComplete,
      step,
      spellingUuid,
      forms,
      formsLoading,
      getPossibleSpellings,
    };
  },
});
</script>
