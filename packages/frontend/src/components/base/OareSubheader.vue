<template>
  <h3 class="title font-weight-regular mb-4">
    <slot></slot>
    <v-divider />
  </h3>
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api';

export default defineComponent({
  name: 'OareSubheader',
});
</script>

<style></style>
