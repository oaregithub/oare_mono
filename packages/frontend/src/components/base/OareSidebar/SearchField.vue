<template>
  <div class="d-flex flex-column">
    <div class="d-flex">
      <h4>{{ label }}</h4>
      <text-name-information-card v-if="textNameDisplayHelp" />
      <transliteration-information-card v-if="transliterationDisplayHelp" />
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
import TransliterationInformationCard from '@/views/Search/TextsSearch/components/TransliterationInformationCard.vue';
import TextNameInformationCard from '@/views/Search/TextsSearch/components/TextNameInformationCard.vue';
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
    textNameDisplayHelp: {
      type: Boolean,
      default: false,
    },
    transliterationDisplayHelp: {
      type: Boolean,
      default: false,
    },
  },
  components: {
    TransliterationInformationCard,
    TextNameInformationCard,
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
