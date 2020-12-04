<template>
  <OareContentView title="Add Texts to Public Blacklist" :loading="loading">
    <template #header>
      <router-link to="/admin/blacklist/texts"
        >&larr; Back to texts view
      </router-link>
    </template>

    <OareDialog
      v-model="addTextsDialog"
      title="Add texts"
      submitText="Yes, add"
      cancelText="No, don't add"
      @submit="addTexts"
      :submitLoading="addTextsLoading"
    >
      <template v-slot:activator="{ on }">
        <v-btn
          v-on="on"
          color="info"
          :disabled="selectedTexts.length === 0"
          class="test-add"
          >Add selected texts</v-btn
        >
      </template>
      Are you sure you want to add the following texts to the public blacklist?
      <v-list>
        <v-list-item v-for="(text, index) in selectedTexts" :key="index">
        </v-list-item>
      </v-list>
    </OareDialog>

    <v-data-table
      :headers="textHeaders"
      :items="allTexts"
      class="mt-3"
      show-select
      v-model="selectedTexts"
    >
    </v-data-table>
  </OareContentView>
</template>

<script lang="ts">
import {
  defineComponent,
  PropType,
  ref,
  Ref,
  onMounted,
  watch,
  computed,
} from '@vue/composition-api';
import sl from '@/serviceLocator';
import OareContentView from '@/components/base/OareContentView.vue';
import { Text } from '@oare/types';
import { DataTableHeader } from 'vuetify';

export default defineComponent({
  components: { OareContentView },
  name: 'AddBlacklistTexts',
  setup() {
    const server = sl.get('serverProxy');
    const actions = sl.get('globalActions');
    const router = sl.get('router');

    const textHeaders: Ref<DataTableHeader[]> = ref([
      { text: 'Name', value: 'name' },
    ]);

    const allTexts: Ref<Text[]> = ref([]);
    const selectedTexts: Ref<Text[]> = ref([]);

    const loading = ref(true);
    const addTextsLoading = ref(false);
    const addTextsDialog = ref(false);

    const addTexts = async () => {
      addTextsLoading.value = true;
      try {
        console.log('Adding Texts');
        selectedTexts.value = [];
        addTextsDialog.value = false;
        actions.showSnackbar('Successfully added texts to blacklist.');
        router.push('/admin/blacklist/texts');
      } catch {
        actions.showErrorSnackbar(
          'Error adding texts to blacklist. Please try again.'
        );
      } finally {
        addTextsLoading.value = false;
      }
    };

    onMounted(async () => {
      try {
        allTexts.value = [
          {
            name: 'Test',
            text_uuid: 'uuid1',
            can_read: false,
            can_write: false,
          },
        ];
      } catch {
        actions.showErrorSnackbar('Error loading texts. Please try again.');
      } finally {
        loading.value = false;
      }
    });

    return {
      loading,
      selectedTexts,
      addTextsLoading,
      addTextsDialog,
      addTexts,
      textHeaders,
      allTexts,
    };
  },
});
</script>
