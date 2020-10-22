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
  onMounted,
  PropType,
} from '@vue/composition-api';
import { AkkadianLetterGroupsUpper } from '@oare/oare';
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
  setup({ actions, server }) {
    const names: Ref<NameOrPlace[]> = ref([]);
    const loading = ref(false);

    onMounted(async () => {
      loading.value = true;
      try {
        names.value = await server.getNames();
      } catch {
        actions.showErrorSnackbar('Failed to retrieve names');
      } finally {
        loading.value = false;
      }
    });

    return {
      names,
      loading,
    };
  },
});
</script>

<style></style>
