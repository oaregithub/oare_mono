<template>
  <oare-dialog
    title="Add Lemma"
    @input="$emit('input', $event)"
    :submitDisabled="!newWordSpelling"
    @submit="addLemma"
    :submitLoading="addLemmaLoading"
    :value="value"
    :persistent="false"
    :width="1150"
  >
    <OareContentView>
      <v-text-field
        v-model="newWordSpelling"
        placeholder="New word spelling"
        class="test-word-spelling"
      />
      <v-row>
        <v-col cols="10">
          <!-- <add-properties
            :startingUuid="partOfSpeechValueUuid"
            requiredNodeValueName="Parse"
            @export-properties="setProperties($event)"
            @form-complete="formComplete = $event"
          /> -->
        </v-col>
      </v-row>
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
  DisplayableWord,
} from '@oare/types';
import OareContentView from '@/components/base/OareContentView.vue';
import WordGrammar from './WordGrammar.vue';
// import { ReloadKey } from '../index.vue';
import sl from '@/serviceLocator';
import AddProperties from '@/components/Properties/AddProperties.vue';
import { convertParsePropsToItemProps } from '@oare/oare';

export default defineComponent({
  name: 'AddLemmaDialog',
  components: {
    OareContentView,
    AddProperties,
  },
  props: {
    value: {
      type: Boolean,
      required: true,
    },
    wordList: {
      type: Array as PropType<DisplayableWord[]>,
      required: true,
    },
  },
  setup(props) {
    const server = sl.get('serverProxy');
    const actions = sl.get('globalActions');
    // const reload = inject(ReloadKey);

    const addLemmaLoading = ref(false);
    const formComplete = ref(false);
    const newWordSpelling = ref('');
    const properties = ref<ParseTreeProperty[]>([]);

    const setProperties = (propertyList: ParseTreeProperty[]) => {
      properties.value = propertyList;
    };

    // const partOfSpeechValueUuid = computed(() => {
    //   const posProperties = props.wordList[1].properties.filter(
    //     prop => prop.variableName === 'Part of Speech'
    //   );
    //   return posProperties.length > 0 ? posProperties[0].valueUuid : undefined;
    // });

    const addLemma = computed(() => {
      try {
        addLemmaLoading.value = true;
        return newWordSpelling;
      } catch (err) {
        actions.showErrorSnackbar(
          'Error adding new form. Please try again.',
          err as Error
        );
      } finally {
        addLemmaLoading.value = false;
      }
    });

    return {
      addLemma,
      addLemmaLoading,
      formComplete,
      // selectedItemProperties,
      setProperties,
      // partOfSpeechValueUuid,
      newWordSpelling,
    };
  },
});
</script>
