<template>
  <oare-dialog
    :value="value"
    @input="$emit('input', $event)"
    title="Edit Undetermined Line(s)"
    :persistent="false"
    :submitLoading="editUndeterminedLinesLoading"
    :submitDisabled="!formComplete"
    @submit="editUndeterminedLines"
  >
    <v-row class="ma-0"
      >If desired, you can choose to convert the undetermined lines to a broken
      area. This means that there will not be a specific number of lines tied to
      the break. Otherwise, you can simply edit the number of specified
      undetermined lines.</v-row
    >
    <v-row class="ma-0 mb-4">
      <v-checkbox
        hide-details
        dense
        v-model="convertToBrokenArea"
        label="Convert to Broken Area"
      ></v-checkbox>
    </v-row>
    <v-row v-if="!convertToBrokenArea" class="ma-0"
      >Number of Undetermined Line(s)</v-row
    >
    <v-row v-if="!convertToBrokenArea" class="ma-0">
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
import {
  defineComponent,
  PropType,
  ref,
  computed,
  onMounted,
  watch,
} from '@vue/composition-api';
import { TabletRenderer } from '@oare/oare';
import sl from '@/serviceLocator';
import { EditUndeterminedLinesPayload } from '@oare/types';

export default defineComponent({
  props: {
    value: {
      type: Boolean,
      required: true,
    },
    line: {
      type: Number,
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
  },
  setup(props, { emit }) {
    const server = sl.get('serverProxy');
    const actions = sl.get('globalActions');

    const editUndeterminedLinesLoading = ref(false);

    const undeterminedOptions = ref([1, 2, 3, 4, 5, 6, 7, 8]);
    const originalSelectedNumber = ref<number>();
    const selectedNumber = ref<number>();
    const convertToBrokenArea = ref(false);

    const formComplete = computed(() => {
      if (convertToBrokenArea.value) {
        return true;
      }
      if (
        selectedNumber.value &&
        selectedNumber.value !== originalSelectedNumber.value
      ) {
        return true;
      }
      return false;
    });

    onMounted(() => {
      try {
        const unitOnLine = props.renderer
          .getUnitsOnLine(props.line)
          .find(unit => unit.epigType === 'undeterminedLines');

        if (!unitOnLine) {
          throw new Error('No undetermined lines found');
        }

        originalSelectedNumber.value = unitOnLine.markups[0].value || undefined;
        selectedNumber.value = unitOnLine.markups[0].value || undefined;
      } catch (err) {
        actions.showErrorSnackbar(
          'Error preparing edit undetermined lines. Please try again.',
          err as Error
        );
      }
    });

    const editUndeterminedLines = async () => {
      try {
        editUndeterminedLinesLoading.value = true;

        if (!convertToBrokenArea.value && !selectedNumber.value) {
          throw new Error(
            'No number of undetermined lines selected. This is required unless converting to a broken area.'
          );
        }

        const unitOnLine = props.renderer
          .getUnitsOnLine(props.line)
          .find(unit => unit.epigType === 'undeterminedLines');

        if (!unitOnLine) {
          throw new Error('No undetermined lines found');
        }

        const payload: EditUndeterminedLinesPayload = {
          type: 'editUndeterminedLines',
          textUuid: props.textUuid,
          uuid: unitOnLine.uuid,
          number: selectedNumber.value,
          convertToBrokenArea: convertToBrokenArea.value,
        };

        await server.editText(payload);
        emit('reset-renderer');
      } catch (err) {
        actions.showErrorSnackbar(
          'Error editing undetermined lines. Please try again.',
          err as Error
        );
      } finally {
        editUndeterminedLinesLoading.value = false;
        selectedNumber.value = undefined;
        emit('reset-current-edit-action');
        emit('input', false);
      }
    };

    watch(convertToBrokenArea, () => {
      if (convertToBrokenArea.value) {
        selectedNumber.value = undefined;
      } else {
        selectedNumber.value = originalSelectedNumber.value;
      }
    });

    return {
      editUndeterminedLinesLoading,
      undeterminedOptions,
      originalSelectedNumber,
      selectedNumber,
      formComplete,
      editUndeterminedLines,
      convertToBrokenArea,
    };
  },
});
</script>
