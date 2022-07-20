<template>
  <oare-dialog
    title="Add Lemma"
    @input="$emit('input', $event)"
    :submitDisabled="!newWordSpelling || !formComplete"
    @submit="addWord"
    :submitLoading="addWordLoading"
    :value="value"
    :persistent="false"
    :width="1150"
    closeOnSubmit
  >
    <OareContentView>
      <v-text-field
        v-model="newWordSpelling"
        placeholder="New word spelling"
        class="test-word-spelling"
      />
      <v-row class="ma-0">
        <add-properties
          startingUuid="8a6062db-8a6b-f102-98aa-9fa5989bd0a5"
          @export-properties="setProperties($event)"
          @form-complete="formComplete = $event"
        />
      </v-row>
    </OareContentView>
  </oare-dialog>
</template>

<script lang="ts">
import { defineComponent, ref, inject } from '@vue/composition-api';
import { ParseTreeProperty } from '@oare/types';
import OareContentView from '@/components/base/OareContentView.vue';
import sl from '@/serviceLocator';
import AddProperties from '@/components/Properties/AddProperties.vue';

export default defineComponent({
  name: 'AddWordDialog',
  components: {
    OareContentView,
    AddProperties,
  },
  props: {
    value: {
      type: Boolean,
      required: true,
    },
  },
  setup() {
    const server = sl.get('serverProxy');
    const actions = sl.get('globalActions');

    const addWordLoading = ref(false);
    const formComplete = ref(false);
    const newWordSpelling = ref('');
    const properties = ref<ParseTreeProperty[]>([]);

    const setProperties = (propertyList: ParseTreeProperty[]) => {
      properties.value = propertyList;
    };

    const addWord = async () => {
      try {
        addWordLoading.value = true;
        await server.addWord({
          wordSpelling: newWordSpelling.value,
          properties: properties.value,
        });
        actions.showSnackbar(`Successfully added ${newWordSpelling.value}`);
      } catch (err) {
        actions.showErrorSnackbar(
          'Error adding new lemma. Please try again.',
          err as Error
        );
      } finally {
        addWordLoading.value = false;
      }
    };

    return {
      addWord,
      addWordLoading,
      formComplete,
      setProperties,
      newWordSpelling,
    };
  },
});
</script>
