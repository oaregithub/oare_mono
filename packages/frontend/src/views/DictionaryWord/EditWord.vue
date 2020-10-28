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
    <OareLabel>Translations</OareLabel>

    <edit-translations
      :translations="localWordInfo.translations"
      @update:translations="updateTranslations"
    />
  </div>
</template>
<script lang="ts">
import {
  defineComponent,
  PropType,
  ref,
  Ref,
  watch,
} from '@vue/composition-api';
import { WordWithForms, DictionaryWordTranslation } from '@oare/types';
import _ from 'lodash';
import defaultServerProxy from '@/serverProxy';
import defaultActions from '@/globalActions';
import EditTranslations from './EditTranslations.vue';
import sl from '@/serviceLocator';

export default defineComponent({
  name: 'EditWord',
  components: {
    EditTranslations,
  },
  props: {
    uuid: {
      type: String,
      required: true,
    },
    wordInfo: {
      type: Object as PropType<WordWithForms>,
      required: true,
    },
  },
  setup({ uuid, wordInfo }, { emit }) {
    const serverProxy = sl.get('serverProxy');
    const actions = sl.get('globalActions');

    const loading = ref(true);
    const saveLoading = ref(false);
    const localWordInfo: Ref<WordWithForms> = ref(_.cloneDeep(wordInfo));

    const updateTranslations = (
      newTranslations: DictionaryWordTranslation[]
    ) => {
      localWordInfo.value.translations = newTranslations;
    };

    const saveEdits = async () => {
      saveLoading.value = true;
      const payload = {
        word: localWordInfo.value.word,
        translations: localWordInfo.value.translations,
      };

      try {
        const { translations } = await serverProxy.editWord(uuid, payload);
        localWordInfo.value.translations = translations;
        emit('update:wordInfo', {
          ...localWordInfo.value,
          ...payload,
        });
        actions.showSnackbar('Edit saved');
      } catch {
        actions.showErrorSnackbar('Error saving word');
      } finally {
        saveLoading.value = false;
      }
    };

    return {
      loading,
      localWordInfo,
      saveEdits,
      saveLoading,
      updateTranslations,
    };
  },
});
</script>
