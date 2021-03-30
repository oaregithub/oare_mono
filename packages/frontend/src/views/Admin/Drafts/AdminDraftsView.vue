<template>
  <OareContentView title="Text Drafts">
    <v-data-table
      :loading="loading"
      :headers="headers"
      item-key="uuid"
      :items="items"
      :options.sync="sortOptions"
      :server-items-length="totalDrafts"
    >
      <template #[`item.text`]="{ item }">
        <router-link :to="`/epigraphies/${item.textUuid}`">{{
          item.textName
        }}</router-link>
      </template>
      <template #[`item.author`]="{ item }">
        {{ `${item.user.firstName} ${item.user.lastName}` }}
      </template>
      <template #[`item.updatedAt`]="{ item }">
        {{ formatTimestamp(item.updatedAt) }}
      </template>
      <template #[`item.content`]="{ item }">
        <v-btn
          plain
          text
          class="font-weight-bold ml-n3 test-view-content"
          color="primary"
          @click="openDialog(item)"
          >View content</v-btn
        >
      </template>
    </v-data-table>

    <OareDialog
      v-model="dialogOpen"
      title="Draft Content"
      :width="1000"
      class="test-content-dialog"
      :show-submit="false"
      :show-cancel="false"
      :close-button="true"
      :persistent="false"
    >
      <DraftContentPopup :draft="viewingDraft" />
    </OareDialog>
  </OareContentView>
</template>

<script lang="ts">
import { defineComponent, ref, computed, watch } from '@vue/composition-api';
import { TextDraftWithUser, GetDraftsSortType } from '@oare/types';
import sl from '@/serviceLocator';
import { DataTableHeader, DataOptions } from 'vuetify';
import { formatTimestamp } from '@/utils';
import useQueryParam from '@/hooks/useQueryParam';
import DraftContentPopup from './DraftContentPopup.vue';

export default defineComponent({
  name: 'AdminDraftsView',
  components: {
    DraftContentPopup,
  },
  setup() {
    const server = sl.get('serverProxy');
    const actions = sl.get('globalActions');
    const loading = ref(false);
    const drafts = ref<TextDraftWithUser[]>([]);
    const viewingDraft = ref<TextDraftWithUser | null>(null);
    const dialogOpen = ref(false);
    const totalDrafts = ref(0);

    const headers = ref<DataTableHeader[]>([
      { text: 'Text', value: 'text' },
      { text: 'Author', value: 'author' },
      { text: 'Last Updated', value: 'updatedAt' },
      { text: 'Content', value: 'content', sortable: false },
    ]);

    const [sortBy, setSortBy] = useQueryParam('sortBy', 'updatedAt');
    const [sortDesc, setSortDesc] = useQueryParam('sortDesc', 'true');
    const [page, setPage] = useQueryParam('page', '1');
    const [limit, setLimit] = useQueryParam('rows', '10');

    const sortOptions = ref<DataOptions>({
      page: Number(page.value),
      itemsPerPage: Number(limit.value),
      sortBy: [sortBy.value],
      sortDesc: [sortDesc.value === 'true'],
      groupBy: [],
      groupDesc: [],
      multiSort: false,
      mustSort: true,
    });

    const loadDrafts = async () => {
      try {
        loading.value = true;
        const draftData = await server.getAllDrafts({
          sortBy: sortBy.value as GetDraftsSortType,
          sortOrder: sortDesc.value === 'true' ? 'desc' : 'asc',
          page: Number(page.value),
          limit: Number(limit.value),
        });
        drafts.value = [...draftData.drafts];
        totalDrafts.value = draftData.totalDrafts;
      } catch {
        actions.showErrorSnackbar('Failed to retrieve user drafts');
      } finally {
        loading.value = false;
      }
    };

    watch(sortOptions, newOptions => {
      setSortBy(newOptions.sortBy[0]);
      setSortDesc(String(newOptions.sortDesc[0]));
      setPage(String(newOptions.page));
      setLimit(String(newOptions.itemsPerPage));
      loadDrafts();
    });

    const items = computed(() => (loading.value ? [] : drafts.value));

    const openDialog = (draft: TextDraftWithUser) => {
      viewingDraft.value = { ...draft };
      dialogOpen.value = true;
    };

    return {
      loading,
      items,
      headers,
      formatTimestamp,
      viewingDraft,
      dialogOpen,
      openDialog,
      sortOptions,
      totalDrafts,
    };
  },
});
</script>
