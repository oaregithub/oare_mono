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
      <v-btn v-if="!isLoading && canEdit" icon class="mt-n2" @click="saveEdits">
        <v-icon>mdi-check</v-icon>
      </v-btn>
      <v-btn
        v-if="!isLoading && canEdit"
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
        <v-col cols="11" sm="7" lg="5" class="mb-n4">
          <v-text-field
            v-model="localTranslations[idx].translation"
            outlined
            :disabled="isLoading"
          />
        </v-col>
        <div v-if="!isLoading" class="d-flex mt-5">
          <v-btn v-if="idx !== 0" icon @click="moveTranslation(idx, idx - 1)">
            <v-icon>mdi-chevron-up</v-icon>
          </v-btn>
          <v-btn
            v-if="idx !== localTranslations.length - 1"
            icon
            @click="moveTranslation(idx, idx + 1)"
          >
            <v-icon>mdi-chevron-down</v-icon>
          </v-btn>
          <v-btn icon @click="removeTranslation(idx)">
            <v-icon>mdi-trash-can-outline</v-icon>
          </v-btn>
        </div>
      </div>
      <v-btn color="primary" @click="addTranslation" text :disabled="isLoading">
        <v-icon>mdi-plus</v-icon>
        Add translation
      </v-btn>
    </div>
  </div>
</template>

<script lang="ts">
import { DictionaryWordTranslation } from '@oare/types';
import {
  defineComponent,
  PropType,
  ref,
  Ref,
  computed,
} from '@vue/composition-api';
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
  },
  setup(props, { emit }) {
    const localTranslations = ref(_.cloneDeep(props.translations));

    const actions = sl.get('globalActions');
    const server = sl.get('serverProxy');
    const store = sl.get('store');

    const permissions = computed(() => store.getters.permissions.dictionary);
    const isEditing = ref(false);
    const isLoading = ref(false);

    const deletedTranslation: Ref<DeletedTranslation | null> = ref(null);

    const closeEditor = () => emit('close-editor');

    const saveEdits = async () => {
      isLoading.value = true;

      try {
        await server.editTranslations(props.wordUuid, {
          translations: localTranslations.value,
        });
        actions.showSnackbar('Successfully updated translations');
        emit('update:translations', localTranslations.value);
        emit('close-editor');
      } catch {
        actions.showErrorSnackbar('Failed to update translations');
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
          translation: '',
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

    return {
      // updateTranslation,
      moveTranslation,
      addTranslation,
      removeTranslation,
      localTranslations,
      canEdit: computed(() =>
        permissions.value.some(perm => perm.includes('TRANSLATION'))
      ),
      isEditing,
      closeEditor,
      saveEdits,
      isLoading,
    };
  },
});
</script>

<style scoped>
.w-full {
  width: 100%;
}
</style>
