<template>
  <div class="d-flex">
    <div v-for="(item, idx) in items" :key="idx">
      <router-link v-if="item.link" :to="item.link">{{
        item.text
      }}</router-link>
      <span v-else>{{ item.text }}</span>
      <span v-if="idx !== items.length - 1" class="mx-3">{{ '>' }}</span>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from '@vue/composition-api';
export interface BreadcrumbItem {
  link: string | null;
  text: string;
}

export default defineComponent({
  name: 'OareBreadcrumbs',
  props: {
    items: {
      type: Array as PropType<BreadcrumbItem[]>,
      required: true,
    },
  },
});
</script>

<style></style>
