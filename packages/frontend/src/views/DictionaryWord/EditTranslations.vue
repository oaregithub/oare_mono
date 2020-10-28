<template>
  <div>
    <div
      v-for="(translation, idx) in translations"
      :key="idx"
      class="d-flex align-start"
    >
      <span class="mt-6">{{ idx + 1 }}</span>
      <v-col cols="11" sm="7" lg="5" class="mb-n4">
        <v-text-field
          :value="translations[idx].translation"
          @change="tr => updateTranslation(idx, tr)"
          outlined
        />
      </v-col>
      <div class="d-flex mt-5">
        <v-btn v-if="idx !== 0" icon @click="moveTranslation(idx, idx - 1)">
          <v-icon>mdi-chevron-up</v-icon>
        </v-btn>
        <v-btn
          v-if="idx !== translations.length - 1"
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
    <v-btn color="primary" @click="addTranslation" text>
      <v-icon>mdi-plus</v-icon>
      Add translation
    </v-btn>
  </div>
</template>

<script lang="ts">
import { DictionaryWordTranslation } from '@oare/types';
import { defineComponent, PropType, ref, Ref } from '@vue/composition-api';
import sl from '@/serviceLocator';

export interface DeletedTranslation {
  index: number;
  translation: DictionaryWordTranslation;
}

export default defineComponent({
  props: {
    translations: {
      type: Array as PropType<DictionaryWordTranslation[]>,
      required: true,
    },
  },
  setup(props, { emit }) {
    const actions = sl.get('globalActions');
    const deletedTranslation: Ref<DeletedTranslation | null> = ref(null);

    const updateTranslation = (idx: number, newTranslation: string) => {
      const updatedTranslations: DictionaryWordTranslation[] = [
        ...props.translations.slice(0, idx),
        {
          ...props.translations[idx],
          translation: newTranslation,
        },
        ...props.translations.slice(idx + 1),
      ];
      emit('update:translations', updatedTranslations);
    };

    const moveTranslation = (oldIndex: number, newIndex: number) => {
      const updatedTranslations: DictionaryWordTranslation[] = [
        ...props.translations,
      ];

      const temp = updatedTranslations[oldIndex];
      updatedTranslations[oldIndex] = updatedTranslations[newIndex];
      updatedTranslations[newIndex] = temp;

      emit('update:translations', updatedTranslations);
    };

    const addTranslation = () => {
      const updatedTranslations: DictionaryWordTranslation[] = [
        ...props.translations,
        {
          uuid: '',
          translation: '',
        },
      ];

      emit('update:translations', updatedTranslations);
    };

    const removeTranslation = (index: number) => {
      deletedTranslation.value = {
        index,
        translation: props.translations[index],
      };

      emit('update:translations', [
        ...props.translations.slice(0, index),
        ...props.translations.slice(index + 1),
      ]);

      actions.showSnackbar('Translation deleted', {
        actionText: 'Undo',
        onAction: () => {
          if (deletedTranslation.value) {
            const { index, translation } = deletedTranslation.value;
            emit('update:translations', [
              ...props.translations.slice(0, index),
              translation,
              ...props.translations.slice(index),
            ]);
          }
        },
      });
    };

    return {
      updateTranslation,
      moveTranslation,
      addTranslation,
      removeTranslation,
    };
  },
});
</script>

<style></style>
