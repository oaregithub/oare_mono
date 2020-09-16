<template>
  <OareContentView title="Gazetteer" :loading="loading">
    <NamesPlacesDisplay
      :wordList="places"
      :letter="letter"
      route="places"
      v-slot:translation
    >
      {{ '' }}
    </NamesPlacesDisplay>
  </OareContentView>
</template>

<script lang="ts">
import { defineComponent, onMounted, ref, Ref } from '@vue/composition-api';
import NamesPlacesDisplay from '@/components/NamesPlacesDisplay/index.vue';
import { NamesOrPlaces } from '@/types/names';
import server from '../../serverProxy';

export default defineComponent({
  name: 'PlacesView',
  components: {
    NamesPlacesDisplay,
  },
  props: {
    letter: {
      type: String,
      required: true,
    },
  },
  setup(props) {
    const places: Ref<NamesOrPlaces[]> = ref([]);
    const loading = ref(false);

    onMounted(async () => {
      loading.value = true;
      places.value = await server.getPlaces();
      loading.value = false;
    });

    return {
      places,
      loading,
    };
  },
});
</script>

<style></style>
