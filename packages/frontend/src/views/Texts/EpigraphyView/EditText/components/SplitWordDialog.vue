<template>
  <oare-dialog
    :value="value"
    @input="$emit('input', $event)"
    :persistent="false"
    :submitLoading="splitWordLoading"
    :submitDisabled="submitDisabled"
    @submit="step === 1 || step === 2 ? step++ : splitWord()"
    :submitText="step === 1 || step === 2 ? 'Next' : 'Submit'"
    :width="600"
    :showActionButton="step === 2 || step === 3"
    actionButtonText="Back"
    @action="goBack"
    title="Split Word/Number"
  >
    <div v-if="step === 1">
      <v-row
        v-if="word.signs.length < 2"
        justify="center"
        class="ma-0 mt-2 red--text"
      >
        <span
          >The selected word/number cannot be split because it only has one
          sign. Please try another.</span
        >
      </v-row>

      <div v-else>
        <v-row justify="center" class="ma-0 mt-2">
          <span>Choose where you would like to split the word/number.</span>
        </v-row>

        <v-row justify="center" align="center" class="mt-6 mb-6 oare-title">
          <span v-for="(sign, signIdx) in word.signs" :key="signIdx">
            <span class="mx-2" v-html="sign.reading" />
            <v-hover v-if="signIdx < word.signs.length - 1" v-slot="{ hover }">
              <v-btn
                fab
                x-small
                dark
                :elevation="hover ? 5 : 0"
                :color="
                  splitIndex === signIdx
                    ? 'info'
                    : hover
                    ? 'grey darken-3'
                    : 'grey lighten-2'
                "
                width="25px"
                height="25px"
                class="test-split-button"
                @click="splitIndex = signIdx"
              >
                <v-icon v-if="splitIndex === signIdx" small> mdi-check </v-icon>
                <v-icon v-else x-small> mdi-content-cut </v-icon>
              </v-btn>
            </v-hover>
          </span>
        </v-row>
      </div>
    </div>

    <div v-if="step === 2">
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

      <div v-if="editorDiscourseWord1">
        <v-row class="ma-0 my-4" justify="center">
          The first word will be updated to become:
          <b class="ml-1" v-html="getUpdatedSignsWithSeparators()[0]"
        /></v-row>
        <v-row class="ma-0 pa-0 mb-8" justify="center">
          <connect-discourse-item
            :word="editorDiscourseWord1"
            @update-spelling-uuid="spellingUuid = $event"
            @loaded-forms="formsLoaded = true"
          />
        </v-row>
      </div>

      <div v-if="editorDiscourseWord2">
        <v-row class="ma-0 my-4" justify="center">
          The second word will be updated to become:
          <b class="ml-1" v-html="getUpdatedSignsWithSeparators()[1]"
        /></v-row>
        <v-row class="ma-0 pa-0 mb-8" justify="center">
          <connect-discourse-item
            :word="editorDiscourseWord2"
            @update-spelling-uuid="spellingUuid2 = $event"
            @loaded-forms="formsLoaded2 = true"
          />
        </v-row>
      </div>
    </div>

    <div v-if="step === 3">
      <v-row class="ma-0" justify="center">
        Select the new word(s) where existing properties should be transferred
        to.
      </v-row>

      <v-row class="ma-0" justify="center">
        You may select one, both, or none of the new words.
      </v-row>

      <v-row class="ma-0 mx-10" justify="center">
        <v-col cols="3" />
        <v-col cols="3">
          <v-row class="ma-0" justify="center">
            <b v-html="getUpdatedSignsWithSeparators()[0]" />
          </v-row>
          <v-row class="ma-0" justify="center">
            <v-checkbox
              hide-details
              v-model="propertySelections"
              :value="0"
              multiple
            />
          </v-row>
        </v-col>
        <v-col cols="3">
          <v-row class="ma-0" justify="center">
            <b v-html="getUpdatedSignsWithSeparators()[1]" />
          </v-row>
          <v-row class="ma-0" justify="center">
            <v-checkbox
              hide-details
              v-model="propertySelections"
              :value="1"
              multiple
            />
          </v-row>
        </v-col>
        <v-col cols="3" />
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
  EpigraphicUnitType,
  MarkupType,
  EditorDiscourseWord,
  SplitWordPayload,
} from '@oare/types';
import ConnectDiscourseItem from '@/views/Texts/CollectionTexts/AddTexts/Discourse/components/ConnectDiscourseItem.vue';
import sl from '@/serviceLocator';

export default defineComponent({
  props: {
    value: {
      type: Boolean,
      required: true,
    },
    word: {
      type: Object as PropType<EpigraphicWord>,
      required: true,
    },
    textUuid: {
      type: String,
      required: true,
    },
  },
  components: {
    ConnectDiscourseItem,
  },
  setup(props, { emit }) {
    const server = sl.get('serverProxy');
    const actions = sl.get('globalActions');

    const splitWordLoading = ref(false);

    const step = ref(1);

    const formsLoaded = ref(false);
    const formsLoaded2 = ref(false);

    const splitWord = async () => {
      try {
        splitWordLoading.value = true;

        if (splitIndex.value === undefined) {
          throw new Error('Split index is undefined');
        }

        const newSpellings = getUpdatedSignsWithSeparators();
        if (newSpellings.length !== 2) {
          throw new Error('New spellings length is not 2');
        }

        if (!props.word.discourseUuid) {
          throw new Error('No discourse UUID');
        }

        if (propertySelections.value.length > 2) {
          throw new Error('Too many property selections');
        }

        const previousUuid = props.word.signs[splitIndex.value].uuid;

        const payload: SplitWordPayload = {
          type: 'splitWord',
          textUuid: props.textUuid,
          discourseUuid: props.word.discourseUuid,
          firstSpelling: newSpellings[0],
          firstSpellingUuid: spellingUuid.value || null,
          secondSpelling: newSpellings[1],
          secondSpellingUuid: spellingUuid2.value || null,
          previousUuid,
          propertySelections: propertySelections.value,
        };

        await server.editText(payload);
        emit('reset-renderer');
      } catch (err) {
        actions.showErrorSnackbar(
          'Error splitting word/number. Please try again.',
          err as Error
        );
      } finally {
        emit('input', false);
        emit('reset-current-edit-action');
        splitWordLoading.value = false;
      }
    };

    const goBack = () => {
      step.value -= 1;
      if (step.value === 1) {
        spellingUuid.value = undefined;
        spellingUuid2.value = undefined;
        formsLoaded.value = false;
        formsLoaded2.value = false;
      } else if (step.value === 2) {
        propertySelections.value = [0];
      }
    };

    const spellingUuid = ref<string>();
    const spellingUuid2 = ref<string>();

    const splitIndex = ref<number>();

    const getUpdatedSignsWithSeparators = (): string[] => {
      if (splitIndex.value === undefined) {
        return [];
      }

      const pieces: {
        uuid: string;
        reading: string;
        type: EpigraphicUnitType | null;
        markup: MarkupType[];
      }[] = props.word.signs.map(sign => ({
        uuid: sign.uuid,
        reading: sign.reading || '',
        type: sign.type,
        markup: sign.markups.map(unit => unit.type),
      }));

      const firstWordPieces = pieces.slice(0, splitIndex.value + 1);
      const secondWordPieces = pieces.slice(splitIndex.value + 1);

      const newWords = [firstWordPieces, secondWordPieces].map(pieces =>
        pieces.map((sign, index) => {
          const nextSign =
            index !== pieces.length - 1 ? pieces[index + 1] : null;

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
            } else if (
              sign.type === 'logogram' ||
              nextSign.type === 'logogram'
            ) {
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
        })
      );

      const newWordsReading = newWords.map(word => {
        let newWordReading = '';
        word.forEach(sign => {
          newWordReading += sign.reading;
          if (sign.separator) {
            newWordReading += sign.separator;
          }
        });
        return newWordReading
          .replace(/([[\]{}⸢⸣«»‹›:;*?\\!])|(".+")|('.+')|(^\/)+/g, '')
          .replace(/<[^>]*>/g, '');
      });

      return newWordsReading;
    };

    const editorDiscourseWord1: ComputedRef<EditorDiscourseWord | undefined> =
      computed(() => {
        if (splitIndex.value === undefined) {
          return undefined;
        }
        const newWord = getUpdatedSignsWithSeparators()[0];
        return {
          discourseUuid: props.word.discourseUuid,
          spelling: newWord,
          type: 'word',
        };
      });

    const editorDiscourseWord2: ComputedRef<EditorDiscourseWord | undefined> =
      computed(() => {
        if (splitIndex.value === undefined) {
          return undefined;
        }
        const newWord = getUpdatedSignsWithSeparators()[1];
        return {
          discourseUuid: props.word.discourseUuid,
          spelling: newWord,
          type: 'word',
        };
      });

    const submitDisabled = computed(() => {
      if (step.value === 1) {
        return splitIndex.value === undefined;
      }
      if (step.value === 2) {
        return !formsLoaded.value || !formsLoaded2.value;
      }
      return false;
    });

    const propertySelections = ref<number[]>([0]);

    return {
      splitWordLoading,
      step,
      formsLoaded,
      formsLoaded2,
      splitWord,
      goBack,
      spellingUuid,
      splitIndex,
      spellingUuid2,
      getUpdatedSignsWithSeparators,
      editorDiscourseWord1,
      editorDiscourseWord2,
      submitDisabled,
      propertySelections,
    };
  },
});
</script>
