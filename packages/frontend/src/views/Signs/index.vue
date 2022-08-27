<template>
  <oare-content-view title="Sign List">
    <v-row>
      <v-col cols="9">
        <v-data-table
          :headers="tableHeaders"
          :items="items"
          :server-items-length="items.length"
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
      </v-col>
      <v-col>
        <div class="sticky">
          <h3>Sort By</h3>
          <v-checkbox
            v-for="(val, index) in sortByOptions"
            :key="index"
            v-model="sortBy"
            :value="val.toLowerCase()"
            :label="val"
            :class="`test-checkbox-${val} pr-2`"
          ></v-checkbox>
        </div>
      </v-col>
    </v-row>
  </oare-content-view>
</template>
<script lang="ts">
import {
  defineComponent,
  ref,
  Ref,
  onMounted,
  watch,
} from '@vue/composition-api';
import { DataTableHeader } from 'vuetify';
import sl from '@/serviceLocator';
import OareContentView from '@/components/base/OareContentView.vue';
import { SignList } from '@oare/types';
import useQueryParam from '@/hooks/useQueryParam';

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
    const sortByOptions = ['Name', 'ABZ', 'MZL', 'Frequency'];
    const sortBy = useQueryParam('sortBy', 'name', true);
    const tableHeaders: Ref<DataTableHeader[]> = ref([
      {
        text: 'Sign',
        value: 'code',
        width: '16%',
        sortable: false,
      },
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
      {
        text: 'Readings',
        value: 'readings',
        width: '32%',
        sortable: false,
      },
    ]);

    const items: Ref<SignList[]> = ref([]);

    const getWidth = (src: string) => {
      const image = new Image();
      image.src = src;
      const heightRatio = 25 / image.height;
      return heightRatio * image.width;
    };

    const getSignHTMLCode = (code: string) => {
      const codeArray: string[] = code.split('+');
      let finishedCodeArray: string[] = [];
      codeArray.forEach(c => {
        let codePt = Number(`0x${c}`);
        if (codePt > 0xffff) {
          codePt -= 0x10000;
          finishedCodeArray.push(
            String.fromCharCode(
              0xd800 + (codePt >> 10),
              0xdc00 + (codePt & 0x3ff)
            )
          );
        } else {
          finishedCodeArray.push(String.fromCharCode(codePt));
        }
      });
      return finishedCodeArray.join('');
    };

    const getSigns = async () => {
      loading.value = true;
      items.value = [];
      try {
        const response = await server.getSignList(sortBy.value);
        items.value = response.result;
      } catch (err) {
        actions.showErrorSnackbar(
          'Error sorting signs. Please try again.',
          err as Error
        );
      } finally {
        loading.value = false;
      }
    };

    watch(sortBy, getSigns);

    onMounted(async () => {
      await getSigns();
    });
    return {
      tableHeaders,
      items,
      loading,
      sortBy,
      sortByOptions,
      getWidth,
      getSignHTMLCode,
    };
  },
});
</script>
<style scoped>
.sticky {
  position: sticky;
  top: 1.3in;
}
.cuneiform {
  font-family: 'Santakku', 'CuneiformComposite';
}
</style>
