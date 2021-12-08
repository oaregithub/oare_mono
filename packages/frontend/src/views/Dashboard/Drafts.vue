<template>
  <OareContentView title="Drafts">
    <v-menu>
      <template v-slot:activator="{ on }">
        <v-btn
          v-on="on"
          color="info"
          class="test-actions"
          :disabled="selectedDrafts.length < 1"
          >Actions</v-btn
        >
      </template>
      <v-list>
        <v-list-item @click="confirmDeleteDialog = true">
          <v-list-item-title class="test-delete-draft"
            >Delete draft(s)</v-list-item-title
          >
        </v-list-item>
      </v-list>
    </v-menu>
    <v-data-table
      :headers="headers"
      :items="drafts"
      :loading="draftsLoading"
      show-select
      item-key="uuid"
      v-model="selectedDrafts"
    >
      <template #[`item.textName`]="{ item }">
        <router-link
          :to="{
            name: 'epigraphyEditor',
            params: { textUuid: item.textUuid },
          }"
          >{{ item.textName }}</router-link
        >
      </template>
      <template #[`item.updatedAt`]="{ item }">
        {{ dateFormat(item.updatedAt) }}
      </template>
      <template #[`item.content`]="{ item }">
        <v-btn
          plain
          text
          class="font-weight-bold ml-n3 test-view-content"
          color="primary"
          @click="openDiffDialog(item)"
          >View content</v-btn
        >
      </template>
    </v-data-table>

    <draft-diff-popup
      class="test-content-dialog"
      v-if="viewingDraft"
      :viewingDraft="viewingDraft"
      v-model="diffDialog"
    />

    <OareDialog
      v-model="confirmDeleteDialog"
      title="Confirm Delete Drafts"
      cancelText="No, don't delete"
      submitText="Yes, delete"
      @submit="deleteDrafts"
      :submitLoading="deleteDraftsLoading"
    >
      Are you sure you want to delete your draft(s) on the following text(s)?
      All edits you have made will be discarded. This action is not reversible.
      <ul>
        <li v-for="draft in selectedDrafts" :key="draft.uuid">
          {{ draft.textName }}
        </li>
      </ul>
    </OareDialog>
  </OareContentView>
</template>

<script lang="ts">
import { defineComponent, onMounted, ref } from '@vue/composition-api';
import { TextDraft } from '@oare/types';
import moment from 'moment';
import sl from '@/serviceLocator';
import DraftDiffPopup from '@/views/Admin/Drafts/DraftDiffPopup.vue';

export default defineComponent({
  name: 'DashboardDrafts',
  components: {
    DraftDiffPopup,
  },
  setup() {
    const draftsLoading = ref(false);
    const drafts = ref<TextDraft[]>([]);
    const selectedDrafts = ref<TextDraft[]>([]);
    const confirmDeleteDialog = ref(false);
    const deleteDraftsLoading = ref(false);
    const viewingDraft = ref<TextDraft | null>(null);
    const diffDialog = ref(false);

    const actions = sl.get('globalActions');
    const server = sl.get('serverProxy');
    const store = sl.get('store');

    const dateFormat = (dateStr: string) => {
      return moment(dateStr).format('MMMM D, YYYY h:mm a');
    };

    const headers = [
      {
        text: 'Text',
        value: 'textName',
      },
      {
        text: 'Last Updated',
        value: 'updatedAt',
      },
      {
        text: 'Content',
        value: 'content',
      },
    ];

    onMounted(async () => {
      draftsLoading.value = true;
      try {
        const userUuid = store.getters.user ? store.getters.user.uuid : null;

        if (userUuid) {
          drafts.value = await server.getDrafts(userUuid);
        } else {
          actions.showErrorSnackbar('You are not logged in');
        }
      } catch (error) {
        actions.showErrorSnackbar('Error loading drafts. Please try again.'),
          error as Error;
      } finally {
        draftsLoading.value = false;
      }
    });

    const openDiffDialog = (draft: TextDraft) => {
      viewingDraft.value = { ...draft };
      diffDialog.value = true;
    };

    const deleteDrafts = async () => {
      try {
        deleteDraftsLoading.value = true;
        await Promise.all(
          selectedDrafts.value.map(({ uuid }) => server.deleteDraft(uuid))
        );

        drafts.value = [
          ...drafts.value.filter(
            ({ uuid }) =>
              !selectedDrafts.value.map(({ uuid }) => uuid).includes(uuid)
          ),
        ];
        selectedDrafts.value = [];
        actions.showSnackbar('Drafts successfully deleted');
      } catch (err) {
        actions.showErrorSnackbar('Failed to delete drafts'), err as Error;
      } finally {
        deleteDraftsLoading.value = false;
        confirmDeleteDialog.value = false;
      }
    };

    return {
      draftsLoading,
      drafts,
      dateFormat,
      headers,
      viewingDraft,
      diffDialog,
      openDiffDialog,
      selectedDrafts,
      confirmDeleteDialog,
      deleteDrafts,
      deleteDraftsLoading,
    };
  },
});
</script>

<style></style>
