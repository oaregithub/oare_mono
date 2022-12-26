<template>
  <v-container :class="{ sticky: sticky }">
    <v-row align="center" justify="center">
      <v-slide-group
        :value="selectedImages"
        @change="updateSelected"
        class="pa-2"
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
            height="70"
            width="70"
            @click="toggle"
          >
            <v-card-text class="justify-center pa-2">
              <v-img :src="image.link" :aspect-ratio="1 / 1" class="rounded">
                <v-row class="pt-5" align="center" justify="center">
                  <v-scale-transition>
                    <v-icon
                      v-if="active"
                      color="white"
                      size="35"
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
    <v-row align="start">
      <v-col
        v-for="(selection, idx) in selectedImages"
        :key="idx"
        :cols="selectedImages.length > 1 ? 12 / selectedImages.length : 12"
      >
        <v-row v-if="imageLinks.length > 0">
          <v-col>
            <v-row justify="center" align="center">
              <div class="text-center">
                <span
                  ><b>Side: </b>{{ parseSide(imageLinks[selection].side) }}
                  <br />
                  <b>View: </b>{{ parseView(imageLinks[selection].view) }}</span
                >
              </div>
              <div class="mr-n6">
                <v-btn
                  v-if="compressedImages.includes(selection)"
                  fab
                  icon
                  height="40px"
                  right
                  width="40px"
                  :key="`expand-${selection}`"
                  @click="expandImage(selection)"
                  ><v-icon>mdi-arrow-expand-horizontal</v-icon>
                </v-btn>
                <v-btn
                  v-else
                  fab
                  icon
                  height="40px"
                  right
                  width="40px"
                  :key="`compress-${selection}`"
                  @click="compressImage(selection)"
                  ><v-icon>mdi-arrow-collapse-horizontal</v-icon>
                </v-btn>
              </div>
            </v-row>
          </v-col>
        </v-row>
        <v-row justify="center">
          <v-card
            v-if="!compressedImages.includes(selection)"
            outlined
            class="overflow-auto"
            max-height="55vh"
          >
            <v-row justify="center">
              <inner-image-zoom
                :src="imageLinks[selection].link"
                moveType="drag"
              />
            </v-row>
          </v-card>
          <v-card
            v-else
            :img="imageLinks[selection].link"
            :width="getWidth(imageLinks[selection].link)"
            height="55vh"
            outlined
          >
          </v-card>
        </v-row>
        <v-row justify="center">
          <span class="text-center">
            Photo Source:
            {{ imageLinks[selection].label || 'Unavailable' }}
            <br />
            For more information in photo, click (here).</span
          >
        </v-row>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import { defineComponent, PropType, Ref, ref } from '@vue/composition-api';
import { EpigraphyLabelLink } from '@oare/types';
import InnerImageZoom from 'vue-inner-image-zoom';

export default defineComponent({
  components: {
    InnerImageZoom,
  },
  props: {
    imageLinks: {
      type: Array as PropType<EpigraphyLabelLink[]>,
      required: true,
    },
    maxSelect: {
      type: Number,
      default: 2,
    },
    sticky: {
      type: Boolean,
      default: true,
    },
  },
  setup(props) {
    const selectedImages = ref([0]);
    const compressedImages: Ref<number[]> = ref([]);

    const compressImage = (selection: number) => {
      compressedImages.value.push(selection);
    };

    const expandImage = (selection: number) => {
      const indexToRemove = compressedImages.value.indexOf(selection);
      compressedImages.value.splice(indexToRemove, 1);
    };

    const getWidth = (src: string) => {
      const image = new Image();
      image.src = src;
      const heightRatio = (window.innerHeight * 0.55) / image.height;

      return (heightRatio * image.width + 1).toFixed(0);
    };

    const updateSelected = (selection: number[]) => {
      selectedImages.value = selection;
      compressedImages.value = [];
      if (selectedImages.value.length > props.maxSelect) {
        selectedImages.value.shift();
      }
    };

    const parseSide = (sideCode: string | number | null) => {
      switch (sideCode) {
        case 1:
          return 'obv.';
        case 2:
          return 'lo.e.';
        case 3:
          return 'rev.';
        case 4:
          return 'u.e.';
        case 5:
          return 'le.e.';
        case 6:
          return 'r.e.';
        case 'a':
          return 'Envelope Inner obv.';
        case 'b':
          return 'Envelope Inner lo.e.';
        case 'c':
          return 'Envelope Inner rev.';
        case 'd':
          return 'Envelope Inner u.e.';
        case 'e':
          return 'Envelope Inner le.e.';
        case 'f':
          return 'Envelope Inner r.e.';
        case 'x':
          return 'Fat Cross';
        case 'h':
          return 'Handcopy';
        case 8:
          return 'Unknown Side';
        case 9:
          return 'Unknown Edge';
        case null:
          return 'No side information';
        default:
          return sideCode;
      }
    };

    const parseView = (viewCode: string | null) => {
      switch (viewCode) {
        case 'u':
          return 'Upper (from above)';
        case 'd':
          return 'Direct';
        case 'l':
          return 'Lower';
        case 'i':
          return 'Inverted Direct';
        case 'h':
          return 'Inverted Upper';
        case 'j':
          return 'Inverted Lower';
        case 'z':
          return 'View for Scale';
        case 'n':
          return 'Emphasis on Name';
        case 's':
          return 'Seal Impression Focus';
        case 'fr':
          return 'From Right';
        case 'fl':
          return 'From Left';
        case 'cx':
          return 'Contextual';
        case 'du':
          return 'Detail Unspecified';
        case null:
          return 'No view information';
        default:
          return viewCode;
      }
    };

    return {
      selectedImages,
      compressedImages,
      updateSelected,
      parseSide,
      parseView,
      compressImage,
      expandImage,
      getWidth,
    };
  },
});
</script>

<style scoped>
.sticky {
  position: sticky;
  top: 0.9in;
}
</style>
