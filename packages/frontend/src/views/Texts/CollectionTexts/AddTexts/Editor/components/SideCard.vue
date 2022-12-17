<template>
  <v-card
    flat
    outlined
    @click="$emit('set-side')"
    :color="selected ? 'grey lighten-2' : null"
    class="my-2"
  >
    <v-row class="mx-4 my-1" justify="space-between">
      <h2 class="py-4">{{ side }}</h2>
      <v-speed-dial
        v-if="showEditButton"
        v-model="sideEditMenu"
        direction="left"
        :open-on-hover="true"
        transition="slide-x-reverse-transition"
        class="my-3"
      >
        <template v-slot:activator>
          <v-btn v-model="sideEditMenu" color="primary" dark fab x-small>
            <v-icon v-if="sideEditMenu"> mdi-close </v-icon>
            <v-icon v-else> mdi-pencil </v-icon>
          </v-btn>
        </template>
        <v-tooltip bottom>
          <template #activator="{ on, attrs }">
            <v-btn
              fab
              dark
              x-small
              color="info"
              v-on="on"
              v-bind="attrs"
              @click="$emit('change-side')"
            >
              <v-icon>mdi-pencil</v-icon>
            </v-btn>
          </template>
          <span>Change Side</span>
        </v-tooltip>
        <v-tooltip bottom>
          <template #activator="{ on, attrs }">
            <v-btn
              fab
              dark
              x-small
              color="red"
              v-on="on"
              v-bind="attrs"
              @click="$emit('remove-side')"
            >
              <v-icon>mdi-delete</v-icon>
            </v-btn>
          </template>
          <span>Remove Side</span>
        </v-tooltip>
      </v-speed-dial>
    </v-row>
  </v-card>
</template>

<script lang="ts">
import { EpigraphicUnitSide } from '@oare/types';
import { defineComponent, PropType, ref } from '@vue/composition-api';

export default defineComponent({
  props: {
    side: {
      type: String as PropType<EpigraphicUnitSide>,
      required: true,
    },
    selected: {
      type: Boolean,
      required: true,
    },
    showEditButton: {
      type: Boolean,
      default: true,
    },
  },
  setup() {
    const sideEditMenu = ref(false);
    return {
      sideEditMenu,
    };
  },
});
</script>
