<template>
  <OareContentView title="Text Drafts">
    <v-data-table
      :loading="loading"
      :headers="headers"
      item-key="uuid"
      :items="drafts"
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
import { defineComponent, ref, onMounted } from '@vue/composition-api';
import { TextDraftWithUser } from '@oare/types';
import sl from '@/serviceLocator';
import { DataTableHeader } from 'vuetify';
import { DateTime } from 'luxon';
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

    const headers = ref<DataTableHeader[]>([
      { text: 'Text', value: 'text' },
      { text: 'Author', value: 'author' },
      { text: 'Last Updated', value: 'updatedAt' },
      { text: 'Content', value: 'content' },
    ]);

    onMounted(async () => {
      try {
        loading.value = true;
        const allDrafts = await server.getAllDrafts();
        drafts.value = [...allDrafts];
      } catch {
        actions.showErrorSnackbar('Failed to retrieve user drafts');
      } finally {
        loading.value = false;
      }
    });

    const formatTimestamp = (timestamp: Date) => {
      return DateTime.fromJSDate(new Date(timestamp)).toLocaleString(
        DateTime.DATETIME_MED
      );
    };

    const openDialog = (draft: TextDraftWithUser) => {
      viewingDraft.value = { ...draft };
      dialogOpen.value = true;
    };

    return {
      loading,
      drafts,
      headers,
      formatTimestamp,
      viewingDraft,
      dialogOpen,
      openDialog,
    };
  },
});
</script>
