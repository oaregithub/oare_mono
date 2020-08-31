<template>
  <div class="title font-weight-regular pl-md-6 pl-xs-2">
    <slot></slot>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "@vue/composition-api";

export default defineComponent({
  name: "OareListItem",
});
</script>

<style></style>
