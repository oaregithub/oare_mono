<template>
  <div @click="$emit('set-column')">
    <v-card
      height="77px"
      width="60px"
      outlined
      rounded
      color="red"
      class="px-1"
      hover
    >
      <v-container fluid>
        <v-row justify="space-around">
          <v-card
            v-for="(num, idx) in columnArray"
            :key="idx"
            rounded
            height="67px"
            :width="`${40 / columnArray.length}px`"
            class="my-1"
          />
        </v-row>
      </v-container>
    </v-card>
    <v-row justify="center" class="mt-1">
      {{ columns === 4 ? '4+' : columns }}
    </v-row>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed } from '@vue/composition-api';

export default defineComponent({
  props: {
    columns: {
      type: Number,
      required: true,
    },
  },
  setup(props) {
    const columnArray = computed(() => {
      const array = [];
      for (let i = 1; i <= props.columns; i += 1) {
        array.push(i);
      }
      return array;
    });
    return {
      columnArray,
    };
  },
});
</script>
