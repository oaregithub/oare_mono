<template>
  <div @click="$emit('selected')">
    <v-card height="77px" width="50px" outlined rounded color="info" hover>
      <v-container fluid>
        <v-row>
          <v-spacer />
          <v-card
            height="7px"
            width="20px"
            rounded
            :color="side === 'u.e.' ? 'primary' : null"
            class="mt-1"
          />
          <v-spacer />
        </v-row>
        <v-row>
          <v-spacer />
          <v-card
            height="20px"
            width="7px"
            rounded
            :color="side === 'le.e.' ? 'primary' : null"
            class="mt-1"
          />
          <v-spacer />
          <v-card
            height="20px"
            width="20px"
            rounded
            :color="side === 'obv.' ? 'primary' : null"
            class="mt-1"
          />
          <v-spacer />
          <v-card
            height="20px"
            width="7px"
            rounded
            :color="side === 'r.e.' ? 'primary' : null"
            class="mt-1"
          />
          <v-spacer />
        </v-row>
        <v-row>
          <v-spacer />
          <v-card
            height="7px"
            width="20px"
            rounded
            :color="side === 'lo.e.' ? 'primary' : null"
            class="mt-1"
          />
          <v-spacer />
        </v-row>
        <v-row>
          <v-spacer />
          <v-card
            height="20px"
            width="20px"
            rounded
            :color="side === 'rev.' ? 'primary' : null"
            class="mt-1"
          />
          <v-spacer />
        </v-row>
      </v-container>
    </v-card>
    <v-row justify="center" class="mt-1">
      {{ side }}
    </v-row>
  </div>
</template>

<script lang="ts">
import { SideOption } from '@oare/types';
import { defineComponent, PropType } from '@vue/composition-api';

export default defineComponent({
  props: {
    side: {
      type: String as PropType<SideOption>,
      required: true,
    },
  },
  setup() {
    return {};
  },
});
</script>
