<template>
  <OareContentView title="Upload Photos">
    <v-row>
      <v-col cols="6">
        <v-row
          v-if="photos.length === 0"
          justify="center"
          class="ma-0 mb-4 d-inline-block"
        >
          <b>Optional.</b>
          To begin adding photos, click the "Add Photo" button below. Uploads
          currently support PNG, JPEG, JPG, and TIFF file types. To inquire
          about support for other file types, please
          <a href="mailto:oarefeedback@byu.edu"> contact us</a>.
        </v-row>
        <photo-selector
          v-for="photo in photos"
          :key="photo.uuid"
          :uuid="photo.uuid"
          @export-photo="setPhoto"
          @remove-photo="removePhoto"
        />
        <v-btn @click="addPhoto" class="ml-10 my-4" text>
          <v-icon color="primary">mdi-plus</v-icon>
          <h3 class="text--primary">Add Photo</h3>
        </v-btn>
      </v-col>
      <v-col cols="6">
        <epigraphy-image
          v-if="photoUrls.length > 0"
          :imageLinks="photoUrls"
          :imageDetails="photosWithUrl"
          :maxSelect="1"
          :sticky="false"
        />
      </v-col>
    </v-row>
  </OareContentView>
</template>

<script lang="ts">
import EpigraphyImage from '@/views/Texts/EpigraphyView/EpigraphyDisplay/components/EpigraphyImage.vue';
import PhotoSelector from './components/PhotoSelector.vue';
import {
  defineComponent,
  ref,
  computed,
  watch,
  onMounted,
} from '@vue/composition-api';
import { TextPhoto } from '@oare/types';
import { v4 } from 'uuid';

export default defineComponent({
  components: {
    EpigraphyImage,
    PhotoSelector,
  },
  setup(_, { emit }) {
    const photos = ref<TextPhoto[]>([]);

    const setPhoto = (photo: TextPhoto) => {
      const existingUuids = photos.value.map(upload => upload.uuid);

      if (existingUuids.includes(photo.uuid)) {
        photos.value.splice(existingUuids.indexOf(photo.uuid), 1, photo);
      } else {
        photos.value.push(photo);
      }
    };

    const photosWithUrl = computed(() =>
      photos.value.filter(photo => photo.url)
    );

    const photoUrls = computed(() => {
      return photosWithUrl.value.map(photo => photo.url);
    });

    const addPhoto = () => {
      photos.value.push({
        uuid: v4(),
      });
    };

    const removePhoto = (uuid: string) => {
      photos.value = photos.value.filter(photo => photo.uuid !== uuid);
    };

    watch(
      photos,
      () => {
        emit('update-photos', photos.value);
      },
      { deep: true }
    );

    const stepComplete = computed(() =>
      photos.value.every(photo => photo.url && photo.side && photo.view)
    );

    watch(stepComplete, () => {
      emit('step-complete', stepComplete.value);
    });

    onMounted(() => {
      emit('step-complete', true);
    });

    return {
      photos,
      photoUrls,
      setPhoto,
      addPhoto,
      removePhoto,
      photosWithUrl,
    };
  },
});
</script>
