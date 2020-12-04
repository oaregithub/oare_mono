<template>
  <v-progress-linear v-if="loading" indeterminate />
  <div v-else>
    <div style="display: flex">
      <router-link to="/addblacklisttext">
        <v-btn color="primary" class="mr-3 test-add">
          <span> <v-icon>mdi-plus</v-icon>Add Texts</span>
        </v-btn>
      </router-link>

      <v-menu>
        <template v-slot:activator="{ on }">
          <v-btn
            v-on="on"
            color="info"
            class="ml-3 test-actions"
            :disabled="selectedTexts.length < 1"
            data-actions-btn
            >Actions</v-btn
          >
        </template>
        <v-list>
          <v-list-item data-del-group-btn>
            <v-list-item-title class="test-remove-texts"
              >Remove From Blacklist</v-list-item-title
            >
          </v-list-item>
        </v-list>
      </v-menu>
    </div>
    <v-data-table
      :headers="blacklistHeaders"
      :items="publicBlacklist"
      item-key="text_uuid"
      class="mt-3"
      show-select
      v-model="selectedTexts"
    >
      <template #[`item.name`]="{ item }">
        <router-link
          :to="`/epigraphies/${item.text_uuid}`"
          class="test-text-name"
          >{{ item.name }}</router-link
        >
      </template>
    </v-data-table>
  </div>
</template>

<script lang="ts">
import {
  defineComponent,
  ref,
  Ref,
  onMounted,
  watch,
  computed,
} from '@vue/composition-api';
import { Text } from '@oare/types';
import OareContentView from '@/components/base/OareContentView.vue';
import { DataTableHeader } from 'vuetify';
import sl from '@/serviceLocator';

export default defineComponent({
  components: { OareContentView },
  setup() {
    const server = sl.get('serverProxy');
    const actions = sl.get('globalActions');

    const blacklistHeaders: Ref<DataTableHeader[]> = ref([
      { text: 'Name', value: 'name' },
    ]);
    const publicBlacklist: Ref<Text[]> = ref([]);
    const selectedTexts: Ref<Text[]> = ref([]);

    const loading = ref(true);

    onMounted(async () => {
      try {
        publicBlacklist.value = await server.getPublicBlacklist();
      } catch {
        actions.showErrorSnackbar(
          'Error loading blacklisted texts. Please try again.'
        );
      } finally {
        loading.value = false;
      }
    });

    return {
      loading,
      publicBlacklist,
      blacklistHeaders,
      selectedTexts,
    };
  },
});
</script>

<style></style>
