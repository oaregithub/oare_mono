<template>
  <div>edit stuff</div>
</template>

<script lang="ts">
import { defineComponent, PropType, ref } from '@vue/composition-api';
import { WordWithForms, DictionaryForm } from '@/types/dictionary';

export default defineComponent({
  props: {
    wordInfo: {
      type: Object as PropType<WordWithForms>,
      required: true,
    },
  },
  setup() {
    const loading = ref(true);

    return {
      loading,
    };
  },
});
</script>
