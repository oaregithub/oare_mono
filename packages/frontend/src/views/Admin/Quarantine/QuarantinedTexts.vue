<template>
  <OareContentView title="Quarantined Texts" :loading="loading">
    <div>
      <span
        >Texts that appear in this list have been quarantined. These texts do
        not appear in text lists or search results and their contents do not
        count towards item totals. The site essentially functions as though they
        don't exist.</span
      >
      <br />
      <span
        >Texts should only be quarantined if they are no longer needed and will
        soon be deleted. If you simply want to hide a text from the public view,
        please use the
        <router-link to="/admin/denylist/texts"> Public Denylist </router-link>
        instead.</span
      >
      <br />
      <span
        >From this page, you can access quarantined texts for reference, restore
        them to the site, or permanently delete them from all relevant areas of
        the database.
      </span>
    </div>

    <oare-dialog
      v-model="confirmRestoreDialog"
      title="Restore Text(s)?"
      submitText="Yes"
      cancelText="Cancel"
      @submit="restoreTexts"
      :submitLoading="restoreLoading"
    >
      <template v-slot:activator="{ on }">
        <v-btn
          color="primary"
          class="mx-4 mt-4"
          v-on="on"
          :disabled="selectedTexts.length < 1"
          >Restore</v-btn
        >
      </template>
      Are you sure you want to restore the selected text(s)? Once a text is
      restored, it will appear in text lists and search results and its contents
      will again count towards item totals.

      <ul>
        <li v-for="text in selectedTexts" :key="text.text.uuid">
          {{ text.text.name }}
        </li>
      </ul>
    </oare-dialog>

    <oare-dialog
      v-model="confirmDeleteDialog"
      title="Permanently Delete Text(s)?"
      submitText="Yes"
      cancelText="Cancel"
      @submit="setupReauthentication"
      :cancelDisabled="deleteLoading"
      :submitLoading="deleteLoading"
    >
      <template v-slot:activator="{ on }">
        <v-btn
          color="primary"
          class="mt-4"
          v-on="on"
          :disabled="selectedTexts.length < 1"
          >Permanently Delete</v-btn
        >
      </template>
      <reautheticate
        v-model="reautheticateDialog"
        description="To acknowledge that you understand that deleting the selected text(s) is permanent, please re-enter your password."
        @reauthenticated="handleReauthentication"
      />
      <span
        >Are you sure you want to permanently delete the selected text(s)? All
        associated database pieces will be permanently deleted. Once complete,
        this action cannot be undone.</span
      >
      <br />
      <b class="mt-4"
        >NOTE: This operation will take a few moments to complete.</b
      >
      <ul class="mt-4">
        <li v-for="text in selectedTexts" :key="text.text.uuid">
          {{ text.text.name }}
        </li>
      </ul>
    </oare-dialog>

    <v-data-table
      :headers="listHeaders"
      :items="texts"
      item-key="text.uuid"
      class="mt-3"
      show-select
      v-model="selectedTexts"
      ><template #[`item.name`]="{ item }">
        <router-link
          v-if="item.hasEpigraphy"
          :to="`/epigraphies/${item.text.uuid}`"
          >{{ item.text.name }}</router-link
        >
        <span v-else>{{ item.text.name }}</span>
      </template>
      <template #[`item.timestamp`]="{ item }">
        <span>{{ formatTimestamp(item.timestamp) }} </span>
      </template>
    </v-data-table>
  </OareContentView>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from '@vue/composition-api';
import sl from '@/serviceLocator';
import { DataTableHeader } from 'vuetify';
import { QuarantineText } from '@oare/types';
import { DateTime } from 'luxon';
import Reautheticate from '@/views/Authentication/Verification/Reautheticate.vue';

export default defineComponent({
  name: 'QuarantinedTexts',
  components: {
    Reautheticate,
  },
  setup() {
    const server = sl.get('serverProxy');
    const actions = sl.get('globalActions');

    const loading = ref(false);

    const listHeaders = ref<DataTableHeader[]>([
      { text: 'Name', value: 'name' },
      { text: 'Quarantined Since', value: 'timestamp' },
    ]);

    const texts = ref<QuarantineText[]>([]);
    const selectedTexts = ref<QuarantineText[]>([]);

    onMounted(async () => {
      try {
        loading.value = true;
        texts.value = await server.getQuarantinedTexts();
        texts.value = texts.value.sort((a, b) =>
          a.text.name && b.text.name
            ? a.text.name.localeCompare(b.text.name)
            : -1
        );
      } catch (err) {
        actions.showErrorSnackbar(
          'Error loading quarantined texts. Please try again.',
          err as Error
        );
      } finally {
        loading.value = false;
      }
    });

    const formatTimestamp = (timestamp: Date) => {
      return DateTime.fromJSDate(new Date(timestamp)).toLocaleString(
        DateTime.DATETIME_MED
      );
    };

    const confirmRestoreDialog = ref(false);
    const restoreLoading = ref(false);

    const restoreTexts = async () => {
      try {
        restoreLoading.value = true;
        const uuidsToRestore = selectedTexts.value.map(text => text.text.uuid);
        await Promise.all(uuidsToRestore.map(uuid => server.restoreText(uuid)));
        texts.value = texts.value.filter(
          text => !uuidsToRestore.includes(text.text.uuid)
        );
        actions.showSnackbar('Successfully restored text(s).');
        selectedTexts.value = [];
      } catch (err) {
        actions.showErrorSnackbar(
          'Error restoring text(s). Please try again.',
          err as Error
        );
      } finally {
        confirmRestoreDialog.value = false;
        restoreLoading.value = false;
      }
    };

    const confirmDeleteDialog = ref(false);
    const deleteLoading = ref(false);

    const deleteTexts = async () => {
      try {
        deleteLoading.value = true;
        const uuidsToDelete = selectedTexts.value.map(text => text.text.uuid);
        await Promise.all(
          uuidsToDelete.map(uuid => server.permanentlyDeleteText(uuid))
        );
        texts.value = texts.value.filter(
          text => !uuidsToDelete.includes(text.text.uuid)
        );
        actions.showSnackbar('Successfully deleted text(s).');
        selectedTexts.value = [];
      } catch (err) {
        actions.showErrorSnackbar(
          'Error deleting text(s). Please try again.',
          err as Error
        );
      } finally {
        confirmDeleteDialog.value = false;
        deleteLoading.value = false;
      }
    };

    const reautheticateDialog = ref(false);

    const setupReauthentication = () => {
      reautheticateDialog.value = true;
    };

    const handleReauthentication = async () => {
      await deleteTexts();
    };

    return {
      loading,
      listHeaders,
      texts,
      selectedTexts,
      formatTimestamp,
      restoreTexts,
      confirmRestoreDialog,
      restoreLoading,
      confirmDeleteDialog,
      deleteLoading,
      deleteTexts,
      reautheticateDialog,
      setupReauthentication,
      handleReauthentication,
    };
  },
});
</script>
