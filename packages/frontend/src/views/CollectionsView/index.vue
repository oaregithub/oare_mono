<template>
  <OareContentView title="Texts" :loading="loading">
    <div class="fixed">
      <v-btn
        v-for="(lett, lettGroup) in letterGroups"
        class="mr-2 mb-2"
        :key="lettGroup"
        fab
        small
        color="primary"
        :to="`/collections/${encodedLetter(lettGroup)}`"
        >{{ lettGroup }}</v-btn
      >
    </div>
    <div v-for="collection in shownCollections" :key="collection.uuid">
      <router-link :to="`/collections/name/${collection.uuid}`"
        >{{ collection.name }}
      </router-link>
    </div>
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

export default defineComponent({
  name: "CollectionsView",
  props: {
    letter: {
      type: String,
      required: true,
    },
  },
  setup(props) {
    const loading = ref(false);
    const collections: Ref<CollectionListItem[]> = ref([]);

    const encodedLetter = (letter: string) => encodeURIComponent(letter);

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
      letterGroups,
      shownCollections,
      encodedLetter,
    };
  },
});
</script>

<style scoped></style>
