<template>
  <OareContentView title="Drafts">
    <v-data-table :headers="headers" :items="drafts" :loading="draftsLoading">
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
  </OareContentView>
</template>

<script lang="ts">
import { defineComponent, onMounted, ref, Ref } from '@vue/composition-api';
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
    const draftsLoading: Ref<boolean> = ref(false);
    const drafts: Ref<TextDraft[]> = ref([]);
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
      } catch {
        actions.showErrorSnackbar('Error loading drafts. Please try again.');
      } finally {
        draftsLoading.value = false;
      }
    });

    const openDiffDialog = (draft: TextDraft) => {
      viewingDraft.value = { ...draft };
      diffDialog.value = true;
    };

    return {
      draftsLoading,
      drafts,
      dateFormat,
      headers,
      viewingDraft,
      diffDialog,
      openDiffDialog,
    };
  },
});
</script>

<style></style>
