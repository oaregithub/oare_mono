<template>
  <span class="mr-1" v-if="formGrammar !== ''">({{ formGrammar }})</span>
</template>

<script lang="ts">
import {
  defineComponent,
  PropType,
  computed,
  ref,
  Ref,
  reactive,
} from '@vue/composition-api';
import { DictionaryForm, SpellingText } from '@oare/types';
import { DataTableHeader } from 'vuetify';
import utils from '@/utils';

export default defineComponent({
  props: {
    form: {
      type: Object as PropType<DictionaryForm>,
      required: true,
    },
  },
  setup(props) {
    const search = ref('');

    const formGrammar = computed(() => utils.formGrammarString(props.form));

    return {
      formGrammar,
      search,
    };
  },
});
</script>
