<template>
  <oare-dialog
    :value="value"
    @input="$emit('input', $event)"
    title="Add Line"
    :persistent="false"
    :submitLoading="addLineLoading"
    @submit="addLine"
    :submitDisabled="!stepTwoComplete"
    :width="800"
  >
    <div v-show="step === 1">
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
      <v-row class="ma-0 mt-8" justify="center">
        <v-btn color="primary" :disabled="!stepOneComplete" @click="step = 2"
          >Next Step</v-btn
        >
      </v-row>
    </div>
    <div v-show="step === 2">
      <v-row class="ma-0 mt-4">
        <span
          >The next steps will walk you through each of the words that appear on
          the new line. You will be asked to specify which spelling from the
          dictionary you would like the word to be linked to. In some cases, the
          spelling provided might not appear in the dictionary at all and can be
          skipped.</span
        >
      </v-row>
      <v-row class="ma-0 mt-8" justify="center">
        <v-btn color="info" @click="step--" class="mr-1">Previous Step</v-btn>
        <v-btn color="primary" @click="step = 3">Next Step</v-btn>
      </v-row>
    </div>
    <div v-if="row">
      <div
        v-for="(word, idx) in row.words"
        :key="idx"
        v-show="step === idx + 3"
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
            <v-radio-group
              @change="setDiscourseSpelling(word.discourseUuid, $event)"
            >
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
              @click="setDiscourseSpelling(word.discourseUuid, null)"
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
  ref,
  PropType,
  watch,
  computed,
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
  SearchSpellingResultRow,
  DiscourseSpelling,
} from '@oare/types';
import SpecialChars from '@/views/Texts/CollectionTexts/AddTexts/Editor/components/SpecialChars.vue';
import { v4 } from 'uuid';
import GrammarDisplay from '@/views/DictionaryWord/components/WordInfo/components/Forms/components/GrammarDisplay.vue';

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

    const stepTwoComplete = computed(() => {
      return (
        row.value &&
        row.value.words &&
        step.value === 3 + row.value.words.length - 1
      );
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
      if (step.value >= 3) {
        const spelling =
          row.value && row.value.words
            ? row.value.words[step.value - 3].spelling
            : null;
        if (spelling) {
          await getPossibleSpellings(spelling);
        }
      }
    });

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

    return {
      addLineLoading,
      addLine,
      row,
      stepOneComplete,
      step,
      stepTwoComplete,
      getPossibleSpellings,
      forms,
      formsLoading,
      discourseSpellings,
      setDiscourseSpelling,
    };
  },
});
</script>
