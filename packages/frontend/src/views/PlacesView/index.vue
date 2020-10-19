<template>
  <OareContentView title="Gazetteer" :loading="loading">
    <NamesPlacesDisplay :wordList="places" :letter="letter" route="places">
      {{ '' }}
    </NamesPlacesDisplay>
  </OareContentView>
</template>

<script lang="ts">
import { defineComponent, onMounted, ref, Ref } from '@vue/composition-api';
import NamesPlacesDisplay from '@/components/NamesPlacesDisplay/index.vue';
import { NameOrPlace } from '@oare/types';
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
    const places: Ref<NameOrPlace[]> = ref([]);
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
