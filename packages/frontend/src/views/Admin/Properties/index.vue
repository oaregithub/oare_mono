<template>
  <OareContentView title="Properties Taxonomy">
    <v-row class="ma-0">
      <v-col cols="4" class="pa-0">
        <v-text-field v-model="search" label="Search" hide-details clearable />
      </v-col>
    </v-row>
    <v-row class="ma-0 mb-6">
      <v-switch
        label="Show UUIDs"
        color="primary"
        v-model="showUuid"
        hide-details
      />
    </v-row>
    <properties-tree :showUuid="showUuid" :search="search" :readonly="true" />
  </OareContentView>
</template>

<script lang="ts">
import { defineComponent, ref } from '@vue/composition-api';
import PropertiesTree from './components/PropertiesTree.vue';

export default defineComponent({
  components: {
    PropertiesTree,
  },
  setup() {
    const showUuid = ref(false);

    const search = ref('');

    return {
      showUuid,
      search,
    };
  },
});
</script>
