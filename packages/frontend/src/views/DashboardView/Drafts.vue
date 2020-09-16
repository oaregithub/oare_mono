<template>
  <OareContentView title="Drafts">
    <v-data-table :headers="headers" :items="drafts" :loading="draftsLoading">
      <template #item.textName="{ item }">
        <router-link
          :to="{
            name: 'epigraphies',
            params: { textUuid: item.textUuid },
            query: { editing: 1 },
          }"
          >{{ item.textName }}</router-link
        >
      </template>
      <template #item.updatedAt="{ item }">
        {{ dateFormat(item.updatedAt) }}
      </template>
    </v-data-table>
  </OareContentView>
</template>

<script lang="ts">
import { defineComponent, onMounted, ref, Ref } from '@vue/composition-api';
import server from '../../serverProxy';
import { TextDraft } from '../../types/textDrafts';
import moment from 'moment';

export default defineComponent({
  name: 'DashboardDrafts',

  setup() {
    const draftsLoading: Ref<boolean> = ref(false);
    const drafts: Ref<TextDraft[]> = ref([]);

    const dateFormat = (dateStr: string) => {
      return moment(dateStr).format('MMMM D, YYYY h:ma');
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
      drafts.value = await server.getDrafts();
      draftsLoading.value = false;
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
