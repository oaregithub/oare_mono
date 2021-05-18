<template>
  <OareContentView title="Gazetteer" :loading="loading">
    <NamesPlacesDisplay :wordList="places" :letter="letter" route="places">
      {{ '' }}
    </NamesPlacesDisplay>
  </OareContentView>
</template>

<script lang="ts">
import { defineComponent, ref, Ref, watch } from '@vue/composition-api';
import NamesPlacesDisplay from '@/components/NamesPlacesDisplay/index.vue';
import { DictionaryWordResponse } from '@oare/types';
import sl from '@/serviceLocator';

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
    const places: Ref<DictionaryWordResponse[]> = ref([]);
    const loading = ref(false);

    const server = sl.get('serverProxy');
    const actions = sl.get('globalActions');

    watch(
      () => props.letter,
      async () => {
        loading.value = true;
        try {
          places.value = await server.getPlaces(props.letter);
        } catch {
          actions.showErrorSnackbar('Failed to retrieve place words');
        } finally {
          loading.value = false;
        }
      },
      { immediate: true }
    );

    return {
      places,
      loading,
    };
  },
});
</script>
