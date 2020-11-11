<template>
  <OareContentView title="Drafts">
    <v-data-table :headers="headers" :items="drafts" :loading="draftsLoading">
      <template #[`item.textName`]="{ item }">
        <router-link
          :to="{
            name: 'epigraphies',
            params: { textUuid: item.textUuid },
          }"
          >{{ item.textName }}</router-link
        >
      </template>
      <template #[`item.updatedAt`]="{ item }">
        {{ dateFormat(item.updatedAt) }}
      </template>
    </v-data-table>
  </OareContentView>
</template>

<script lang="ts">
import { defineComponent, onMounted, ref, Ref } from '@vue/composition-api';
import { TextDraft } from '@oare/types';
import moment from 'moment';
import sl from '@/serviceLocator';

export default defineComponent({
  name: 'DashboardDrafts',

  setup() {
    const draftsLoading: Ref<boolean> = ref(false);
    const drafts: Ref<TextDraft[]> = ref([]);
    const actions = sl.get('globalActions');
    const server = sl.get('serverProxy');

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
        drafts.value = await server.getDrafts();
      } catch {
        actions.showErrorSnackbar('Error loading drafts. Please try again.');
      } finally {
        draftsLoading.value = false;
      }
    });

    return {
      draftsLoading,
      drafts,
      dateFormat,
      headers,
    };
  },
});
</script>

<style></style>
