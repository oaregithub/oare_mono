<template>
  <oare-dialog
    :value="value"
    @input="$emit('input', $event)"
    closeOnSubmit
    @submit="setSpelling"
    :showSubmit="forms.length > 0"
    submitText="OK"
  >
    <OareContentView title="Select Lexical Form">
      <b class="mr-1">{{ spelling }}</b>
      <span v-if="forms.length > 0"
        >appears in the following lexical form(s). Select the appropriate form
        to link this occurrence to the dictionary.</span
      >
      <span v-else
        >does not appear in any forms. It cannot be connected to the dictionary
        at this time.</span
      >
      <v-radio-group v-model="selectedOption">
        <v-radio
          v-for="option in forms"
          :key="option.spellingUuid"
          :value="option"
        >
          <template #label>
            <b class="mr-1">{{ option.word }} - </b>
            <b class="mr-1">
              <i>{{ option.form.form }}</i>
            </b>
            <grammar-display :form="option.form" :allowEditing="false" />
          </template>
        </v-radio>
      </v-radio-group>
      <v-btn
        v-if="forms.length > 0"
        @click="selectedOption = undefined"
        color="primary"
        :disabled="!selectedOption"
      >
        Disconnect
      </v-btn>
    </OareContentView>
  </oare-dialog>
</template>

<script lang="ts">
import {
  defineComponent,
  ref,
  onMounted,
  PropType,
  watch,
} from '@vue/composition-api';
import { SearchSpellingResultRow } from '@oare/types';
import GrammarDisplay from '@/views/DictionaryWord/components/WordInfo/components/Forms/components/GrammarDisplay.vue';

export default defineComponent({
  props: {
    value: {
      type: Boolean,
      default: false,
    },
    spelling: {
      type: String,
      required: true,
    },
    forms: {
      type: Array as PropType<SearchSpellingResultRow[]>,
      required: true,
    },
    spellingUuid: {
      type: String,
      required: false,
    },
  },
  components: {
    GrammarDisplay,
  },
  setup(props, { emit }) {
    const selectedOption = ref<SearchSpellingResultRow>();

    const setSpelling = () => {
      emit('set-spelling', selectedOption.value);
    };

    const resetSelectedOption = () => {
      if (props.spellingUuid) {
        const relevantForm = props.forms.find(
          form => form.spellingUuid === props.spellingUuid
        );
        selectedOption.value = relevantForm;
      }
    };

    onMounted(() => {
      resetSelectedOption();
    });

    watch(
      () => props.value,
      () => {
        if (props.value) {
          resetSelectedOption();
        }
      }
    );

    return {
      selectedOption,
      setSpelling,
    };
  },
});
</script>
