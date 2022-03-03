<template>
  <div>
    <h1>TEXT SOURCE</h1>
    <div v-for="link in linksList">
      <span v-html="readTextFile(link)"></span>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, PropType, computed } from '@vue/composition-api';
import sl from '@/serviceLocator';

export default defineComponent({
  props: {
    textUuid: {
      type: String,
      required: true,
    },
  },
  setup({ textUuid }) {
    const server = sl.get('serverProxy');
    const actions = sl.get('globalActions');
    const linksList = ref([]);
    const linksText = ref([]);
    const reader = new FileReader();

    onMounted(async () => {
      try {
        linksList.value = await server.getTextLinksByTextUuid(textUuid);
      } catch (err) {
        actions.showErrorSnackbar('Failed to get text data', err as Error);
      }
    });

    const readTextFile = (link: string) => {
      /*
      try {
        linksText.value += await server.getTextLinksByTextUuid(textUuid);
      } catch (err) {
        actions.showErrorSnackbar('Failed to read text', err as Error);
      }
      */
      //const response = server.getTextFileByLink(link);
      //console.log(response);
      return link;
    };

    return {
        linksList,
        readTextFile,
    };
  },
});
</script>
