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
            >Delete drafts</v-list-item-title
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
    </v-data-table>

    <OareDialog
      v-model="confirmDeleteDialog"
      title="Confirm Delete Drafts"
      cancelText="No, don't delete"
      submitText="Yes, delete"
      @submit="deleteDrafts"
      :submitLoading="deleteDraftsLoading"
    >
      Are you sure you want to delete your drafts on the following texts? All
      edits you have made will be discarded. This action is not reversible.
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

export default defineComponent({
  name: 'DashboardDrafts',

  setup() {
    const draftsLoading = ref(false);
    const drafts = ref<TextDraft[]>([]);
    const selectedDrafts = ref<TextDraft[]>([]);
    const confirmDeleteDialog = ref(false);
    const deleteDraftsLoading = ref(false);

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
      } catch {
        actions.showErrorSnackbar('Error loading drafts. Please try again.');
      } finally {
        draftsLoading.value = false;
      }
    });

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
      } catch {
        actions.showErrorSnackbar('Failed to delete drafts');
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
      selectedDrafts,
      confirmDeleteDialog,
      deleteDrafts,
      deleteDraftsLoading,
    };
  },
});
</script>

<style></style>
