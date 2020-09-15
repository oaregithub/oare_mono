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
} from "@vue/composition-api";
import { CollectionListItem } from "@/types/collections";
import server from "@/serverProxy";
import { letterGroups } from "./utils";
import CollectionsList from "./CollectionsList.vue";

export default defineComponent({
  name: "CollectionsView",
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
    const collections: Ref<CollectionListItem[]> = ref([]);

    const shownCollections = computed(() =>
      collections.value.filter((collection) =>
        letterGroups[props.letter].includes(collection.name[0])
      )
    );

    onMounted(async () => {
      loading.value = true;
      collections.value = await server.getAllCollections();
      loading.value = false;
    });

    return {
      loading,
      shownCollections,
    };
  },
});
</script>
