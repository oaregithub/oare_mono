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
        :translations.sync="wordInfo.translations"
        :wordUuid="wordUuid"
      />
      <div v-else class="d-flex">
        <div v-if="wordInfo.partsOfSpeech.length > 0" class="mr-1">
          {{ wordInfo.partsOfSpeech.join(', ') }}
        </div>
        <div v-if="wordInfo.verbalThematicVowelTypes.length > 0" class="mr-1">
          ({{ wordInfo.verbalThematicVowelTypes.join(', ') }})
        </div>
        <p v-else>
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
    <forms-display :forms="wordInfo.forms" />
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, computed, ref } from '@vue/composition-api';
import { WordWithForms, DictionaryForm } from '@oare/types';
import FormsDisplay from './FormsDisplay.vue';
import EditTranslations from './EditTranslations.vue';
import sl from '@/serviceLocator';

export default defineComponent({
  props: {
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
    FormsDisplay,
    EditTranslations,
  },
  setup() {
    const store = sl.get('store');
    const permissions = computed(() => store.getters.permissions);
    const isEditingTranslations = ref(false);

    const canEditTranslations = computed(() =>
      permissions.value.dictionary.some(perm => perm.includes('TRANSLATION'))
    );

    return {
      canEditTranslations,
      isEditingTranslations,
    };
  },
});
</script>
