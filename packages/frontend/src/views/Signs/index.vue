<template>
  <oare-content-view title="Sign List">
    <v-row>
      <v-col cols="9">
        <v-data-table
          :headers="tableHeaders"
          :items="filteredItems"
          :loading="loading"
          :server-items-length="items.length"
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
          <v-text-field
            v-model="search"
            label="Search"
            single-line
            hide-details
            clearable
            @click:clear="filteredItems = items"
            class="test-search pb-1"
          />
          <v-radio-group v-model="sortBy" hide-details class="pb-3">
            <template #label>
              <span class="font-weight-bold">Sort By</span>
            </template>
            <v-radio
              v-for="(val, index) in sortByOptions"
              :key="index"
              :value="val.toLowerCase()"
              :label="val"
              :class="`test-radio-${val} pr-2`"
            ></v-radio>
          </v-radio-group>
          <v-btn
            v-if="allSigns === 'false'"
            @click="allSigns = 'true'"
            class="test-all-signs"
            >Show all signs</v-btn
          >
          <v-btn v-else @click="allSigns = 'false'" class="test-only-oa"
            >Show only OA</v-btn
          >
          <v-menu offset-y open-on-hover class="pl-3">
            <template #activator="{ on, attrs }">
              <v-icon v-bind="attrs" v-on="on" class="mb-1 ml-1">
                mdi-information-outline
              </v-icon>
            </template>
            <v-card class="pa-3">
              As a default, only Old Assyrian (OA) signs and readings will be
              displayed on this page. To view all signs, click 'SHOW ALL SIGNS'.
            </v-card>
          </v-menu>
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
import { Sign } from '@oare/types';
import _ from 'lodash';

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
    const sortBy = ref('name');
    const allSigns = ref('false');
    const search = ref('');
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

    const items: Ref<Sign[]> = ref([]);
    const filteredItems: Ref<Sign[]> = ref([]);

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
      filteredItems.value = [];
      try {
        items.value = await server.getAllSigns();
      } catch (err) {
        actions.showErrorSnackbar(
          'Error sorting signs. Please try again.',
          err as Error
        );
      } finally {
        loading.value = false;
      }
    };

    watch([sortBy, allSigns], getSigns);

    onMounted(async () => {
      await getSigns();
    });
    return {
      tableHeaders,
      filteredItems,
      items,
      loading,
      search,
      sortBy,
      sortByOptions,
      allSigns,
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
