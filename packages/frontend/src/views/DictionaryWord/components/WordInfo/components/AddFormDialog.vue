<template>
  <oare-dialog
    :value="value"
    @input="$emit('input', $event)"
    title="Add Form"
    :width="1150"
    :persistent="false"
    :submitDisabled="!formComplete || !newFormSpelling || formAlreadyExists"
    :submitLoading="addFormLoading"
    @submit="addForm"
  >
    <OareContentView>
      <template #title>
        <v-row class="px-3">
          <strong>{{ word.word }}</strong>
        </v-row>
      </template>
      <word-grammar :word="word" :allowEditing="false" />
      <v-text-field
        v-model="newFormSpelling"
        placeholder="New form spelling"
        class="test-form-spelling"
      />
      <span
        v-if="formAlreadyExists"
        class="red--text text--darken-2 font-weight-bold test-error"
        >A form with this same spelling and matching parse properties already
        exists on this word</span
      >
      <v-container>
        <v-row>
          <v-col cols="2">
            <h3 class="primary--text mb-5">Existing Forms</h3>
            <h4 v-for="(form, index) in word.forms" :key="index">
              {{ form.form }}
            </h4>
          </v-col>
          <v-col cols="10">
            <add-properties
              :startingUuid="partOfSpeechValueUuid"
              requiredNodeValueName="Parse"
              @export-properties="setProperties($event)"
              @form-complete="formComplete = $event"
            />
          </v-col>
        </v-row>
      </v-container>
    </OareContentView>
  </oare-dialog>
</template>

<script lang="ts">
import {
  defineComponent,
  PropType,
  ref,
  computed,
  inject,
} from '@vue/composition-api';
import {
  Word,
  ParseTreeProperty,
  ItemPropertyRow,
  InsertItemPropertyRow,
} from '@oare/types';
import WordGrammar from './WordGrammar/WordGrammar.vue';
import { ReloadKey } from '../../../index.vue';
import sl from '@/serviceLocator';
import AddProperties from '@/components/Properties/AddProperties.vue';
import { convertParsePropsToItemProps } from '@oare/oare';

export default defineComponent({
  name: 'AddFormDialog',
  components: {
    WordGrammar,
    AddProperties,
  },
  props: {
    value: {
      type: Boolean,
      required: true,
    },
    word: {
      type: Object as PropType<Word>,
      required: true,
    },
  },
  setup({ word }) {
    const server = sl.get('serverProxy');
    const actions = sl.get('globalActions');
    const reload = inject(ReloadKey);

    const addFormLoading = ref(false);
    const formComplete = ref(false);
    const newFormSpelling = ref('');
    const properties = ref<ParseTreeProperty[]>([]);

    const setProperties = (propertyList: ParseTreeProperty[]) => {
      properties.value = propertyList;
    };

    const formAlreadyExists = computed(() => {
      const formsWithSameSpelling = word.forms.filter(
        form => form.form === newFormSpelling.value
      );

      if (formsWithSameSpelling.length === 0) {
        return false;
      }

      const selectedItemProperties = formsWithSameSpelling.map(form =>
        convertParsePropsToItemProps(properties.value, form.uuid)
      );

      return formsWithSameSpelling.some(
        (existing, idx) =>
          existing.properties.length === selectedItemProperties[idx].length &&
          existing.properties.every(prop =>
            hasMatchingProperty(selectedItemProperties[idx], prop)
          )
      );
    });

    const hasMatchingProperty = (
      comparison: InsertItemPropertyRow[],
      property: ItemPropertyRow
    ) => {
      return comparison.some(
        prop =>
          prop.variableUuid === property.variableUuid &&
          prop.valueUuid === property.valueUuid &&
          prop.level === property.level
      );
    };

    const partOfSpeechValueUuid = computed(() => {
      const posProperties = word.properties.filter(
        prop => prop.variableName === 'Part of Speech'
      );
      return posProperties.length > 0 ? posProperties[0].valueUuid : undefined;
    });

    const addForm = async () => {
      try {
        addFormLoading.value = true;
        await server.addForm({
          wordUuid: word.uuid,
          formSpelling: newFormSpelling.value,
          properties: properties.value,
        });
        actions.showSnackbar(
          `Successfully added ${newFormSpelling.value} to ${word.word}`
        );
        reload && reload();
      } catch (err) {
        actions.showErrorSnackbar(
          'Error adding new form. Please try again.',
          err as Error
        );
      } finally {
        addFormLoading.value = false;
      }
    };

    return {
      formComplete,
      newFormSpelling,
      formAlreadyExists,
      addForm,
      addFormLoading,
      setProperties,
      partOfSpeechValueUuid,
    };
  },
});
</script>