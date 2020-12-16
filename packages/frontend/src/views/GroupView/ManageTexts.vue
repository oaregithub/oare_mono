<template>
  <v-progress-linear v-if="loading" indeterminate />
  <div v-else>
    Texts here affect all members of this group. You may restrict read and write
    access on texts added here.
    <div class="flex mt-2">
      <router-link :to="`/addgrouptexts/${groupId}`">
        <v-btn color="primary" class="mr-3 test-add">
          <span> <v-icon>mdi-plus</v-icon>Add texts </span>
        </v-btn>
      </router-link>
      <OareDialog
        title="Remove texts"
        v-model="removeTextsDialog"
        cancelText="No, don't remove"
        submitText="Yes, remove"
        @submit="removeTexts"
        :submitLoading="removeLoading"
      >
        <template v-slot:activator="{ on }">
          <v-btn
            v-on="on"
            color="info"
            :disabled="selectedDeleteList.length === 0"
            class="test-remove"
            >Remove texts</v-btn
          >
        </template>
        Are you sure you want to remove the following texts from this group?
        Members of this group will no longer be able to view or edit the
        following texts if their visibility is restricted in another group that
        users of this group belong to.
        <v-list>
          <v-list-item v-for="(text, index) in selectedDeleteList" :key="index">
            <v-list-item-title>{{ text.name }}</v-list-item-title>
          </v-list-item>
        </v-list>
      </OareDialog>
    </div>
    <v-data-table
      :headers="textHeaders"
      :items="viewableTexts"
      disable-sort
      show-select
      v-model="selectedDeleteList"
      item-key="text_uuid"
      class="mt-3"
    >
      <template #[`item.name`]="{ item }">
        <router-link :to="`/epigraphies/${item.text_uuid}`">{{
          item.name
        }}</router-link>
      </template>
      <template #[`item.can_read`]="{ item }">
        <v-switch
          :input-value="item.can_read"
          @change="updateTextRead(item.text_uuid, $event)"
          :label="item.can_read ? 'Yes' : 'No'"
          class="test-toggle-view"
        />
      </template>
      <template #[`item.can_write`]="{ item }">
        <v-switch
          :input-value="item.can_write"
          @change="updateTextEdit(item.text_uuid, $event)"
          :label="item.can_write ? 'Yes' : 'No'"
          :disabled="!item.can_read"
          class="test-toggle-edit"
        />
      </template>
    </v-data-table>
  </div>
</template>

<script lang="ts">
import _ from 'lodash';
import defaultServerProxy from '@/serverProxy';
import { Text } from '@oare/types';
import sl from '@/serviceLocator';

import {
  defineComponent,
  ref,
  Ref,
  onMounted,
  PropType,
  watch,
} from '@vue/composition-api';

export default defineComponent({
  name: 'ManageTexts',
  props: {
    groupId: {
      type: String,
      required: true,
    },
    serverProxy: {
      type: Object as PropType<typeof defaultServerProxy>,
      default: () => defaultServerProxy,
    },
  },
  setup({ serverProxy, groupId }) {
    const loading = ref(false);
    const removeTextsDialog = ref(false);
    const removeLoading = ref(false);

    const allTexts: Ref<Text[]> = ref([]);
    const selectedDeleteList: Ref<Text[]> = ref([]);
    const textHeaders = ref([
      { text: 'Text Name', value: 'name' },
      { text: 'Can view?', value: 'can_read' },
      { text: 'Can edit?', value: 'can_write' },
    ]);
    const viewableTexts: Ref<Text[]> = ref([]);
    const server = sl.get('serverProxy');
    const actions = sl.get('globalActions');

    onMounted(async () => {
      loading.value = true;
      try {
        viewableTexts.value = await server.getTextGroups(Number(groupId));
      } catch {
        actions.showErrorSnackbar('Error loading texts. Please try again.');
      } finally {
        loading.value = false;
      }
    });

    const updateTextEdit = async (uuid: string, canWrite: boolean) => {
      const index = viewableTexts.value
        .map(item => item.text_uuid)
        .indexOf(uuid);

      viewableTexts.value[index].can_write = canWrite;
      const text = viewableTexts.value[index];
      try {
        await server.updateText(Number(groupId), {
          textUuid: uuid,
          canRead: text.can_read,
          canWrite: text.can_write,
        });
      } catch {
        actions.showErrorSnackbar(
          'Error updating editing permissions. Please try again.'
        );
        viewableTexts.value[index].can_write = !canWrite;
      }
    };

    const updateTextRead = async (uuid: string, canRead: boolean) => {
      const index = viewableTexts.value
        .map(item => item.text_uuid)
        .indexOf(uuid);
      viewableTexts.value[index].can_read = canRead;

      // Disable editing if reading is disabled
      if (!canRead) {
        viewableTexts.value[index].can_write = false;
      }

      const text = viewableTexts.value[index];
      try {
        await server.updateText(Number(groupId), {
          textUuid: uuid,
          canRead: text.can_read,
          canWrite: text.can_write,
        });
      } catch {
        actions.showErrorSnackbar(
          'Error updating viewing permissions. Please try again.'
        );
        viewableTexts.value[index].can_read = !canRead;
      }
    };

    const removeTexts = async () => {
      removeLoading.value = true;
      const deleteTextUuids = selectedDeleteList.value.map(
        text => text.text_uuid
      );
      try {
        await server.removeTextsFromGroup(Number(groupId), {
          textUuids: deleteTextUuids,
        });
        viewableTexts.value = viewableTexts.value.filter(
          text => !deleteTextUuids.includes(text.text_uuid)
        );
        actions.showSnackbar('Successfully removed text(s).');
      } catch {
        actions.showErrorSnackbar('Error removing text(s). Please try again.');
      } finally {
        removeLoading.value = false;
      }
      removeTextsDialog.value = false;
      selectedDeleteList.value = [];
    };

    return {
      loading,
      removeTextsDialog,
      removeLoading,
      allTexts,
      selectedDeleteList,
      textHeaders,
      viewableTexts,
      updateTextEdit,
      updateTextRead,
      removeTexts,
    };
  },
});
</script>
