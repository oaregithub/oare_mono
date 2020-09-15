<template>
  <div class="d-flex flex-column">
    <div class="d-flex">
      <h4>{{ label }}</h4>
      <v-dialog v-model="helpOpen" width="500">
        <v-card>
          <v-card-title>Help</v-card-title>
          <v-card-text>
            <slot name="help-body"></slot>
          </v-card-text>
        </v-card>
      </v-dialog>
    </div>
    <v-text-field
      :value="value"
      @input="$emit('input', $event)"
      outlined
      filled
      :background-color="disabled ? 'grey' : 'white'"
      light
      dense
      :disabled="disabled"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from '@vue/composition-api';
export default defineComponent({
  props: {
    label: {
      type: String,
      required: true,
    },
    value: {
      type: String,
      required: true,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
  },
  setup() {
    const helpOpen = ref(false);

    return {
      helpOpen,
    };
  },
});
</script>

<style></style>
