<template>
  <OareContentView title="People (Prosopographical Index)" :loading="loading">
    <h1>Persons stuff</h1>
  </OareContentView>
</template>

<script lang="ts">
import { defineComponent, ref } from '@vue/composition-api';

export default defineComponent({
  name: 'PersonsView',

  setup() {
    const loading = ref(false);

    return {
      loading,
    };
  },
});
</script>
