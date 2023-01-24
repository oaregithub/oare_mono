<template>
  <oare-dialog
    :value="value"
    @input="$emit('input', $event)"
    title="Add Broken Lines"
    :persistent="false"
    :submitLoading="addUndeterminedLinesLoading"
    :submitDisabled="!formComplete"
    @submit="addUndeterminedLines"
  >
    <v-row class="ma-0">Number of Broken Line(s)</v-row>
    <v-row class="ma-0">
      <v-select
        outlined
        dense
        :items="undeterminedOptions"
        v-model="selectedNumber"
      />
    </v-row>
  </oare-dialog>
</template>

<script lang="ts">
import { defineComponent, ref, computed, PropType } from '@vue/composition-api';
import { AddUndeterminedLinesPayload, EpigraphicUnitSide } from '@oare/types';
import sl from '@/serviceLocator';
import { TabletRenderer } from '@oare/oare';

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
  },
  setup(props, { emit }) {
    const server = sl.get('serverProxy');
    const actions = sl.get('globalActions');

    const addUndeterminedLinesLoading = ref(false);

    const undeterminedOptions = ref([1, 2, 3, 4, 5, 6, 7, 8]);
    const selectedNumber = ref<number>();

    const formComplete = computed(() => {
      if (!selectedNumber.value) {
        return false;
      }
      return true;
    });

    const addUndeterminedLines = async () => {
      try {
        addUndeterminedLinesLoading.value = true;

        if (!selectedNumber.value) {
          throw new Error('No number of broken lines selected');
        }

        let previousObjectOnTablet: number | undefined = undefined;
        if (props.previousLineNumber) {
          const unitsOnPreviousLine = props.renderer.getUnitsOnLine(
            props.previousLineNumber
          );
          previousObjectOnTablet =
            unitsOnPreviousLine[unitsOnPreviousLine.length - 1].objOnTablet;
        }

        const payload: AddUndeterminedLinesPayload = {
          type: 'addUndeterminedLines',
          textUuid: props.textUuid,
          side: props.side,
          column: props.column,
          number: selectedNumber.value,
          previousObjectOnTablet,
        };
        await server.editText(payload);
        emit('reset-renderer');
      } catch (err) {
        actions.showErrorSnackbar(
          'Error adding broken lines. Please try again.',
          err as Error
        );
      } finally {
        addUndeterminedLinesLoading.value = false;
        selectedNumber.value = undefined;
        emit('reset-current-edit-action');
        emit('input', false);
      }
    };

    return {
      addUndeterminedLinesLoading,
      selectedNumber,
      undeterminedOptions,
      formComplete,
      addUndeterminedLines,
    };
  },
});
</script>
