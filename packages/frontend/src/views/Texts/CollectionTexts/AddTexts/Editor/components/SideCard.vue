<template>
  <v-card
    flat
    outlined
    @click="$emit('set-side')"
    :color="selected ? 'grey lighten-2' : null"
    class="my-2"
  >
    <v-row class="mx-4 my-1" justify="space-between">
      <h2 class="py-4" v-html="formatSide" />
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
import { EpigraphicUnitSide, MarkupUnit } from '@oare/types';
import { defineComponent, PropType, ref, computed } from '@vue/composition-api';

export default defineComponent({
  props: {
    side: {
      type: String as PropType<EpigraphicUnitSide>,
      required: true,
    },
    sideMarkup: {
      type: Array as PropType<MarkupUnit[]>,
      required: false,
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
  setup(props) {
    const sideEditMenu = ref(false);

    const formatSide = computed(() => {
      if (props.sideMarkup) {
        if (props.sideMarkup.map(markup => markup.type).includes('uncertain')) {
          return `${props.side}<sup>?</sup>`;
        } else if (
          props.sideMarkup
            .map(markup => markup.type)
            .includes('isEmendedReading')
        ) {
          return `${props.side}<sup>!</sup>`;
        }
        return props.side;
      }
      return props.side;
    });

    return {
      sideEditMenu,
      formatSide,
    };
  },
});
</script>
