<template>
  <OareContentView
    :title="`Add New Text to ${collectionName}`"
    :loading="loading"
  >
    <v-stepper v-model="step">
      <v-stepper-header>
        <v-stepper-step :complete="step > 1" step="1">
          Text Info
        </v-stepper-step>
        <v-divider />
        <v-stepper-step :complete="step > 2" step="2">
          Upload Photos
        </v-stepper-step>
        <v-divider />
        <v-stepper-step :complete="step > 3" step="3"> Editor </v-stepper-step>
        <v-divider />
        <v-stepper-step :complete="step > 4" step="4">
          Lexical Info
        </v-stepper-step>
        <v-divider />
        <v-stepper-step step="5"> Final Preview </v-stepper-step>
      </v-stepper-header>

      <v-stepper-items>
        <v-stepper-content step="1">
          <text-info-set />

          <v-btn color="primary" @click="step = 2"> Continue </v-btn>
        </v-stepper-content>

        <v-stepper-content step="2">
          <v-card class="mb-12" color="grey lighten-1" height="200px"></v-card>

          <v-btn color="primary" @click="step = 3"> Continue </v-btn>
          <v-btn text @click="step -= 1"> Back </v-btn>
        </v-stepper-content>

        <v-stepper-content step="3">
          <add-text-editor />

          <v-btn color="primary" @click="step = 4"> Continue </v-btn>
          <v-btn text @click="step -= 1"> Back </v-btn>
        </v-stepper-content>

        <v-stepper-content step="4">
          <v-card class="mb-12" color="grey lighten-1" height="200px"></v-card>

          <v-btn color="primary" @click="step = 5"> Continue </v-btn>
          <v-btn text @click="step -= 1"> Back </v-btn>
        </v-stepper-content>

        <v-stepper-content step="5">
          <v-card class="mb-12" color="grey lighten-1" height="200px"></v-card>

          <v-btn text @click="step -= 1"> Back </v-btn>
        </v-stepper-content>
      </v-stepper-items>
    </v-stepper>
  </OareContentView>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from '@vue/composition-api';
import sl from '@/serviceLocator';
import AddTextEditor from './Editor/AddTextEditor.vue';
import TextInfoSet from './TextInfo/TextInfoSet.vue';

export default defineComponent({
  props: {
    collectionUuid: {
      type: String,
      required: true,
    },
  },
  components: {
    AddTextEditor,
    TextInfoSet,
  },
  setup(props) {
    const server = sl.get('serverProxy');
    const actions = sl.get('globalActions');

    const collectionName = ref('');
    const step = ref(1);
    const loading = ref(false);

    onMounted(async () => {
      loading.value = true;
      try {
        collectionName.value = (
          await server.getCollectionInfo(props.collectionUuid)
        ).name;
      } catch {
        actions.showErrorSnackbar(
          'Error loading collection name. Please try again.'
        );
      } finally {
        loading.value = false;
      }
    });

    return {
      collectionName,
      step,
      loading,
    };
  },
});
</script>
