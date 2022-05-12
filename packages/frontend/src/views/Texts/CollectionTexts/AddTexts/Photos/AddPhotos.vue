<template>
  <OareContentView :title="inDialog ? '' : 'Upload Images'">
    <v-row v-if="!confirmed">
      <v-card class="pa-8 my-2" max-width="500">
        <v-row class="oare-header">Image Rights Acknowledgement</v-row>
        <v-row class="mt-6">
          By uploading images, you acknowledge that you have the legal right to
          share them. The images will be stored in the database's resources and
          always available to you as the uploader and to site administrators.
          Access to others must be granted by you in consultation with the site
          administrator. Only images that are uploaded into the databases
          resources will be able to be indexed down to individual signs in
          future development. Images uploaded have the best chance of being
          fully implemented into the research environment to the benefit of data
          fidelity. If you would prefer to share links to your images on your
          own server and are willing to do so, instead of uploading images in
          this way, please contact the administrator and we can arrange to link
          the images to the website where appropriate and at an appropriate
          level of access.
        </v-row>
        <v-row class="mt-6"
          ><b
            >If you do not have images to upload, please press "Skip" to
            proceed.</b
          ></v-row
        >
        <v-row>
          <v-btn @click="confirmed = true" color="primary" class="mt-6"
            >Confirm</v-btn
          >
          <v-btn @click="$emit('skip')" text color="primary" class="mt-6 ml-2"
            >Skip</v-btn
          >
        </v-row>
      </v-card>
    </v-row>
    <v-row v-else>
      <v-col cols="6">
        <v-row
          v-if="photos.length === 0"
          justify="center"
          class="ma-0 mb-4 d-inline-block"
        >
          <b v-if="!inDialog">Optional.</b>
          To begin adding images, click the "Add Image" button below. Uploads
          currently support PNG, JPEG, JPG, and TIFF file types. To inquire
          about support for other file types, please
          <a href="mailto:oarefeedback@byu.edu"> contact us</a>.
        </v-row>
        <photo-selector
          v-for="photo in photos"
          :key="photo.uuid"
          :uuid="photo.uuid"
          @export-photo="setPhotoDetails"
          @remove-photo="removePhoto(photo.uuid)"
        />
        <v-btn @click="addPhoto" class="ml-10 my-4" text>
          <v-icon color="primary">mdi-plus</v-icon>
          <h3 class="text--primary">Add Image</h3>
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
import { defineComponent, ref, computed, watch } from '@vue/composition-api';
import { TextPhoto } from '@oare/types';
import { v4 } from 'uuid';

export default defineComponent({
  components: {
    EpigraphyImage,
    PhotoSelector,
  },
  props: {
    inDialog: {
      type: Boolean,
      default: false,
    },
  },
  setup(_, { emit }) {
    const photos = ref<TextPhoto[]>([]);

    const confirmed = ref(false);

    const setPhotoDetails = (photo: TextPhoto) => {
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

    const stepComplete = computed(
      () =>
        photos.value.every(photo => photo.url && photo.side && photo.view) &&
        confirmed.value
    );

    watch(stepComplete, () => {
      emit('step-complete', stepComplete.value);
    });

    return {
      photos,
      photoUrls,
      setPhotoDetails,
      addPhoto,
      removePhoto,
      photosWithUrl,
      confirmed,
    };
  },
});
</script>
