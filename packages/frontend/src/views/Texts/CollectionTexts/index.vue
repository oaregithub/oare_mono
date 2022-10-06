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
        :texts="visibleTexts"
        :loading="textsLoading"
        :collectionUuid="collectionUuid"
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
    const visibleTexts: Ref<CollectionText[]> = ref([]);
    const textsLoading = ref(false);

    const search = useQueryParam('query', '', true);

    const addText = () => {
      router.push(`/add_collection_text/${collectionUuid}`);
    };

    const canAddNewTexts = computed(
      () => store.hasPermission('ADD_NEW_TEXTS') && hasBetaAccess.value
    );

    const getCollectionTexts = async () => {
      if (textsLoading.value) {
        return;
      }
      textsLoading.value = true;
      try {
        const collectionResp = await server.getCollectionTexts(collectionUuid);
        texts.value = collectionResp.texts;
        filterTexts();
      } catch (err) {
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
        await getCollectionTexts();
      } catch (err) {
        actions.showErrorSnackbar(
          'Error loading collection texts. Please try again.',
          err as Error
        );
      } finally {
        loading.value = false;
      }
    });

    const filterTexts = () => {
      visibleTexts.value = texts.value.filter(text => {
        return (
          text.name.toLowerCase().includes(search.value.toLowerCase()) ||
          `${text.excavationPrefix || ''} ${text.excavationNumber || ''}`
            .toLowerCase()
            .includes(search.value.toLowerCase()) ||
          `${text.museumPrefix || ''} ${text.museumNumber || ''}`
            .toLowerCase()
            .includes(search.value.toLowerCase()) ||
          `${text.publicationNumber || ''} ${text.publicationNumber || ''}`
            .toLowerCase()
            .includes(search.value.toLowerCase())
        );
      });
    };

    watch(search, _.debounce(filterTexts, 100), {
      immediate: false,
    });

    return {
      collectionName,
      loading,
      texts,
      textsLoading,
      search,
      breadcrumbItems,
      addText,
      canAddNewTexts,
      visibleTexts,
    };
  },
});
</script>
