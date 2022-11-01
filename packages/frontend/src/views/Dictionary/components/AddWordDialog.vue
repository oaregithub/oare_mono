<template>
  <oare-dialog
    title="Add Lemma"
    @input="$emit('input', $event)"
    :submitDisabled="
      !newWordSpelling || !formComplete || ifwordExists || outstandingCheck > 0
    "
    @submit="addWord"
    :submitLoading="addWordLoading || outstandingCheck > 0"
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
      <span
        v-if="ifwordExists"
        class="red--text text--darken-2 font-weight-bold test-error"
        >A lemma with this same spelling and matching lemma properties already
        exists.
      </span>
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
import { defineComponent, ref, watch } from '@vue/composition-api';
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
    route: {
      type: String,
      required: true,
    },
  },
  setup(props) {
    const server = sl.get('serverProxy');
    const actions = sl.get('globalActions');
    const router = sl.get('router');
    const _ = sl.get('lodash');

    const addWordLoading = ref(false);
    const formComplete = ref(false);
    const newWordSpelling = ref('');
    const properties = ref<ParseTreeProperty[]>([]);

    const ifwordExists = ref(false);
    const outstandingCheck = ref(0);

    const newWord = ref('');

    const setProperties = (propertyList: ParseTreeProperty[]) => {
      properties.value = propertyList;
    };

    const convertRouteName = (route: String) => {
      if (route == 'places') {
        return (route = 'GN');
      } else if (route == 'names') {
        return (route = 'PN');
      } else {
        return (route = 'word');
      }
    };

    const addWord = async () => {
      try {
        addWordLoading.value = true;
        newWord.value = await server.addWord({
          wordSpelling: newWordSpelling.value,
          wordType: convertRouteName(props.route),
          properties: properties.value,
        });
        actions.showSnackbar(`Successfully added ${newWordSpelling.value}`);
        router.push(`/dictionaryWord/${newWord.value}`);
      } catch (err) {
        actions.showErrorSnackbar(
          'Error adding new lemma. Please try again.',
          err as Error
        );
      } finally {
        addWordLoading.value = false;
      }
    };

    watch(
      [newWordSpelling, properties],
      _.debounce(async () => {
        try {
          outstandingCheck.value++;
          if (newWordSpelling.value) {
            ifwordExists.value = await server.checkNewWord(
              newWordSpelling.value,
              properties.value
            );
          }
        } catch (err) {
          actions.showErrorSnackbar(
            'Error checking word status.',
            err as Error
          );
        } finally {
          outstandingCheck.value--;
        }
      }, 500),
      { deep: true }
    );

    return {
      addWord,
      addWordLoading,
      formComplete,
      setProperties,
      newWordSpelling,
      convertRouteName,
      ifwordExists,
      outstandingCheck,
    };
  },
});
</script>
