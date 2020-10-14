<template>
  <div>
    <OareLoaderButton
      color="primary"
      class="mb-5 test-save-btn"
      :loading="saveLoading"
      @click="saveEdits"
      >Save Edits</OareLoaderButton
    >
    <OareLabel>Word</OareLabel>
    <v-col cols="11" sm="7" lg="5">
      <v-text-field
        v-model="localWordInfo.word"
        outlined
        class="mb-4 test-edit-word"
      />
    </v-col>
    <!-- <OareLabel>Translations</OareLabel> -->

    <!-- <div
      v-for="(translation, idx) in localWordInfo.translations"
      :key="idx"
      class="d-flex align-start"
    >
      <span class="mt-6">{{ idx + 1 }}</span>
      <v-col cols="11" sm="7" lg="5" class="mb-n4">
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
    <v-btn color="primary" @click="addTranslation" text>
      <v-icon>mdi-plus</v-icon>
      Add translation
    </v-btn> -->

    <v-snackbar v-model="successfulEditSnackbar" class="test-edit-snackbar">
      Edit saved
      <template #action="{ attrs }">
        <v-btn
          text
          color="error"
          v-bind="attrs"
          @click="successfulEditSnackbar = false"
        >
          Close
        </v-btn>
      </template>
    </v-snackbar>

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
import defaultServerProxy from '@/serverProxy';

export interface DeletedTranslation {
  index: number;
  translation: string;
}

export default defineComponent({
  name: 'EditWord',
  props: {
    uuid: {
      type: String,
      required: true,
    },
    wordInfo: {
      type: Object as PropType<WordWithForms>,
      required: true,
    },
    serverProxy: {
      type: Object as PropType<typeof defaultServerProxy>,
      default: () => defaultServerProxy,
    },
  },
  setup({ uuid, wordInfo, serverProxy }, { emit }) {
    const loading = ref(true);
    const saveLoading = ref(false);
    const localWordInfo: Ref<WordWithForms> = ref(_.cloneDeep(wordInfo));
    const undoTranslateSnackbar = ref(false);
    const successfulEditSnackbar = ref(false);
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

    const saveEdits = async () => {
      saveLoading.value = true;
      const payload = { word: localWordInfo.value.word };
      await serverProxy.editWord(uuid, payload);
      emit('update:wordInfo', {
        ...localWordInfo.value,
        ...payload,
      });
      successfulEditSnackbar.value = true;
      saveLoading.value = false;
    };

    return {
      loading,
      localWordInfo,
      removeTranslation,
      moveTranslation,
      addTranslation,
      undoTranslateSnackbar,
      undoDeleteTranslation,
      saveEdits,
      saveLoading,
      successfulEditSnackbar,
    };
  },
});
</script>
