<template>
  <OareContentView title="Texts" :loading="loading">
    <CollectionsList :collections="shownCollections" />
  </OareContentView>
</template>

<script lang="ts">
import {
  defineComponent,
  ref,
  Ref,
  onMounted,
  computed,
} from '@vue/composition-api';
import { Collection } from '@oare/types';
import { letterGroups } from './utils';
import CollectionsList from './CollectionsList.vue';
import sl from '@/serviceLocator';

export default defineComponent({
  name: 'CollectionsView',
  components: {
    CollectionsList,
  },
  props: {
    letter: {
      type: String,
      required: true,
    },
  },
  setup(props) {
    const loading = ref(false);
    const collections: Ref<Collection[]> = ref([]);
    const server = sl.get('serverProxy');
    const actions = sl.get('globalActions');

    const shownCollections = computed(() =>
      collections.value.filter(collection =>
        letterGroups[props.letter].includes(collection.name[0])
      )
    );

    onMounted(async () => {
      loading.value = true;
      try {
        collections.value = await server.getAllCollections();
      } catch {
        actions.showErrorSnackbar(
          'Error loading collections. Please try again.'
        );
      } finally {
        loading.value = false;
      }
    });

    return {
      loading,
      shownCollections,
    };
  },
});
</script>
