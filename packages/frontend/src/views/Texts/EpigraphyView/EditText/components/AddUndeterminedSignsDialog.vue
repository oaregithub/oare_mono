<template>
  <oare-dialog
    :value="value"
    @input="$emit('input', $event)"
    title="Add Undetermined Signs"
    :persistent="false"
    :submitLoading="addUndeterminedSignsLoading"
    :submitDisabled="!formComplete"
    @submit="addUndeterminedSigns"
  >
    <v-row justify="center" class="ma-0 mt-2">
      <span
        >Select the position where you would like to add the undetermined
        sign(s).</span
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
      <span
        v-for="(sign, signIdx) in wordToAddUndeterminedSignsTo.signs"
        :key="signIdx"
      >
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

    <div v-if="insertIndex !== undefined">
      <v-row class="ma-0">Number of Undetermined Sign(s)</v-row>
      <v-row class="ma-0">
        <v-select
          outlined
          dense
          :items="undeterminedOptions"
          v-model="selectedNumber"
          :disabled="unknownNumUndeterminedSigns"
        />
      </v-row>
      <v-row class="ma-0 mb-4 mt-n8">
        <v-checkbox
          hide-details
          dense
          v-model="unknownNumUndeterminedSigns"
          label="Unknown Number of Undetermined Sign(s)"
        ></v-checkbox>
      </v-row>
    </div>
  </oare-dialog>
</template>

<script lang="ts">
import {
  defineComponent,
  ref,
  computed,
  PropType,
  watch,
} from '@vue/composition-api';
import {
  AddUndeterminedSignsPayload,
  EpigraphicUnitSide,
  EpigraphicWord,
  EpigraphicUnitType,
} from '@oare/types';
import sl from '@/serviceLocator';
import { TabletRenderer } from '@oare/oare';
import InsertButton from './InsertButton.vue';

export default defineComponent({
  props: {
    value: {
      type: Boolean,
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
    wordToAddUndeterminedSignsTo: {
      type: Object as PropType<EpigraphicWord>,
      required: true,
    },
    textUuid: {
      type: String,
      required: true,
    },
    renderer: {
      type: Object as PropType<TabletRenderer>,
      required: true,
    },
    line: {
      type: Number,
      required: true,
    },
  },
  components: {
    InsertButton,
  },
  setup(props, { emit }) {
    const server = sl.get('serverProxy');
    const actions = sl.get('globalActions');

    const addUndeterminedSignsLoading = ref(false);

    const unknownNumUndeterminedSigns = ref(false);

    const insertIndex = ref<number>();

    const undeterminedOptions = ref([1, 2, 3, 4, 5, 6, 7, 8]);
    const selectedNumber = ref<number>();

    const formComplete = computed(() => {
      if (!selectedNumber.value && !unknownNumUndeterminedSigns.value) {
        return false;
      }
      return true;
    });

    // FIXME lots of duplicated code
    const addUndeterminedSigns = async () => {
      try {
        addUndeterminedSignsLoading.value = true;

        if (
          (!selectedNumber.value && !unknownNumUndeterminedSigns.value) ||
          insertIndex.value === undefined
        ) {
          throw new Error('No number of undetermined signs selected');
        }

        const newSpelling = getUpdatedSignsWithSeparators().replace(
          /<[^>]*>/g,
          ''
        );

        const payload: AddUndeterminedSignsPayload = {
          type: 'addUndeterminedSigns',
          textUuid: props.textUuid,
          side: props.side,
          column: props.column,
          line: props.line,
          number: unknownNumUndeterminedSigns.value
            ? -1
            : selectedNumber.value || 0,
          signUuidBefore:
            insertIndex.value === 0
              ? null
              : props.wordToAddUndeterminedSignsTo.signs[insertIndex.value - 1]
                  .uuid,
          spelling: newSpelling,
          discourseUuid: props.wordToAddUndeterminedSignsTo.discourseUuid,
        };
        await server.editText(payload);
        emit('reset-renderer');
      } catch (err) {
        actions.showErrorSnackbar(
          'Error adding undetermined signs. Please try again.',
          err as Error
        );
      } finally {
        addUndeterminedSignsLoading.value = false;
        selectedNumber.value = undefined;
        emit('reset-current-edit-action');
        emit('input', false);
      }
    };

    watch(unknownNumUndeterminedSigns, () => {
      if (unknownNumUndeterminedSigns.value) {
        selectedNumber.value = undefined;
      }
    });

    const getUpdatedSignsWithSeparators = () => {
      const pieces: {
        reading: string;
        type: EpigraphicUnitType | null;
      }[] = props.wordToAddUndeterminedSignsTo.signs.map(sign => ({
        reading: sign.reading || '',
        type: sign.type,
      }));

      const newSign = {
        reading: unknownNumUndeterminedSigns.value
          ? '...'
          : 'x'.repeat(selectedNumber.value!),
        readingType: null,
      };

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
      addUndeterminedSignsLoading,
      selectedNumber,
      undeterminedOptions,
      formComplete,
      addUndeterminedSigns,
      insertIndex,
      unknownNumUndeterminedSigns,
    };
  },
});
</script>