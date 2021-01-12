<template>
  <OareContentView title="Onomasticon" :loading="loading">
    <NamesPlacesDisplay :wordList="names" :letter="letter" route="names" />
  </OareContentView>
</template>

<script lang="ts">
import {
  defineComponent,
  ref,
  Ref,
  PropType,
  watch,
} from '@vue/composition-api';
import { NameOrPlace } from '@oare/types';
import NamesPlacesDisplay from '@/components/NamesPlacesDisplay/index.vue';
import defaultActions from '@/globalActions';
import defaultServer from '@/serverProxy';

export default defineComponent({
  name: 'NamesView',
  props: {
    server: {
      type: Object as PropType<typeof defaultServer>,
      default: () => defaultServer,
    },
    actions: {
      type: Object as PropType<typeof defaultActions>,
      default: () => defaultActions,
    },
    letter: {
      type: String,
      required: true,
    },
  },
  components: {
    NamesPlacesDisplay,
  },
  setup(props) {
    const names: Ref<NameOrPlace[]> = ref([]);
    const loading = ref(false);

    watch(
      () => props.letter,
      async () => {
        loading.value = true;
        try {
          names.value = await props.server.getPlaces(props.letter);
        } catch {
          props.actions.showErrorSnackbar('Failed to retrieve name words');
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
