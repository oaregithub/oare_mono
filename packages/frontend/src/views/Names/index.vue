<template>
  <OareContentView title="Onomasticon" :loading="loading">
    <NamesPlacesDisplay :wordList="names" :letter="letter" route="names" />
  </OareContentView>
</template>

<script lang="ts">
import { defineComponent, ref, Ref, watch } from '@vue/composition-api';
import { Word } from '@oare/types';
import NamesPlacesDisplay from '@/components/NamesPlacesDisplay/index.vue';
import sl from '@/serviceLocator';

export default defineComponent({
  name: 'NamesView',
  props: {
    letter: {
      type: String,
      required: true,
    },
  },
  components: {
    NamesPlacesDisplay,
  },
  setup(props) {
    const names: Ref<Word[]> = ref([]);
    const loading = ref(false);
    const server = sl.get('serverProxy');
    const actions = sl.get('globalActions');

    watch(
      () => props.letter,
      async () => {
        loading.value = true;
        try {
          names.value = await server.getNames(props.letter);
        } catch {
          actions.showErrorSnackbar('Failed to retrieve name words');
        } finally {
          loading.value = false;
        }
      },
      { immediate: true }
    );

    return {
      names,
      loading,
    };
  },
});
</script>

<style></style>
