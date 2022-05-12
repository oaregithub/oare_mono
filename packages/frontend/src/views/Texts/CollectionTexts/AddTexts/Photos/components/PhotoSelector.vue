<template>
  <v-container>
    <v-row>
      <v-spacer />
      <v-btn @click="removePhoto" text color="red" class="mr-3 mb-2"
        >Remove</v-btn
      >
    </v-row>
    <v-row class="ml-7 mr-0 mt-2">
      <v-col cols="6" class="py-0 pl-0 pr-1">
        <v-select
          v-model="sideSelection"
          :items="sideOptions"
          label="Side"
          dense
          outlined
        />
      </v-col>
      <v-col cols="6" class="py-0 pl-1 pr-0">
        <v-select
          v-model="viewSelection"
          :items="viewOptions"
          label="View"
          dense
          outlined
        />
      </v-col>
    </v-row>
    <v-row>
      <v-file-input
        class="ml-2 mr-3 mt-n4"
        chips
        outlined
        accept="image/png, image/jpeg, image/tiff"
        @change="setFile"
        label="Click to select image file to upload"
      />
    </v-row>
  </v-container>
</template>

<script lang="ts">
import {
  defineComponent,
  ref,
  watch,
  computed,
  ComputedRef,
} from '@vue/composition-api';
import { TextPhoto } from '@oare/types';

export default defineComponent({
  props: {
    uuid: {
      type: String,
      required: true,
    },
  },
  setup(props, { emit }) {
    const localPhotoUrl = ref<string>();
    const localUpload = ref<File>();
    const setFile = async (upload: File) => {
      localUpload.value = upload;
      localPhotoUrl.value = await readURL(upload);
    };

    const readURL = (file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = event => reject(event);
        reader.readAsDataURL(file);
      });
    };

    const sideSelection = ref<number | string>();
    const viewSelection = ref<string>();

    const sideOptions = ref([
      {
        text: 'obv.',
        value: 1,
      },
      {
        text: 'lo.e.',
        value: 2,
      },
      {
        text: 'rev.',
        value: 3,
      },
      {
        text: 'u.e.',
        value: 4,
      },
      {
        text: 'le.e.',
        value: 5,
      },
      {
        text: 'r.e.',
        value: 6,
      },
      {
        text: 'Envelope Inner obv.',
        value: 'a',
      },
      {
        text: 'Envelope Inner lo.e.',
        value: 'b',
      },
      {
        text: 'Envelope Inner rev.',
        value: 'c',
      },
      {
        text: 'Envelope Inner u.e.',
        value: 'd',
      },
      {
        text: 'Envelope Inner le.e.',
        value: 'e',
      },
      {
        text: 'Envelope Inner r.e.',
        value: 'f',
      },
      {
        text: 'Fat Cross',
        value: 'x',
      },
      {
        text: 'Handcopy',
        value: 'h',
      },
      {
        text: 'Unknown Side',
        value: 8,
      },
      {
        text: 'Unknown Edge',
        value: 9,
      },
    ]);
    const viewOptions = ref([
      {
        text: 'Upper (from above)',
        value: 'u',
      },
      {
        text: 'Direct',
        value: 'd',
      },
      {
        text: 'Lower',
        value: 'l',
      },
      {
        text: 'Inverted Direct',
        value: 'i',
      },
      {
        text: 'Inverted Upper',
        value: 'h',
      },
      {
        text: 'Inverted Lower',
        value: 'j',
      },
      {
        text: 'View for Scale',
        value: 'z',
      },
      {
        text: 'Emphasis on Name',
        value: 'n',
      },
      {
        text: 'Seal Impression Focus',
        value: 's',
      },
    ]);

    const photo: ComputedRef<TextPhoto | null> = computed(() => {
      if (
        localPhotoUrl.value &&
        sideSelection.value &&
        viewSelection.value &&
        localUpload.value
      ) {
        return {
          uuid: props.uuid,
          url: localPhotoUrl.value,
          side: sideSelection.value,
          view: viewSelection.value,
          upload: localUpload.value,
        };
      } else {
        return null;
      }
    });

    watch(photo, () => {
      if (photo.value) {
        emit('export-photo', photo.value);
      }
    });

    const removePhoto = () => {
      emit('remove-photo');
    };

    return {
      setFile,
      localPhotoUrl,
      sideOptions,
      viewOptions,
      sideSelection,
      viewSelection,
      removePhoto,
    };
  },
});
</script>
