<template>
  <v-container>
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
      <v-col cols="10">
        <text-collection-list
          v-if="selectedType === 'text'"
          :key="selectedType"
          :groupId="groupId"
          itemType="Text"
          :getItems="server.getGroupAllowlistTexts"
          :removeItems="server.removeItemsFromGroupAllowlist"
        />
        <text-collection-list
          v-else-if="selectedType === 'collection'"
          :key="selectedType"
          :groupId="groupId"
          itemType="Collection"
          :getItems="server.getGroupAllowlistCollections"
          :removeItems="server.removeItemsFromGroupAllowlist"
        />
        <text-collection-list
          v-else-if="selectedType === 'image'"
          :key="selectedType"
          :groupId="groupId"
          itemType="Image"
          :getItems="server.getGroupAllowlistImages"
          :removeItems="server.removeItemsFromGroupAllowlist"
        />
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import { defineComponent, ref } from '@vue/composition-api';
import TextCollectionList from '@/views/Admin/components/TextCollectionList.vue';
import useQueryParam from '@/hooks/useQueryParam';
import sl from '@/serviceLocator';

export default defineComponent({
  components: {
    TextCollectionList,
  },
  props: {
    groupId: {
      type: String,
      required: true,
    },
  },
  setup() {
    const server = sl.get('serverProxy');
    const types = ref([
      { name: 'Texts', value: 'text' },
      { name: 'Collections', value: 'collection' },
      { name: 'Images', value: 'image' },
    ]);
    const selectedType = useQueryParam('type', 'text', true);

    return {
      server,
      types,
      selectedType,
    };
  },
});
</script>
