<template>
  <oare-dialog
    :value="value"
    @input="$emit('input', $event)"
    title="Change Side Designation"
    :persistent="false"
    :submitLoading="editSideLoading"
    :submitDisabled="!formComplete"
    @submit="editSide"
  >
    <v-row class="ma-0"
      >Select the side you would like to edit and then select the side
      designation you would like to change it to.</v-row
    >
    <v-row class="ma-0 mt-4">Current Side Designation</v-row>
    <v-row class="ma-0">
      <v-select
        outlined
        dense
        :items="alreadyUsedSides"
        v-model="originalSide"
      />
    </v-row>

    <v-row class="ma-0">New Side Designation</v-row>
    <v-row class="ma-0">
      <v-select outlined dense :items="usableSides" v-model="newSide" />
    </v-row>
  </oare-dialog>
</template>

<script lang="ts">
import { defineComponent, ref, computed, PropType } from '@vue/composition-api';
import { EditSidePayload, EpigraphicUnitSide } from '@oare/types';
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
    usableSides: {
      type: Array as PropType<EpigraphicUnitSide[]>,
      required: true,
    },
    alreadyUsedSides: {
      type: Array as PropType<EpigraphicUnitSide[]>,
      required: true,
    },
  },
  setup(props, { emit }) {
    const server = sl.get('serverProxy');
    const actions = sl.get('globalActions');

    const editSideLoading = ref(false);

    const originalSide = ref<EpigraphicUnitSide | null>(null);
    const newSide = ref<EpigraphicUnitSide | null>(null);

    const formComplete = computed(() => originalSide.value && newSide.value);

    const editSide = async () => {
      try {
        editSideLoading.value = true;

        if (!originalSide.value || !newSide.value) {
          throw new Error('Required side designations not provided');
        }

        const payload: EditSidePayload = {
          type: 'editSide',
          textUuid: props.textUuid,
          originalSide: originalSide.value,
          newSide: newSide.value,
        };
        await server.editText(payload);
        emit('reset-renderer');
        emit('selected-side', newSide.value);
      } catch (err) {
        actions.showErrorSnackbar(
          'Error editing side designation. Please try again.',
          err as Error
        );
      } finally {
        editSideLoading.value = false;
        emit('reset-current-edit-action');
        emit('input', false);
      }
    };

    return {
      editSideLoading,
      originalSide,
      newSide,
      formComplete,
      editSide,
    };
  },
});
</script>
