<template>
  <oare-dialog
    :value="value"
    @input="$emit('input', $event)"
    closeOnSubmit
    @submit="setSpellingUuid"
    :showSubmit="forms.length > 0"
  >
    <OareContentView title="Select Lexical Form">
      <b class="mr-1">{{ word.explicitSpelling }}</b>
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
          :value="option.spellingUuid"
        >
          <template #label>
            <b class="mr-1">{{ option.word }} - </b>
            <b class="mr-1">
              <i>{{ option.form.form }}</i>
            </b>
            <grammar-display :form="option.form" />
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
} from '@vue/composition-api';
import { SearchSpellingResultRow, TextDiscourseRow } from '@oare/types';
import GrammarDisplay from '@/components/DictionaryDisplay/DictionaryWord/Forms/components/GrammarDisplay.vue';

export default defineComponent({
  props: {
    value: {
      type: Boolean,
      default: false,
    },
    word: {
      type: Object as PropType<TextDiscourseRow>,
      required: true,
    },
    forms: {
      type: Array as PropType<SearchSpellingResultRow[]>,
      required: true,
    },
  },
  components: {
    GrammarDisplay,
  },
  setup(props, { emit }) {
    const selectedOption = ref();

    const setSpellingUuid = () => {
      emit('set-spelling-uuid', selectedOption.value);
    };

    onMounted(() => {
      if (props.forms.length === 1) {
        selectedOption.value = props.forms[0].spellingUuid;
      } else if (props.word.spellingUuid) {
        selectedOption.value = props.forms.filter(
          form => form.spellingUuid === props.word.spellingUuid
        )[0].spellingUuid;
      }
    });
    return {
      selectedOption,
      setSpellingUuid,
    };
  },
});
</script>
