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
      <v-btn color="info" @click="confirmUnsaved" class="test-close-editor"
        >Close editor</v-btn
      >
    </div>
    <v-text-field
      :value="localDraft.notes"
      @input="
        localDraft.notes = $event;
        isDirty = true;
      "
      label="Notes"
      placeholder="Explain why you're making these changes"
      class="mt-6 test-notes"
    />
    <div v-for="(sideData, idx) in localDraft.content" :key="idx">
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
      v-if="localDraft.content.length < sideTypes.length"
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
  computed,
  watch,
} from '@vue/composition-api';
import _ from 'lodash';
import { EpigraphicUnitSide } from '@oare/oare';
import sl from '@/serviceLocator';
import { DraftContent } from './index.vue';

export default defineComponent({
  name: 'EpigraphyEditor',
  props: {
    draft: {
      type: Object as PropType<DraftContent>,
      required: true,
    },
    textUuid: {
      type: String,
      required: true,
    },
  },
  setup(props, { emit }) {
    const server = sl.get('serverProxy');
    const actions = sl.get('globalActions');
    const router = sl.get('router');

    const isDirty = ref(false);
    const saveLoading = ref(false);
    const removeDialog = ref({
      open: false,
      deleteSide: -1,
    });
    const unsavedDialog = ref(false);
    const localDraft = ref(_.cloneDeep(props.draft));

    watch(
      () => props.draft,
      () => {
        localDraft.value = _.cloneDeep(props.draft);
      },
      { deep: true }
    );
    const sideTypes = computed(() => [
      '',
      'obv.',
      'lo.e.',
      'rev.',
      'u.e.',
      'le.e.',
      'r.e.',
    ]);

    const closeEditor = () => {
      router.push(`/epigraphies/${props.textUuid}`);
    };

    const confirmUnsaved = () => {
      if (isDirty.value) {
        actions.showUnsavedChangesWarning(closeEditor);
      } else {
        closeEditor();
      }
    };

    const createDraft = async () => {
      saveLoading.value = true;

      try {
        await server.createDraft(props.textUuid, {
          content: JSON.stringify(localDraft.value.content),
          notes: localDraft.value.notes,
        });
        emit('save-draft', localDraft.value);
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
      localDraft.value.content = [
        ...localDraft.value.content.slice(0, deleteSide),
        ...localDraft.value.content.slice(deleteSide + 1),
      ];
      isDirty.value = true;
    };

    const addSide = () => {
      localDraft.value.content.push({
        side: '',
        text: '',
      });
      isDirty.value = true;
    };

    const usableSides = (usedSide: string) => {
      const usedSides = localDraft.value.content.map(sideData => sideData.side);
      return sideTypes.value.filter(
        side =>
          side === '' ||
          side === usedSide ||
          !usedSides.includes(side as EpigraphicUnitSide)
      );
    };

    return {
      localDraft,
      sideTypes,
      saveLoading,
      removeDialog,
      createDraft,
      openRemoveDialog,
      removeSide,
      addSide,
      usableSides,
      isDirty,
      unsavedDialog,
      closeEditor,
      confirmUnsaved,
    };
  },
});
</script>
