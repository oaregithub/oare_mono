<template>
  <v-progress-linear v-if="loading" indeterminate />
  <OareContentView v-else :title="collectionName">
    <template #header v-if="!hideDetails">
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
            class="test-search"
          />
        </v-col>
      </v-row>
      <v-btn v-if="canAddNewTexts" @click="addText" color="primary"
        >Add Text (BETA)</v-btn
      >
      <TextsTable
        :page="Number(page)"
        @update:page="page = `${$event}`"
        :rows="Number(rows)"
        @update:rows="rows = `${$event}`"
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
import { CollectionText } from '@oare/types';
import TextsTable from './TextsTable.vue';
import { getLetterGroup } from '../CollectionsView/utils';
import _ from 'underscore';
import useQueryParam from '@/hooks/useQueryParam';
import sl from '@/serviceLocator';

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
    hideDetails: {
      type: Boolean,
      default: false,
    },
  },

  setup({ collectionUuid }) {
    const server = sl.get('serverProxy');
    const actions = sl.get('globalActions');
    const router = sl.get('router');
    const store = sl.get('store');
    const permissions = computed(() => store.getters.permissions);
    const hasBetaAccess = computed(() =>
      store.getters.user ? store.getters.user.betaAccess : false
    );

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

    const page = useQueryParam('page', '1');
    const rows = useQueryParam('rows', '10');
    const search = useQueryParam('query', '');

    const addText = () => {
      router.push(`/add_collection_text/${collectionUuid}`);
    };

    const canAddNewTexts = computed(
      () =>
        permissions.value
          .map(permission => permission.name)
          .includes('ADD_NEW_TEXTS') && hasBetaAccess.value
    );

    const getCollectionTexts = async () => {
      if (textsLoading.value) {
        return;
      }
      textsLoading.value = true;
      try {
        const collectionResp = await server.getCollectionTexts(collectionUuid, {
          page: Number(page.value),
          limit: Number(rows.value),
          filter: search.value,
        });
        totalTexts.value = collectionResp.totalTexts;
        texts.value = collectionResp.texts;
      } catch (err) {
        if (err.response && err.response.status === 403) {
          router.replace({ name: '403' });
          return;
        }
        actions.showErrorSnackbar(
          'Error loading collection texts. Please try again.',
          err as Error
        );
      } finally {
        textsLoading.value = false;
      }
    };

    onMounted(async () => {
      loading.value = true;
      try {
        collectionName.value = (
          await server.getCollectionInfo(collectionUuid)
        ).name;
      } catch (err) {
        actions.showErrorSnackbar(
          'Error loading collection name. Please try again.',
          err as Error
        );
      } finally {
        loading.value = false;
      }
    });

    watch(
      [page, rows],
      () => {
        getCollectionTexts();
      },
      { immediate: true }
    );

    watch(
      search,
      _.debounce(function () {
        page.value = '1';
        getCollectionTexts();
      }, 500),
      {
        immediate: false,
      }
    );

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
      addText,
      canAddNewTexts,
    };
  },
});
</script>
