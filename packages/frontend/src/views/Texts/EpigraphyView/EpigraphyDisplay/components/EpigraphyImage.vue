<template>
  <v-container class="sticky">
    <v-row align="center" justify="center">
      <v-slide-group
        :value="selectedImages"
        @change="updateSelected"
        class="pa-4"
        show-arrows
        center-active
        multiple
      >
        <v-slide-item
          v-for="(image, index) in imageLinks"
          :key="index"
          v-slot="{ active, toggle }"
        >
          <v-card
            :color="active ? 'yellow' : 'grey lighten-3'"
            elevation="0"
            class="ma-2"
            height="100"
            width="100"
            @click="toggle"
          >
            <v-card-text class="justify-center pa-2">
              <v-img :src="image" :aspect-ratio="1 / 1" class="rounded">
                <v-row class="pa-7" align="center" justify="center">
                  <v-scale-transition>
                    <v-icon
                      v-if="active"
                      color="white"
                      size="48"
                      v-text="'mdi-close-circle-outline'"
                    ></v-icon>
                  </v-scale-transition>
                </v-row>
              </v-img>
            </v-card-text>
          </v-card>
        </v-slide-item>
      </v-slide-group>
    </v-row>
    <v-row align="center" justify="center">
      <v-img
        v-for="(selection, idx) in selectedImages"
        :key="idx"
        :src="imageLinks[selection]"
        max-height="50vh"
        :max-width="selectedImages.length > 1 ? '18vw' : '36vw'"
        contain
        class="pa-4"
      />
    </v-row>
  </v-container>
</template>

<script lang="ts">
import { defineComponent, PropType, ref } from '@vue/composition-api';

export default defineComponent({
  props: {
    imageLinks: {
      type: Array as PropType<String[]>,
      required: true,
    },
  },
  setup() {
    const selectedImages = ref([0]);

    const updateSelected = (selection: number[]) => {
      selectedImages.value = selection;
      if (selectedImages.value.length > 2) {
        selectedImages.value.shift();
      }
    };

    return {
      selectedImages,
      updateSelected,
    };
  },
});
</script>

<style scoped>
.sticky {
  position: sticky;
  top: 1.5in;
}
</style>
