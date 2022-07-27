<template>
  <OareContentView title="Bibliography">
    <div class="title font-weight-regular">
      <v-row>
        <v-col cols="2">
          <v-radio-group v-model="selectedType">
            <v-radio
              v-for="(type, idx) in types"
              :key="idx"
              :label="type.name"
              :value="type.value"
              class="test-radio-btn"
            ></v-radio>
          </v-radio-group>
        </v-col>
        <v-data-table :header="itemsHeaders" :items="bibliographyResponse" />
      </v-row>
    </div>
  </OareContentView>
</template>

<script lang="ts">
import { defineComponent, onMounted, ref, Ref } from '@vue/composition-api';
import PageContent from '@/components/base/OarePageContent.vue';
import TextCollectionList from '@/views/Admin/components/TextCollectionList.vue';
import useQueryParam from '@/hooks/useQueryParam';
import sl from '@/serviceLocator';
import { BibliographyResponse } from '@oare/types';
import { DataTableHeader } from 'vuetify';

export default defineComponent({
  components: {
    TextCollectionList,
    PageContent,
  },
  setup() {
    const server = sl.get('serverProxy');
    const types = ref([
      { name: 'Chicago Author Date', value: 'chicago-author-date' },
      { name: 'Chicago Note Bibliography', value: 'chicago-note-bibliography' },
    ]);
    const selectedType = useQueryParam('type', 'chicago-author-date', true);

    const itemsHeaders: Ref<DataTableHeader[]> = ref([
      { text: 'Bib', value: 'bib' },
    ]);
    const bibliographyResponse = ref<BibliographyResponse[]>([]);

    onMounted(async () => {
      bibliographyResponse.value = await server.getBibliographies({
        citationStyle: selectedType.value,
        page: 1,
        limit: 25,
      });
      console.log(bibliographyResponse.value);
    });

    return {
      server,
      types,
      selectedType,
      itemsHeaders,
      bibliographyResponse,
    };
  },
});
</script>
