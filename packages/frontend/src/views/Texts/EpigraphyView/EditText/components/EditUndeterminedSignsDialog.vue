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
    <v-row justify="center" class="mt-6 mb-4">
      <v-btn color="info" @click="markupDialog = true" class="test-edit-markup"
        >Edit Markup</v-btn
      >
    </v-row>

    <oare-dialog
      v-model="markupDialog"
      title="Edit Sign Markup"
      :showCancel="false"
      submitText="OK"
      closeOnSubmit
    >
      <v-row justify="center" class="ma-0">
        Select or unselect markup options.
      </v-row>
      <v-row justify="center" class="ma-0 mb-6">
        Some options have additional optional inputs.
      </v-row>
      <markup-selector
        :newSign="newSign"
        :referenceUuid="undeterminedSigns.uuid"
        :existingMarkup="undeterminedSigns.markups"
        class="mx-4 mb-4"
        @update-markup="updateMarkup"
      />
    </oare-dialog>
  </oare-dialog>
</template>

<script lang="ts">
import {
  EpigraphicSign,
  EditUndeterminedSignsPayload,
  MarkupUnit,
} from '@oare/types';
import {
  defineComponent,
  PropType,
  ref,
  watch,
  onMounted,
  computed,
} from '@vue/composition-api';
import sl from '@/serviceLocator';
import MarkupSelector from './MarkupSelector.vue';

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
  components: {
    MarkupSelector,
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
          markup: markupUnits.value,
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
          (!unknownNumUndeterminedSigns.value &&
            selectedNumber.value &&
            selectedNumber.value > 0) ||
          markupIsDifferent.value
        );
      } else {
        return (
          unknownNumUndeterminedSigns.value ||
          (selectedNumber.value &&
            selectedNumber.value !== originalUndeterminedValue) ||
          markupIsDifferent.value
        );
      }
    });

    const markupDialog = ref(false);
    const newSign = computed(() => {
      if (unknownNumUndeterminedSigns.value) {
        return '...';
      } else {
        return 'x'.repeat(selectedNumber.value || 0);
      }
    });
    const markupUnits = ref<MarkupUnit[]>(props.undeterminedSigns.markups);
    const updateMarkup = (markup: MarkupUnit[]) => {
      markupUnits.value = markup;
    };
    const markupIsDifferent = computed(() => {
      const originalMarkup = props.undeterminedSigns.markups
        .filter(m => m.type !== 'undeterminedSigns')
        .sort((a, b) => a.type.localeCompare(b.type));
      const newMarkup = markupUnits.value
        .filter(m => m.type !== 'undeterminedSigns')
        .sort((a, b) => a.type.localeCompare(b.type));

      if (originalMarkup.length !== newMarkup.length) {
        return true;
      }
      for (let i = 0; i < newMarkup.length; i++) {
        if (
          newMarkup[i].type !== originalMarkup[i].type ||
          newMarkup[i].startChar !== originalMarkup[i].startChar ||
          newMarkup[i].endChar !== originalMarkup[i].endChar ||
          newMarkup[i].altReading !== originalMarkup[i].altReading
        ) {
          return true;
        }
      }
      return false;
    });

    return {
      unknownNumUndeterminedSigns,
      undeterminedOptions,
      selectedNumber,
      editUndeterminedSignsLoading,
      canSubmit,
      editUndeterminedSigns,
      markupDialog,
      newSign,
      markupUnits,
      updateMarkup,
      markupIsDifferent,
    };
  },
});
</script>
