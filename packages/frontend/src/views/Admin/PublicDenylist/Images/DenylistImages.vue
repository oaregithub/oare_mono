<template>
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
    <text-collection-list
      itemType="Image"
      :page="Number(page)"
      @update:page="page = `${$event}`"
      :rows="Number(rows)"
      @update:rows="rows = `${$event}`"
      :search="search"
      :getItems="server.getDenylistImages"
      :removeItems="server.removeItemsFromPublicDenylist"
    />
  </v-container>
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api';
import sl from '@/serviceLocator';
import TextCollectionList from '../../components/TextCollectionList.vue';
import useQueryParam from '@/hooks/useQueryParam';

export default defineComponent({
  components: { TextCollectionList },
  setup() {
    const server = sl.get('serverProxy');
    const page = useQueryParam('page', '1', false);
    const rows = useQueryParam('rows', '10', true);
    const search = useQueryParam('query', '', true);

    return {
      page,
      rows,
      search,
      server,
    };
  },
});
</script>
