<template>
  <oare-content-view title="Sign List">
    <v-data-table
      :headers="tableHeaders"
      :items="items"
      :server-items-length="items.length"
      :sort-by="'name'"
      :loading="loading"
      hide-default-footer
    >
      <template #[`item.code`]="{ item }">
        <v-img
          v-if="item.hasPng === 1"
          :src="
            require(`@oare/frontend/src/assets/signVectors/${item.mzl}.png`)
          "
          height="25px"
          :width="
            getWidth(
              require(`@oare/frontend/src/assets/signVectors/${item.mzl}.png`)
            ) || 30
          "
          contain
          class="d-inline-block"
        />
        <span v-else-if="item.fontCode" class="my-n1 mx-1 cuneiform">{{
          getSignHTMLCode(item.fontCode)
        }}</span>
        <v-icon v-else-if="!item.fontCode" small color="red" class="ma-1"
          >mdi-block-helper</v-icon
        >
      </template>
      <template #[`item.readings`]="{ item }">
        <span v-html="item.readings"></span>
      </template>
    </v-data-table>
  </oare-content-view>
</template>
<script lang="ts">
import { defineComponent, ref, Ref, onMounted } from '@vue/composition-api';
import { DataOptions, DataTableHeader } from 'vuetify';
import sl from '@/serviceLocator';
import OareContentView from '@/components/base/OareContentView.vue';
import { SignList } from '@oare/types';

export interface OareDataTableOptions {
  page: number;
  rows: number;
  sortBy: string;
  sortDesc: boolean;
}

export default defineComponent({
  components: { OareContentView },
  name: 'SignListView',
  props: {},
  setup() {
    const server = sl.get('serverProxy');
    const actions = sl.get('globalActions');
    const loading = ref(false);
    const tableHeaders: Ref<DataTableHeader[]> = ref([
      { text: 'Sign', value: 'code', width: '16%', sortable: false },
      {
        text: 'Name',
        value: 'name',
        width: '16%',
        sortable: false,
      },
      {
        text: 'ABZ',
        value: 'abz',
        width: '8%',
        sortable: false,
      },
      {
        text: 'MZL',
        value: 'mzl',
        width: '8%',
        sortable: false,
      },
      {
        text: 'Frequency',
        value: 'frequency',
        width: '16%',
        sortable: false,
      },
      { text: 'Readings', value: 'readings', width: '32%', sortable: false },
    ]);

    const items: Ref<SignList[]> = ref([]);

    const getWidth = (src: string) => {
      const image = new Image();
      image.src = src;
      const heightRatio = 25 / image.height;
      return heightRatio * image.width;
    };

    const getSignHTMLCode = (code: string) => {
      let codePt = Number(`0x${code}`);
      if (codePt > 0xffff) {
        codePt -= 0x10000;
        return String.fromCharCode(
          0xd800 + (codePt >> 10),
          0xdc00 + (codePt & 0x3ff)
        );
      } else {
        return String.fromCharCode(codePt);
      }
    };

    onMounted(async () => {
      loading.value = true;
      try {
        const response = await server.getSignList();
        items.value = response.result;
      } catch (err) {
        actions.showErrorSnackbar(
          'Error loading collection texts. Please try again.',
          err as Error
        );
      } finally {
        loading.value = false;
      }
    });
    return {
      tableHeaders,
      items,
      loading,
      getWidth,
      getSignHTMLCode,
    };
  },
});
</script>
