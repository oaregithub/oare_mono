<template>
  <div class="ma-5">
    <h2>Comments</h2>

    <div v-for="(thread, idx) in threads" :key="idx">
      <h1>{{ thread }}</h1>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, ref } from '@vue/composition-api';

export default defineComponent({
  name: 'ThreadsDisplay',
  props: {
    threads: {
      type: Array as PropType<any>,
      required: true,
    },
  },

  setup(props) {
    const groupedByThreads = ref({});

    return {};
  },
});
</script>
