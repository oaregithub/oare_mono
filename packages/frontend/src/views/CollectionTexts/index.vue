<template>
  <v-progress-linear v-if="loading" indeterminate />
  <OareContentView v-else :title="collectionName">
    <template #header>
      <OareBreadcrumbs :items="breadcrumbItems" />
    </template>
    <v-spacer />
    <v-container>
      <v-row>
        <v-col cols="4" offset="8">
          <v-text-field
            :value="search"
            @input="(s) => setSearch(s || '')"
            label="Search"
            single-line
            hide-details
            clearable
            class="test-search"
          />
        </v-col>
      </v-row>
      <TextsTable
        :page="Number(page)"
        @update:page="(p) => setPage(String(p))"
        :rows="Number(rows)"
        @update:rows="(r) => setRows(String(r))"
        :totalTexts="totalTexts"
        :texts="texts"
        :loading="textsLoading"
      />
    </v-container>
  </OareContentView>
</template>

<script lang="ts">
import {
  defineComponent,
  ref,
  watch,
  Ref,
  computed,
  onMounted,
  PropType,
} from '@vue/composition-api';
import Router from 'vue-router';
import { CollectionResponse, CollectionText } from '@/types/collections';
import { BreadcrumbItem } from '@/components/base/OareBreadcrumbs.vue';
import TextsTable from './TextsTable.vue';
import { getLetterGroup } from '../CollectionsView/utils';
import _ from 'underscore';
import defaultRouter from '@/router';
import defaultServerProxy from '@/serverProxy';
import useQueryParam from '@/hooks/useQueryParam';

export default defineComponent({
  name: 'CollectionTexts',
  components: {
    TextsTable,
  },
  props: {
    collectionUuid: {
      type: String,
      required: true,
    },
    router: {
      type: Object as PropType<Router>,
      default: () => defaultRouter,
    },
    serverProxy: {
      type: Object as PropType<typeof defaultServerProxy>,
      default: () => defaultServerProxy,
    },
    // useQueryParam: {
    //   type: Function as PropType<typeof useQueryParamDefault>,
    //   default: () => useQueryParamDefault,
    // },
  },

  setup(props, context) {
    const collectionName = ref('');
    const loading = ref(false);
    const letterGroup = computed(() =>
      collectionName.value ? getLetterGroup(collectionName.value) : ''
    );
    const breadcrumbItems = computed(() => [
      {
        link: '/collections/A-J',
        text: 'Texts',
      },
      {
        link: `/collections/${letterGroup.value}`,
        text: letterGroup.value,
      },
    ]);
    const texts: Ref<CollectionText[]> = ref([]);
    const textsLoading = ref(false);
    const totalTexts = ref(0);
    const [page, setPage] = useQueryParam('page', '1');
    const [rows, setRows] = useQueryParam('rows', '10');
    const [search, setSearch] = useQueryParam('query', '');

    const getCollectionTexts = async () => {
      if (textsLoading.value) {
        return;
      }
      textsLoading.value = true;
      try {
        const collectionResp = await props.serverProxy.getCollectionTexts(
          props.collectionUuid,
          {
            page: Number(page.value),
            rows: Number(rows.value),
            query: search.value,
          }
        );
        totalTexts.value = collectionResp.totalTexts;
        texts.value = collectionResp.texts;
      } catch (err) {
        if (err.response && err.response.status === 403) {
          props.router.replace({ name: '403' });
        }
      } finally {
        textsLoading.value = false;
      }
    };

    onMounted(async () => {
      loading.value = true;
      collectionName.value = (
        await props.serverProxy.getCollectionInfo(props.collectionUuid)
      ).name;
      loading.value = false;
    });

    watch([page, rows], () => {
      getCollectionTexts();
    });

    watch(
      search,
      _.debounce(function () {
        setPage('1');
        getCollectionTexts();
      }, 500),
      {
        lazy: true,
      }
    );

    return {
      collectionName,
      loading,
      texts,
      textsLoading,
      totalTexts,
      search,
      setSearch,
      breadcrumbItems,
      page,
      setPage,
      rows,
      setRows,
    };
  },
});
</script>
