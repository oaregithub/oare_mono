<template>
  <div>
    <div class="fixed">
      <v-btn
        v-for="(lett, lettGroup) in letterGroups"
        class="mr-2 mb-2"
        :key="lettGroup"
        fab
        small
        color="primary"
        :to="`/collections/${encodedLetter(lettGroup)}`"
        >{{ lettGroup }}</v-btn
      >
    </div>
    <div v-for="collection in collections" :key="collection.uuid">
      <router-link :to="`/collections/name/${collection.uuid}`"
        >{{ collection.name }}
      </router-link>
    </div>
  </div>
</template>

<script lang="ts">
import {
  defineComponent,
  ref,
  Ref,
  onMounted,
  computed,
  PropType,
} from '@vue/composition-api';
import { CollectionListItem } from '@oare/types';
import { letterGroups } from './utils';

export default defineComponent({
  name: 'CollectionsList',
  props: {
    collections: {
      type: Array as PropType<CollectionListItem[]>,
      required: true,
    },
  },
  setup() {
    return {
      letterGroups,
      encodedLetter: (letter: string) => encodeURIComponent(letter),
    };
  },
});
</script>

<style></style>
