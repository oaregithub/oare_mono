<template>
  <div class="d-flex">
    <v-tooltip
      bottom
      open-delay="800"
      :key="`${isEditingTranslations}-lemma-properties`"
    >
      <template #activator="{ on, attrs }">
        <v-btn
          v-if="
            allowEditing && canEditLemmaProperties && !isEditingTranslations
          "
          icon
          class="test-property-pencil edit-button mt-n1 mr-1"
          @click="editLemmaPropertiesDialog = true"
          small
          v-bind="attrs"
          v-on="on"
        >
          <v-icon size="20">mdi-pencil</v-icon>
        </v-btn>
      </template>
      <span>Edit Lemma Properties</span>
    </v-tooltip>
    <div v-if="partsOfSpeech.length > 0 && !isEditingTranslations" class="mr-1">
      {{ partsOfSpeechString }}
    </div>
    <div
      v-if="verbalThematicVowelTypes.length > 0 && !isEditingTranslations"
      class="mr-1"
    >
      ({{ verbalThematicVowelTypesString }})
    </div>
    <v-tooltip
      bottom
      open-delay="800"
      :key="`${isEditingTranslations}-translations`"
    >
      <template #activator="{ on, attrs }">
        <v-btn
          v-if="allowEditing && canEditTranslations && !isEditingTranslations"
          icon
          class="mt-n1 mr-1"
          @click="isEditingTranslations = true"
          small
          v-bind="attrs"
          v-on="on"
        >
          <v-icon size="20">mdi-pencil</v-icon>
        </v-btn>
      </template>
      <span>Edit Translations</span>
    </v-tooltip>

    <edit-translations
      v-if="isEditingTranslations && allowEditing"
      @close-editor="isEditingTranslations = false"
      :translations="word.translations"
      @update:translations="updateTranslations"
      :wordUuid="word.uuid"
    />
    <p v-if="onlyShowFirstTranslation && !isEditingTranslations" class="mb-0">
      <span v-if="word.translations.length >= 1">
        <b>{{ 1 }}</b>
        . {{ word.translations[0].translation }}
      </span>
    </p>
    <p v-else-if="!isEditingTranslations">
      <span v-for="(tr, idx) in word.translations" :key="tr.uuid">
        <b>{{ idx + 1 }}</b
        >. {{ tr.translation }}
      </span>

      <span
        v-if="word.translations.length > 0 && specialClassifications.length > 0"
        >;</span
      >
      <span v-if="specialClassifications.length > 0">
        {{ specialClassificationsString }}
      </span>
    </p>
    <oare-dialog
      v-if="allowEditing && canEditLemmaProperties"
      v-model="editLemmaPropertiesDialog"
      :title="`Edit Lemma Properties - ${word.word}`"
      :width="1000"
      :submitDisabled="!formComplete"
      submitText="Submit"
      closeOnSubmit
      @submit="updateLemmaProperties"
    >
      <add-properties
        startingUuid="8a6062db-8a6b-f102-98aa-9fa5989bd0a5"
        @export-properties="setProperties($event)"
        @form-complete="formComplete = $event"
        :existingProperties="word.properties"
        :key="addPropertiesKey"
      />
    </oare-dialog>
  </div>
</template>

<script lang="ts">
import {
  defineComponent,
  PropType,
  computed,
  ref,
  watch,
  inject,
} from '@vue/composition-api';
import {
  Word,
  ParseTreeProperty,
  DictionaryWordTranslation,
} from '@oare/types';
import { ReloadKey } from '../index.vue';
import AddProperties from '@/components/Properties/AddProperties.vue';
import EditTranslations from '../EditTranslations.vue';
import sl from '@/serviceLocator';

export default defineComponent({
  name: 'WordGrammar',
  props: {
    word: {
      type: Object as PropType<Word>,
      required: true,
    },
    onlyShowFirstTranslation: {
      type: Boolean,
      default: false,
    },
    allowEditing: {
      type: Boolean,
      default: true,
    },
    updateWordInfo: {
      type: Function as PropType<(newWord: Word) => void>,
      required: false,
    },
  },
  components: {
    AddProperties,
    EditTranslations,
  },
  setup({ word, updateWordInfo }) {
    const server = sl.get('serverProxy');
    const actions = sl.get('globalActions');
    const store = sl.get('store');
    const reload = inject(ReloadKey);

    const isEditingTranslations = ref(false);

    const partsOfSpeech = computed(() =>
      word.properties.filter(prop => prop.variableName === 'Part of Speech')
    );

    const partsOfSpeechString = computed(() =>
      partsOfSpeech.value
        .map(pos => pos.valAbbreviation || pos.valueName)
        .join(', ')
    );

    const verbalThematicVowelTypes = computed(() =>
      word.properties.filter(
        prop => prop.variableName === 'Verbal Thematic Vowel Type'
      )
    );

    const verbalThematicVowelTypesString = computed(() =>
      verbalThematicVowelTypes.value
        .map(pos => pos.valAbbreviation || pos.valueName)
        .join(', ')
    );

    const specialClassifications = computed(() =>
      word.properties.filter(
        prop => prop.variableName === 'Special Classifications'
      )
    );

    const specialClassificationsString = computed(() =>
      specialClassifications.value
        .map(pos => pos.valAbbreviation || pos.valueName)
        .join(', ')
    );

    const editLemmaPropertiesDialog = ref(false);
    const formComplete = ref(false);

    const properties = ref<ParseTreeProperty[]>([]);
    const setProperties = (propertyList: ParseTreeProperty[]) => {
      properties.value = propertyList;
    };

    const addPropertiesKey = ref(false);
    watch(editLemmaPropertiesDialog, () => {
      if (editLemmaPropertiesDialog.value) {
        addPropertiesKey.value = !addPropertiesKey.value;
        properties.value = [];
      }
    });

    const updateLemmaProperties = async () => {
      try {
        await server.editPropertiesByReferenceUuid(
          word.uuid,
          properties.value,
          word.uuid
        );
        actions.showSnackbar(
          `Successfully updated lemma properties for ${word.word}`
        );
        reload && reload();
      } catch (err) {
        actions.showErrorSnackbar(
          'Error updating form parse information.',
          err as Error
        );
      } finally {
        properties.value = [];
      }
    };

    const canEditLemmaProperties = computed(() =>
      store.hasPermission('EDIT_ITEM_PROPERTIES')
    );

    const canEditTranslations = computed(() =>
      store.hasPermission('UPDATE_TRANSLATION')
    );

    const updateTranslations = (
      newTranslations: DictionaryWordTranslation[]
    ) => {
      if (updateWordInfo) {
        updateWordInfo({
          ...word,
          translations: newTranslations,
        });
      }
    };

    return {
      partsOfSpeech,
      partsOfSpeechString,
      verbalThematicVowelTypes,
      verbalThematicVowelTypesString,
      specialClassifications,
      specialClassificationsString,
      editLemmaPropertiesDialog,
      formComplete,
      properties,
      setProperties,
      addPropertiesKey,
      updateLemmaProperties,
      canEditLemmaProperties,
      canEditTranslations,
      isEditingTranslations,
      updateTranslations,
    };
  },
});
</script>
