<template>
  <oare-dialog
    :value="value"
    @input="$emit('input', $event)"
    title="Edit Broken Sign(s)"
    :persistent="false"
    :submitLoading="editUndeterminedSignsLoading"
    :submitDisabled="!canSubmit"
    @submit="editUndeterminedSigns"
  >
    <v-row class="ma-0">Number of Broken Sign(s)</v-row>
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
        label="Unknown Number of Broken Sign(s)"
      ></v-checkbox>
    </v-row>
  </oare-dialog>
</template>

<script lang="ts">
import { EpigraphicSign, EditUndeterminedSignsPayload } from '@oare/types';
import {
  defineComponent,
  PropType,
  ref,
  watch,
  onMounted,
  computed,
} from '@vue/composition-api';
import sl from '@/serviceLocator';

export default defineComponent({
  props: {
    value: {
      type: Boolean,
      required: true,
    },
    textUuid: {
      type: String,
      required: true,
    },
    undeterminedSigns: {
      type: Object as PropType<EpigraphicSign>,
      required: true,
    },
  },
  setup(props, { emit }) {
    const server = sl.get('serverProxy');
    const actions = sl.get('globalActions');

    const unknownNumUndeterminedSigns = ref(false);

    const undeterminedOptions = ref([1, 2, 3, 4, 5, 6, 7, 8]);

    const selectedNumber = ref<number>();

    const editUndeterminedSignsLoading = ref(false);

    onMounted(() => {
      const undeterminedValue =
        props.undeterminedSigns.markups.find(
          markup => markup.type === 'undeterminedSigns'
        )?.value || -1;

      if (undeterminedValue === -1) {
        unknownNumUndeterminedSigns.value = true;
      } else {
        selectedNumber.value = undeterminedValue;
      }
    });

    watch(unknownNumUndeterminedSigns, () => {
      if (unknownNumUndeterminedSigns.value) {
        selectedNumber.value = undefined;
      }
    });

    const editUndeterminedSigns = async () => {
      try {
        editUndeterminedSignsLoading.value = true;

        const payload: EditUndeterminedSignsPayload = {
          type: 'editUndeterminedSigns',
          textUuid: props.textUuid,
          uuid: props.undeterminedSigns.uuid,
          number: unknownNumUndeterminedSigns.value
            ? -1
            : selectedNumber.value || 0,
        };

        await server.editText(payload);
        emit('reset-renderer');
      } catch (err) {
        actions.showErrorSnackbar(
          'Error editing undetermined sign(s)',
          err as Error
        );
      } finally {
        emit('input', false);
        emit('reset-current-edit-action');
        editUndeterminedSignsLoading.value = false;
      }
    };

    const canSubmit = computed(() => {
      const originalUndeterminedValue =
        props.undeterminedSigns.markups.find(
          markup => markup.type === 'undeterminedSigns'
        )?.value || -1;

      if (originalUndeterminedValue === -1) {
        return (
          !unknownNumUndeterminedSigns.value &&
          selectedNumber.value &&
          selectedNumber.value > 0
        );
      } else {
        return (
          unknownNumUndeterminedSigns.value ||
          (selectedNumber.value &&
            selectedNumber.value !== originalUndeterminedValue)
        );
      }
    });

    return {
      unknownNumUndeterminedSigns,
      undeterminedOptions,
      selectedNumber,
      editUndeterminedSignsLoading,
      canSubmit,
      editUndeterminedSigns,
    };
  },
});
</script>
