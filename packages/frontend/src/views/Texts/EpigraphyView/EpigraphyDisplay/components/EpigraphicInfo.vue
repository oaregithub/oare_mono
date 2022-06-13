<template>
  <div v-if="allowViewCitations">
    <div v-for="data in zoteroDataListTop" :key="data">
      <div>Citation: <a :href="data.link" v-html="data.citation"></a></div>
    </div>
    <div v-if="zoteroDataListBottom.length">See more...</div>
    <br />
  </div>
</template>

<script lang="ts">
import {
  defineComponent,
  ref,
  onMounted,
  computed,
} from '@vue/composition-api';
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
    const zoteroDataListTop = ref<ZoteroData[]>([]);
    const zoteroDataListBottom = ref<ZoteroData[]>([]);
    const store = sl.get('store');

    const allowViewCitations = computed(() =>
      store.hasPermission('VIEW_BIBLIOGRAPHY')
    );

    onMounted(async () => {
      try {
        const epigraphicInfo = await server.getEpigraphicInfo(textUuid);

        const zoteroDataList = epigraphicInfo.zoteroData;

        if (zoteroDataList.length > 2) {
          zoteroDataListTop.value = zoteroDataList.slice(0, 2);
          zoteroDataListBottom.value = zoteroDataList.slice(2);
        } else {
          zoteroDataListTop.value = zoteroDataList;
        }
      } catch (err) {
        actions.showErrorSnackbar(
          'Failed to retrieve citation. Please try again.',
          err as Error
        );
      }
    });
    return { zoteroDataListTop, zoteroDataListBottom, allowViewCitations };
  },
});
</script>
