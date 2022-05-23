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
    <v-row align="center" justify="center">
      <div v-for="(selection, idx) in selectedImages" :key="idx">
        <v-row v-if="imageDetails && imageDetails.length > 0" class="mx-2 mb-1">
          <span
            ><b>Side: </b>{{ parseSide(imageDetails[selection].side) }}</span
          >
          <v-spacer />
          <span
            ><b>View: </b>{{ parseView(imageDetails[selection].view) }}</span
          >
        </v-row>
        <inner-image-zoom :src="imageLinks[selection].link" moveType="drag" />
        <div class="text-center">
          <span>
            Photo Source: {{ imageLinks[selection].label || 'Unavailable' }}
            <br />
            For more information in photo, click (here).</span
          >
        </div>
      </div>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import { defineComponent, PropType, ref } from '@vue/composition-api';
import { TextPhoto, EpigraphyLabelLink } from '@oare/types';
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
    imageDetails: {
      type: Array as PropType<TextPhoto[]>,
      required: false,
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

    const updateSelected = (selection: number[]) => {
      selectedImages.value = selection;
      if (selectedImages.value.length > props.maxSelect) {
        selectedImages.value.shift();
      }
    };

    const parseSide = (sideCode: string | number | undefined) => {
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
        default:
          return 'No side information available';
      }
    };

    const parseView = (viewCode: string | undefined) => {
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
        default:
          return 'No view information available';
      }
    };

    return {
      selectedImages,
      updateSelected,
      parseSide,
      parseView,
    };
  },
});
</script>

<style scoped>
.sticky {
  position: sticky;
  top: 1.1in;
}
.zoom-container {
  width: 36vw;
}
</style>
