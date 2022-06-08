<template>
  <div>
    <div v-for="data in zoteroDataList" :key="data">
      <div>Citation: <span v-html="data.citation"></span></div>
      <div>Link: <a :href="data.link" v-html="data.link"></a></div>
    </div>
    <br />
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from '@vue/composition-api';
import sl from '@/serviceLocator';
import { ZoteroData } from '@oare/types';

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
    const zoteroDataList = ref<ZoteroData[]>([]);

    onMounted(async () => {
      try {
        const epigraphicInfo = await server.getEpigraphicInfo(textUuid);

        zoteroDataList.value = epigraphicInfo.zoteroData;
      } catch (err) {
        actions.showErrorSnackbar(
          'Failed to retrieve citation. Please try again.',
          err as Error
        );
      }
    });
    return { zoteroDataList };
  },
});
</script>
