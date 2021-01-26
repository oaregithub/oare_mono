<template>
  <div>
    <div>
      <oare-loader-button
        color="primary"
        class="mr-2 test-save"
        :loading="saveLoading"
        @click="createDraft"
        >Save draft</oare-loader-button
      >
      <v-btn
        color="info"
        @click="$emit('close-editor')"
        class="test-close-editor"
        >Close editor</v-btn
      >
    </div>
    <v-text-field
      :value="notesData"
      @input="
        notesData = $event;
        isDirty = true;
      "
      label="Notes"
      placeholder="Explain why you're making these changes"
      class="mt-6 test-notes"
    />
    <div v-for="(sideData, idx) in textData" :key="idx">
      <div class="d-flex justify-space-between align-baseline">
        <v-col cols="6">
          <v-autocomplete
            :value="sideData.side"
            @input="
              sideData.side = $event;
              isDirty = true;
            "
            :items="usableSides(sideData.side)"
            class="test-side-select"
          />
        </v-col>
        <v-btn
          color="error"
          text
          @click="openRemoveDialog(idx)"
          class="test-remove-side"
          >Remove side</v-btn
        >
      </div>
      <v-textarea
        :value="sideData.text"
        @input="
          sideData.text = $event;
          isDirty = true;
        "
        outlined
        class="mb-3 test-side-text"
        auto-grow
      />
    </div>
    <v-btn
      v-if="textData.length < sideTypes.length"
      text
      color="primary"
      @click="addSide"
      class="test-add-side"
      >Add side</v-btn
    >
    <OareDialog
      v-model="removeDialog.open"
      title="Confirm remove"
      @submit="removeSide"
      closeOnSubmit
    >
      Are you sure you want to remove this side? All edits you have made to it
      will be lost.
    </OareDialog>
  </div>
</template>

<script lang="ts">
import {
  defineComponent,
  PropType,
  ref,
  onMounted,
  computed,
} from '@vue/composition-api';
import { EpigraphicUnitSide } from '@oare/oare';
import sl from '@/serviceLocator';
import { EpigraphyEditorSideData } from './index.vue';

export default defineComponent({
  name: 'EpigraphyEditor',
  props: {
    // List of objects with "key" => side
    // and "lines" => list of line readings
    sides: {
      type: Array as PropType<EpigraphyEditorSideData[]>,
      required: true,
    },
    notes: {
      type: String,
      required: true,
    },
    textUuid: {
      type: String,
      required: true,
    },
  },
  setup({ sides, notes, textUuid }, { emit }) {
    const server = sl.get('serverProxy');
    const actions = sl.get('globalActions');

    const isDirty = ref(false);
    const textData = ref<EpigraphyEditorSideData[]>([]);
    const saveLoading = ref(false);
    const removeDialog = ref({
      open: false,
      deleteSide: -1,
    });
    const notesData = ref(notes);
    const sideTypes = computed(() => [
      '',
      'obv.',
      'lo.e.',
      'rev.',
      'u.e.',
      'le.e.',
      'r.e.',
    ]);

    const createDraft = async () => {
      saveLoading.value = true;

      try {
        await server.createDraft(textUuid, {
          content: JSON.stringify(textData.value),
          notes: notesData.value,
        });
        emit('save-draft', textData.value);
        emit('update:notes', notesData.value);
        actions.showSnackbar('Successfully saved draft');
        isDirty.value = false;
      } catch {
        actions.showErrorSnackbar('Failed to save draft');
      } finally {
        saveLoading.value = false;
      }
    };

    const openRemoveDialog = (sideIdx: number) => {
      removeDialog.value.open = true;
      removeDialog.value.deleteSide = sideIdx;
    };

    const removeSide = () => {
      const deleteSide = removeDialog.value.deleteSide;
      textData.value = [
        ...textData.value.slice(0, deleteSide),
        ...textData.value.slice(deleteSide + 1),
      ];
      isDirty.value = true;
    };

    const addSide = () => {
      textData.value.push({
        side: '',
        text: '',
      });
      isDirty.value = true;
    };

    const usableSides = (usedSide: string) => {
      const usedSides = textData.value.map(sideData => sideData.side);
      return sideTypes.value.filter(
        side =>
          side === '' ||
          side === usedSide ||
          !usedSides.includes(side as EpigraphicUnitSide)
      );
    };

    onMounted(() => {
      // We'll be making edits, so make a copy of the data
      // so it isn't updated in the parent
      for (const sideData of sides) {
        textData.value.push({ ...sideData });
      }
    });

    return {
      textData,
      sideTypes,
      saveLoading,
      removeDialog,
      createDraft,
      openRemoveDialog,
      removeSide,
      addSide,
      usableSides,
      notesData,
      isDirty,
    };
  },
});
</script>
