<template>
  <OareContentView :title="seal.name" :loading="loading">
    <div
      class="d-flex d-flex-row"
      v-if="
        seal.sealProperties.length > 0 ||
        seal.sealImpressions.length > 0 ||
        seal.imageLinks.length > 0
      "
    >
      <v-row>
        <v-col cols="4">
          <h3 class="pb-2">Seal Info</h3>
          <div
            v-if="seal.sealProperties.length > 0"
            class="test-seal-properties"
          >
            <div
              v-for="(property, idx) in seal.sealProperties"
              :key="`property-${idx}`"
            >
              {{ Object.keys(property)[0] }}:
              <span> {{ Object.values(property)[0] }}</span>
            </div>
          </div>
          <div v-else>
            <span class="text--disabled test-seal-no-properties"
              >this seal does not have any properties at this time</span
            >
          </div>
          <h3 class="pb-2 pt-4">Impressions</h3>
          <div
            v-if="seal.sealImpressions.length > 0"
            class="test-seal-impressions"
          >
            <div
              v-for="(impression, idx) in seal.sealImpressions"
              :key="`impression-${idx}`"
              class="font-weight-bold"
            >
              {{ impression.text.name }} {{ getSideName(impression.side) }}
              <div class="ml-2">
                User: {{ impression.user ? impression.user : 'None Assigned' }}
              </div>
            </div>
          </div>
          <div v-else>
            <span class="text--disabled test-seal-no-impressions"
              >this seal does not have any seal impressions at this time</span
            >
          </div>
        </v-col>
        <v-col cols="8">
          <h3 class="pb-2">Images</h3>
          <div v-if="seal.imageLinks.length > 0" class="test-seal-images">
            <div
              v-for="(image, idx) in seal.imageLinks"
              :key="`image-${idx}`"
              class="pa-3"
            >
              <v-img
                class="flex-shrink-1"
                height="80px"
                max-width="300px"
                :src="seal.imageLinks[idx]"
                contain
              ></v-img>
            </div>
          </div>
          <div v-else class="text--disabled test-seal-no-images">
            There are no images for this seal at this time
          </div>
        </v-col>
      </v-row>
    </div>
    <div v-else class="text--disabled test-seal-no-info">
      There is no other information concerning this seal at this time
    </div>
  </OareContentView>
</template>

<script lang="ts">
import { defineComponent, ref, Ref, onMounted } from '@vue/composition-api';
import { Seal } from '@oare/types';
import sl from '@/serviceLocator';

export default defineComponent({
  name: 'SealView',
  components: {},
  props: {
    uuid: {
      type: String,
      required: false,
    },
  },
  setup(props) {
    const loading = ref(false);
    const seal: Ref<Seal> = ref({
      name: '',
      uuid: '',
      imageLinks: [],
      sealImpressions: [],
      sealProperties: [],
      count: 0,
    });
    const server = sl.get('serverProxy');
    const actions = sl.get('globalActions');

    const getSideName = (sideNumber: number) => {
      if (sideNumber === 1) {
        return 'obv.';
      }
      if (sideNumber === 2) {
        return 'lo.e.';
      }
      if (sideNumber === 3) {
        return 'rev.';
      }
      if (sideNumber === 4) {
        return 'u.e.';
      }
      if (sideNumber === 5) {
        return 'le.e.';
      }
      if (sideNumber === 6) {
        return 'r.e.';
      }
      return '';
    };

    onMounted(async () => {
      loading.value = true;
      try {
        if (props.uuid) {
          seal.value = await server.getSealByUuid(props.uuid);
        }
      } catch (err) {
        actions.showErrorSnackbar(
          'Error loading seals. Please try again.',
          err as Error
        );
      } finally {
        loading.value = false;
      }
    });

    return {
      loading,
      seal,
      getSideName,
    };
  },
});
</script>
