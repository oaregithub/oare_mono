<template>
  <div>
    <OareLabel>Word</OareLabel>
    <v-col cols="5">
      <v-text-field v-model="localWordInfo.word" outlined class="mb-4" />
    </v-col>
    <OareLabel>Translations</OareLabel>

    <div
      v-for="(translation, idx) in localWordInfo.translations"
      :key="idx"
      class="d-flex align-start"
    >
      <span class="mt-6">{{ idx + 1 }}</span>
      <v-col cols="5" class="mb-n4">
        <v-text-field v-model="localWordInfo.translations[idx]" outlined />
      </v-col>
      <div class="d-flex mt-5">
        <v-btn v-if="idx !== 0" icon @click="moveTranslation(idx, idx - 1)">
          <v-icon>mdi-chevron-up</v-icon>
        </v-btn>
        <v-btn
          v-if="idx !== localWordInfo.translations.length - 1"
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
    <v-btn color="primary" @click="addTranslation">
      <v-icon>mdi-plus</v-icon>
      Add translation
    </v-btn>

    <v-snackbar v-model="undoTranslateSnackbar">
      Translation deleted
      <template #action="{ attrs }">
        <v-btn text color="info" v-bind="attrs" @click="undoDeleteTranslation">
          Undo
        </v-btn>
      </template>
    </v-snackbar>
  </div>
</template>
<script lang="ts">
import { defineComponent, PropType, ref, Ref } from '@vue/composition-api';
import { WordWithForms } from '@/types/dictionary';
import _ from 'lodash';

export interface DeletedTranslation {
  index: number;
  translation: string;
}

export default defineComponent({
  name: 'EditWord',
  props: {
    wordInfo: {
      type: Object as PropType<WordWithForms>,
      required: true,
    },
  },
  setup({ wordInfo }) {
    const loading = ref(true);
    const localWordInfo: Ref<WordWithForms> = ref(_.cloneDeep(wordInfo));
    const undoTranslateSnackbar = ref(false);
    const deletedTranslation: Ref<DeletedTranslation | null> = ref(null);

    const removeTranslation = (index: number) => {
      deletedTranslation.value = {
        index,
        translation: localWordInfo.value.translations[index],
      };
      localWordInfo.value.translations.splice(index, 1);
      undoTranslateSnackbar.value = true;
    };

    const moveTranslation = (oldIndex: number, newIndex: number) => {
      const translations = [...localWordInfo.value.translations];

      const temp = translations[oldIndex];
      translations[oldIndex] = translations[newIndex];
      translations[newIndex] = temp;

      localWordInfo.value.translations = translations;
    };

    const addTranslation = () => {
      localWordInfo.value.translations.push('');
    };

    const undoDeleteTranslation = () => {
      if (deletedTranslation.value) {
        const { index, translation } = deletedTranslation.value;

        localWordInfo.value.translations.splice(index, 0, translation);
      }
      undoTranslateSnackbar.value = false;
    };

    return {
      loading,
      localWordInfo,
      removeTranslation,
      moveTranslation,
      addTranslation,
      undoTranslateSnackbar,
      undoDeleteTranslation,
    };
  },
});
</script>
