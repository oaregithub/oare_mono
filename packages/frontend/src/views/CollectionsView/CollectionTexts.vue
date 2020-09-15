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
            v-model="search"
            label="Search"
            single-line
            hide-details
            clearable
          />
        </v-col>
      </v-row>
      <TextsTable
        :page.sync="page"
        :rows.sync="rows"
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
} from '@vue/composition-api';
import { CollectionResponse, CollectionText } from '@/types/collections';
import { BreadcrumbItem } from '@/components/base/OareBreadcrumbs.vue';
import TextsTable from './TextsTable.vue';
import { getLetterGroup } from './utils';
import _ from 'underscore';
import router from '@/router';
import serverProxy from '@/serverProxy';

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
    const search = ref('');
    const page = ref(1);
    const rows = ref(10);

    const updateUrl = () => {
      let query: { page: string; rows: string; query?: string } = {
        page: String(page.value),
        rows: String(rows.value),
      };

      if (search.value !== '') {
        query.query = search.value;
      }

      if (router.currentRoute.name === 'collectionTexts') {
        router.replace({
          name: 'collectionTexts',
          params: {
            collectionUuid: props.collectionUuid,
          },
          query,
        });
      }
    };

    const getCollectionTexts = async () => {
      if (textsLoading.value) {
        return;
      }
      textsLoading.value = true;
      try {
        const collectionResp = await serverProxy.getCollectionTexts(
          props.collectionUuid,
          {
            page: page.value,
            rows: rows.value,
            query: search.value,
          }
        );
        totalTexts.value = collectionResp.totalTexts;
        texts.value = collectionResp.texts;
      } catch (err) {
        if (err.response && err.response.status === 403) {
          router.replace({ name: '403' });
        }
      } finally {
        textsLoading.value = false;
      }
    };

    watch(
      () => context.root.$route,
      () => {
        if (context.root.$route.name === 'collectionTexts') {
          getCollectionTexts();
        }
      }
    );

    onMounted(async () => {
      const {
        root: { $route },
      } = context;
      if ($route.query.page) {
        page.value = Number($route.query.page);
      } else {
        page.value = 1;
      }

      if ($route.query.rows) {
        rows.value = Number($route.query.rows);
      }

      if ($route.query.query) {
        search.value = String($route.query.query);
      } else {
        search.value = '';
      }

      loading.value = true;
      collectionName.value = (
        await serverProxy.getCollectionInfo(props.collectionUuid)
      ).name;
      loading.value = false;
    });

    watch(
      search,
      _.debounce(function() {
        page.value = 1;
        updateUrl();
      }, 500)
    );

    watch(page, () => {
      updateUrl();
    });

    watch(rows, () => {
      updateUrl();
    });

    return {
      collectionName,
      loading,
      texts,
      textsLoading,
      totalTexts,
      search,
      breadcrumbItems,
      page,
      rows,
    };
  },
});
</script>
