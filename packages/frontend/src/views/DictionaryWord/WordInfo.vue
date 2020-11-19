<template>
  <div>
    <div class="d-flex mb-3">
      <v-btn
        v-if="canEditTranslations && !isEditingTranslations"
        icon
        class="mt-n2"
        @click="isEditingTranslations = true"
      >
        <v-icon>mdi-pencil</v-icon>
      </v-btn>

      <edit-translations
        v-if="isEditingTranslations"
        @close-editor="isEditingTranslations = false"
        :translations="wordInfo.translations"
        @update:translations="updateTranslations"
        :wordUuid="wordUuid"
      />
      <div v-else class="d-flex">
        <div v-if="wordInfo.partsOfSpeech.length > 0" class="mr-1">
          {{ wordInfo.partsOfSpeech.join(', ') }}
        </div>
        <div v-if="wordInfo.verbalThematicVowelTypes.length > 0" class="mr-1">
          ({{ wordInfo.verbalThematicVowelTypes.join(', ') }})
        </div>
        <p>
          <span v-for="(tr, idx) in wordInfo.translations" :key="tr.uuid">
            <b>{{ idx + 1 }}</b
            >. {{ tr.translation }}
          </span>

          <span
            v-if="
              wordInfo.translations.length > 0 &&
                wordInfo.specialClassifications.length > 0
            "
            >;</span
          >
          <span v-if="wordInfo.specialClassifications.length > 0">
            {{ wordInfo.specialClassifications.join(', ') }}
          </span>
        </p>
      </div>
    </div>
    <div v-if="wordInfo.forms.length < 1">
      No forms found for {{ wordInfo.word }}
    </div>
    <form-display
      v-for="(form, index) in wordInfo.forms"
      :key="index"
      :form="form"
      :updateForm="newForm => updateForm(index, newForm)"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, computed, ref } from '@vue/composition-api';
import {
  WordWithForms,
  DictionaryForm,
  DictionaryWordTranslation,
} from '@oare/types';
import FormDisplay from './FormDisplay.vue';
import EditTranslations from './EditTranslations.vue';
import sl from '@/serviceLocator';

export default defineComponent({
  props: {
    updateWordInfo: {
      type: Function as PropType<(newWord: WordWithForms) => void>,
      required: true,
    },
    wordUuid: {
      type: String,
      required: true,
    },
    wordInfo: {
      type: Object as PropType<WordWithForms>,
      required: true,
    },
  },
  components: {
    FormDisplay,
    EditTranslations,
  },
  setup({ wordInfo, updateWordInfo }) {
    const store = sl.get('store');
    const permissions = computed(() => store.getters.permissions);
    const isEditingTranslations = ref(false);

    const canEditTranslations = computed(() =>
      permissions.value.dictionary.some(perm => perm.includes('TRANSLATION'))
    );

    const updateTranslations = (
      newTranslations: DictionaryWordTranslation[]
    ) => {
      updateWordInfo({
        ...wordInfo,
        translations: newTranslations,
      });
    };

    const updateForm = (index: number, form: DictionaryForm) => {
      const updatedForms = [...wordInfo.forms];
      updatedForms[index] = form;
      updateWordInfo({
        ...wordInfo,
        forms: updatedForms,
      });
    };

    return {
      canEditTranslations,
      isEditingTranslations,
      updateTranslations,
      updateForm,
    };
  },
});
</script>
