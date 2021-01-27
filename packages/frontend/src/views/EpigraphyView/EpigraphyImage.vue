<template>
  <img
    v-if="!errors.photo"
    :src="`https://cdli.ucla.edu/dl/photo/${cdli}.jpg`"
    @error="errors.photo = true"
    class="cdliImage"
    :class="{ fixed: $vuetify.breakpoint.smAndUp }"
    @load="$emit('image-loaded')"
  />
  <img
    v-else-if="!errors.lineart"
    :src="`https://cdli.ucla.edu/dl/lineart/${cdli}_l.jpg`"
    @error="
      errors.lineart = true;
      $emit('image-error');
    "
    class="cdliImage"
    :class="{ fixed: $vuetify.breakpoint.smAndUp }"
    @load="$emit('image-loaded')"
  />
</template>

<script lang="ts">
import { defineComponent, ref } from '@vue/composition-api';

export default defineComponent({
  props: {
    cdli: {
      type: String,
      required: true,
    },
  },
  setup() {
    const errors = ref({
      photo: false,
      lineart: false,
    });

    return {
      errors,
    };
  },
});
</script>

<style scoped lang="scss">
.fixed {
  position: fixed;
}

.cdliImage {
  max-height: 50vh;

  @media (min-height: 660px) {
    max-height: 65vh;
  }

  @media (min-height: 1000px) {
    max-height: 80vh;
  }
}
</style>
