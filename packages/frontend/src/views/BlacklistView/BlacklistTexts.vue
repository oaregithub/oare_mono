<template>
  <v-progress-linear v-if="loading" indeterminate />
  <div v-else>
    <div style="display: flex">
      <OareDialog
        title="Add individual texts"
        v-model="addTextsDialog"
        :submitLoading="addTextsLoading"
        @submit="addTexts"
        :submitDisabled="textsToAdd.length === 0"
      >
        <template v-slot:activator="{ on }">
          <v-btn color="primary" class="mr-3 test-add" v-on="on">
            <v-icon>mdi-plus</v-icon>Add Texts
          </v-btn>
        </template>
        <v-autocomplete
          v-model="textsToAdd"
          :search-input.sync="searchTextToAdd"
          outlined
          :items="textItems"
          :loading="searchLoading"
          item-text="name"
          item-value="uuid"
          hide-no-data
          cache-items
          return-object
          multiple
          chips
          deletable-chips
        ></v-autocomplete>
        <v-data-table :headers="textHeaders" :items="textsToAdd">
          <template #[`item.name`]="{ item }">
            <v-btn icon small @click="removeTextToAdd(item.name)">
              <v-icon>mdi-close</v-icon>
            </v-btn>
            {{ item.name }}
          </template>
        </v-data-table>
      </OareDialog>
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
          <li v-for="text in selectedTexts" :key="text.text_uuid">
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
    const _ = sl.get('lodash');

    const blacklistHeaders: Ref<DataTableHeader[]> = ref([
      { text: 'Name', value: 'name' },
    ]);
    const textHeaders = ref([{ text: 'Text Name', value: 'name' }]);

    const publicBlacklist: Ref<Text[]> = ref([]);
    const selectedTexts: Ref<Text[]> = ref([]);
    const textsToAdd: Ref<Text[]> = ref([]);
    const textItems: Ref<Text[]> = ref([]);

    const loading = ref(true);
    const confirmRemoveDialog = ref(false);
    const removeTextLoading = ref(false);
    const addTextsDialog = ref(false);
    const addTextsLoading = ref(false);
    const searchLoading = ref(false);
    const searchTextToAdd = ref('');

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

    const addTexts = async () => {
      const addPublicTexts = textsToAdd.value.map(text => ({
        uuid: text.text_uuid,
        type: 'text',
      }));
      addTextsLoading.value = true;
      try {
        await server.addTextsToPublicBlacklist({ texts: addPublicTexts });
        textsToAdd.value.forEach(text => {
          publicBlacklist.value.unshift({
            ...text,
            text_uuid: text.text_uuid,
          });
        });
        publicBlacklist.value = publicBlacklist.value.sort((a, b) =>
          a.name.localeCompare(b.name)
        );
        actions.showSnackbar('Successfully added text(s).');
      } catch {
        actions.showErrorSnackbar('Error adding text(s). Please try again.');
      } finally {
        addTextsLoading.value = false;
        addTextsDialog.value = false;
      }
    };

    const removeTexts = async () => {
      try {
        removeTextLoading.value = true;
        let removeTextIds = selectedTexts.value.map(text => text.text_uuid);

        await server.removeTextsFromPublicBlacklist(removeTextIds);
        publicBlacklist.value = publicBlacklist.value.filter(
          text => !removeTextIds.includes(text.text_uuid)
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

    const removeTextToAdd = (name: string) => {
      textsToAdd.value = textsToAdd.value.filter(text => text.name !== name);
    };

    watch(addTextsDialog, open => {
      if (!open) {
        searchTextToAdd.value = '';
        textsToAdd.value = [];
      }
    });

    watch(
      searchTextToAdd,
      _.debounce(async (text: string) => {
        if (!text || text.trim() === '') {
          textItems.value = [];
          return;
        }

        searchLoading.value = true;
        try {
          const items = await server.searchTextNames({ search: text });
          textItems.value = items.map(item => ({
            ...item,
            text_uuid: item.uuid,
            can_read: false,
            can_write: false,
          }));
        } catch {
          actions.showErrorSnackbar(
            'Error performing search. Please try again.'
          );
        } finally {
          searchLoading.value = false;
        }
      }, 500)
    );

    return {
      loading,
      publicBlacklist,
      blacklistHeaders,
      selectedTexts,
      confirmRemoveDialog,
      removeTextLoading,
      removeTexts,
      addTexts,
      addTextsDialog,
      addTextsLoading,
      textsToAdd,
      searchTextToAdd,
      textItems,
      textHeaders,
      removeTextToAdd,
      searchLoading,
    };
  },
});
</script>

<style></style>
