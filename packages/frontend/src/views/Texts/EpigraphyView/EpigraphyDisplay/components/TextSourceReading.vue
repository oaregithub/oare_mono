<template>
  <div>
    <h1>TEXT SOURCE</h1>
    <span>{{textContent}}</span>
  </div>
</template>

<script>
import { defineComponent, ref, PropType, computed } from '@vue/composition-api';

export default defineComponent({
  props: {
      
  },
  setup() {
    const textContent = ref('');

    textContent.value = "Hello, world!";

    return {
        textContent,
        getTextContent,
    };
  },
});
</script>
