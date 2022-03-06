<template>
  <div>
    <br>
    <h2>TEXT SOURCE</h2>
    <br>
    <span>{{fileText}}</span>
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
    const fileLink = ref('');
    const fileText = ref('');
    const reader = new FileReader();

    onMounted(async () => {
      try {
        fileLink.value = (await server.getTextLinkByTextUuid(textUuid))[0];
        console.log(fileLink.value);
      } catch (err) {
        actions.showErrorSnackbar('Failed to get text link', err as Error);
      }
      try {
        const url = new URL(fileLink.value);
        fileText.value = await server.getTextFileByLink(fileLink.value);
      } catch (err) {
        actions.showErrorSnackbar('Failed to get text contents', err as Error);
      }
    });

    /*
    const readTextFile = async (link: string) => {
      try {
        //linksText.value += await server.getTextLinkByTextUuid(textUuid);
        //const response = await server.getTextFileByLink(textUuid);
        //console.log(response);
      } catch (err) {
        actions.showErrorSnackbar('Failed to read text', err as Error);
      }
      //const response = server.getTextFileByLink(link);
      //console.log(response);
      return link;
    };
    */

    return {
        fileLink,
        fileText,
    };
  },
});
</script>
