<template>
  <v-card outlined rounded :min-height="100" class="my-4">
    <v-row>
      <v-spacer />
      <v-btn
        text
        color="primary"
        @click="$emit('cancel-add-side')"
        class="ma-4"
      >
        Cancel</v-btn
      >
    </v-row>
    <v-row justify="center" class="mt-7">
      {{ `Choose a side to ${action}.` }}
    </v-row>
    <v-row justify="center" class="mb-12">
      <side-selector
        v-for="(side, idx) in usableSides"
        :key="idx"
        :side="side"
        @selected="$emit('side-selected', side)"
        class="my-2 mx-3 cursor-display test-side-option"
      />
    </v-row>
  </v-card>
</template>

<script lang="ts">
import { EpigraphicUnitSide } from '@oare/types';
import { defineComponent, PropType } from '@vue/composition-api';
import SideSelector from './SideSelector.vue';

export default defineComponent({
  props: {
    usableSides: {
      type: Array as PropType<EpigraphicUnitSide[]>,
      required: true,
    },
    action: {
      type: String,
      required: true,
    },
  },
  components: {
    SideSelector,
  },
  setup() {
    return {};
  },
});
</script>

<style scoped>
.cursor-display {
  cursor: pointer;
}
</style>
