<template>
  <OareContentView title="Onomasticon" :loading="loading">
    <NamesPlacesDisplay :wordList="names" :letter="letter" route="names" />
  </OareContentView>
</template>

<script lang="ts">
import { defineComponent, ref, Ref, onMounted } from "@vue/composition-api";
import { AkkadianLetterGroupsUpper } from "oare";
import server from "../../serverProxy";
import { NamesOrPlaces } from "../../types/names";
import NamesPlacesDisplay from "@/components/NamesPlacesDisplay/index.vue";

export default defineComponent({
  name: "NamesView",
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
    const names: Ref<NamesOrPlaces[]> = ref([]);
    const loading = ref(false);

    onMounted(async () => {
      loading.value = true;
      names.value = await server.getNames();
      loading.value = false;
    });

    return {
      names,
      loading,
    };
  },
});
</script>

<style></style>
