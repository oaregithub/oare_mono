<template>
  <div class="d-flex w-full">
    <div class="d-flex">
      <v-progress-circular
        size="20"
        v-if="isLoading"
        indeterminate
        color="#757575"
        class="mt-3"
      />
      <v-btn
        v-if="!isLoading && canUpdateTranslations"
        icon
        class="mt-n2 test-save-translations"
        @click="saveEdits"
      >
        <v-icon>mdi-check</v-icon>
      </v-btn>
      <v-btn
        v-if="!isLoading && canUpdateTranslations"
        icon
        class="mt-n2"
        @click="closeEditor"
      >
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </div>
    <div class="w-full">
      <div
        v-for="(translation, idx) in localTranslations"
        :key="idx"
        class="d-flex align-start"
      >
        <span class="mt-6">{{ idx + 1 }}</span>
        <v-col cols="12" class="mb-n4">
          <v-text-field
            v-model="localTranslations[idx].val"
            outlined
            :disabled="isLoading || !canUpdateTranslations"
            class="test-translation"
          />
        </v-col>
        <div v-if="!isLoading" class="d-flex mt-5">
          <v-btn
            v-if="idx !== 0 && canUpdateTranslations"
            icon
            @click="moveTranslation(idx, idx - 1)"
            class="test-move-up"
          >
            <v-icon>mdi-chevron-up</v-icon>
          </v-btn>
          <v-btn
            v-if="idx !== localTranslations.length - 1 && canUpdateTranslations"
            icon
            @click="moveTranslation(idx, idx + 1)"
            class="test-move-down"
          >
            <v-icon>mdi-chevron-down</v-icon>
          </v-btn>
          <v-btn
            v-if="canUpdateTranslations"
            icon
            @click="removeTranslation(idx)"
            class="test-remove-translation"
          >
            <v-icon>mdi-trash-can-outline</v-icon>
          </v-btn>
        </div>
      </div>
      <v-btn
        v-if="canUpdateTranslations"
        color="primary"
        @click="addTranslation"
        text
        :disabled="isLoading"
        class="test-new-translation"
      >
        <v-icon>mdi-plus</v-icon>
        Add translation
      </v-btn>
    </div>
  </div>
</template>

<script lang="ts">
import { DictionaryWordTranslation } from '@oare/types';
import { defineComponent, PropType, ref, computed } from '@vue/composition-api';
import sl from '@/serviceLocator';
import _ from 'lodash';

export interface DeletedTranslation {
  index: number;
  translation: DictionaryWordTranslation;
}

export default defineComponent({
  props: {
    wordUuid: {
      type: String,
      required: true,
    },
    translations: {
      type: Array as PropType<DictionaryWordTranslation[]>,
      required: true,
    },
    fieldType: {
      type: String,
      required: true,
    },
  },
  setup(props, { emit }) {
    const localTranslations = ref(_.cloneDeep(props.translations));

    const actions = sl.get('globalActions');
    const server = sl.get('serverProxy');
    const store = sl.get('store');

    const isEditing = ref(false);
    const isLoading = ref(false);

    const deletedTranslation = ref<DeletedTranslation | null>(null);

    const closeEditor = () => emit('close-editor');

    const saveEdits = async () => {
      if (localTranslations.value.some(({ val }) => val.trim() === '')) {
        actions.showErrorSnackbar(
          'One or more translations are blank. Either provide a translation or remove the blank fields.'
        );
        return;
      }

      try {
        isLoading.value = true;
        await server.editTranslations(props.wordUuid, {
          translations: localTranslations.value,
          fieldType: props.fieldType,
        });
        actions.showSnackbar('Successfully updated translations');
        emit('update:translations', localTranslations.value);
        emit('close-editor');
      } catch (err) {
        actions.showErrorSnackbar(
          'Failed to update translations',
          err as Error
        );
      } finally {
        isLoading.value = false;
      }
    };

    const moveTranslation = (oldIndex: number, newIndex: number) => {
      const updatedTranslations: DictionaryWordTranslation[] = [
        ...localTranslations.value,
      ];

      const temp = updatedTranslations[oldIndex];
      updatedTranslations[oldIndex] = updatedTranslations[newIndex];
      updatedTranslations[newIndex] = temp;

      localTranslations.value = updatedTranslations;
    };

    const addTranslation = () => {
      const updatedTranslations: DictionaryWordTranslation[] = [
        ...localTranslations.value,
        {
          uuid: '',
          val: '',
        },
      ];
      localTranslations.value = updatedTranslations;
    };

    const removeTranslation = (index: number) => {
      deletedTranslation.value = {
        index,
        translation: localTranslations.value[index],
      };

      localTranslations.value = [
        ...localTranslations.value.slice(0, index),
        ...localTranslations.value.slice(index + 1),
      ];

      actions.showSnackbar('Translation deleted', {
        actionText: 'Undo',
        onAction: () => {
          if (deletedTranslation.value) {
            const { index, translation } = deletedTranslation.value;
            localTranslations.value = [
              ...localTranslations.value.slice(0, index),
              translation,
              ...localTranslations.value.slice(index),
            ];
          }
        },
      });
    };

    const canUpdateTranslations = computed(() =>
      store.hasPermission('UPDATE_TRANSLATION')
    );

    return {
      moveTranslation,
      addTranslation,
      removeTranslation,
      localTranslations,
      isEditing,
      closeEditor,
      saveEdits,
      isLoading,
      canUpdateTranslations,
    };
  },
});
</script>

<style scoped>
.w-full {
  width: 100%;
}
</style>
