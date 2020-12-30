<template>
  <v-progress-linear v-if="loading" indeterminate />
  <div v-else>
    <div style="display: flex">
      <router-link to="/addblacklist">
        <v-btn color="primary" class="mr-3 test-add">
          <span> <v-icon>mdi-plus</v-icon>Add texts</span>
        </v-btn>
      </router-link>
      <OareDialog
        v-model="confirmRemoveDialog"
        title="Confirm Removal"
        cancelText="No, don't remove"
        submitText="Yes, remove"
        @submit="removeTexts"
        :submitLoading="removeTextLoading"
      >
        The following text(s) will be removed from the public blacklist and will
        be available to all users unless individual group restrictions apply.
        Are you sure you want to remove them?
        <ul>
          <li v-for="text in selectedTexts" :key="text.uuid">
            {{ text.name }}
          </li>
        </ul>
      </OareDialog>
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
          <v-list-item @click="confirmRemoveDialog = true" data-del-group-btn>
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
      item-key="uuid"
      class="mt-3"
      show-select
      v-model="selectedTexts"
    >
      <template #[`item.name`]="{ item }">
        <router-link :to="`/epigraphies/${item.uuid}`" class="test-text-name">{{
          item.name
        }}</router-link>
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
    const _ = sl.get('lodash');

    const blacklistHeaders: Ref<DataTableHeader[]> = ref([
      { text: 'Name', value: 'name' },
    ]);

    const publicBlacklist: Ref<Text[]> = ref([]);
    const selectedTexts: Ref<Text[]> = ref([]);

    const loading = ref(true);
    const confirmRemoveDialog = ref(false);
    const removeTextLoading = ref(false);

    onMounted(async () => {
      try {
        publicBlacklist.value = await server.getPublicBlacklist();
        publicBlacklist.value = publicBlacklist.value.sort((a, b) =>
          a.name.localeCompare(b.name)
        );
      } catch {
        actions.showErrorSnackbar(
          'Error loading blacklisted texts. Please try again.'
        );
      } finally {
        loading.value = false;
      }
    });

    const removeTexts = async () => {
      try {
        removeTextLoading.value = true;
        let removeTextIds = selectedTexts.value.map(text => text.uuid);

        await server.removeTextsFromPublicBlacklist(removeTextIds);
        publicBlacklist.value = publicBlacklist.value.filter(
          text => !removeTextIds.includes(text.uuid)
        );
        actions.showSnackbar('Successfully removed text(s).');
        selectedTexts.value = [];
      } catch {
        actions.showErrorSnackbar('Error removing text(s). Please try again.');
      } finally {
        confirmRemoveDialog.value = false;
        removeTextLoading.value = false;
      }
    };

    return {
      loading,
      publicBlacklist,
      blacklistHeaders,
      selectedTexts,
      confirmRemoveDialog,
      removeTextLoading,
      removeTexts,
    };
  },
});
</script>

<style></style>
