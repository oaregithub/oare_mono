<template>
  <v-progress-linear v-if="loading" indeterminate />
  <OareContentView v-else :title="groupName">
    <template v-slot:header>
      <router-link to="/admin/groups">&larr; Back to admin view</router-link>
    </template>

    <b class="mb-2">Description</b>
    <div v-if="!editingDescription">
      <span>{{ groupDescription || 'No group description' }}</span>
      <v-btn icon class="test-pencil mt-n2" @click="editingDescription = true">
        <v-icon>mdi-pencil</v-icon>
      </v-btn>
    </div>
    <div v-else>
      <v-row class="ma-0 pa-0">
        <v-col cols="8" class="pa-0">
          <v-text-field
            v-model="editDescription"
            autofocus
            class="pa-0 test-description"
            :rules="[
              v =>
                v.length <= 200 || 'Description must be 200 characters or less',
            ]"
          />
        </v-col>
        <v-col cols="4" class="pa-0">
          <v-btn
            icon
            @click="saveDescriptionEdit"
            class="test-check"
            :disabled="editDescription.length > 200"
          >
            <v-icon>mdi-check</v-icon>
          </v-btn>
          <v-btn icon @click="editingDescription = false" class="test-close">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-col>
      </v-row>
    </div>

    <v-tabs class="my-3" v-model="tab">
      <v-tab to="members">Members</v-tab>
      <v-tab to="texts">Texts</v-tab>
      <v-tab to="collections">Collections</v-tab>
      <v-tab to="permissions">Permissions</v-tab>
    </v-tabs>
    <keep-alive>
      <router-view />
    </keep-alive>
  </OareContentView>
</template>

<script lang="ts">
import { defineComponent, onMounted, ref, watch } from '@vue/composition-api';
import sl from '@/serviceLocator';

export default defineComponent({
  name: 'GroupView',
  props: {
    groupId: {
      type: String,
      required: true,
    },
  },
  setup({ groupId }) {
    const server = sl.get('serverProxy');
    const actions = sl.get('globalActions');
    const groupName = ref('');
    const groupDescription = ref('');
    const editingDescription = ref(false);
    const loading = ref(true);
    const tab = ref(null);
    const editDescription = ref('');

    const saveDescriptionEdit = async () => {
      try {
        await server.updateGroupDescription(Number(groupId), {
          description: editDescription.value,
        });
        groupDescription.value = editDescription.value;
      } catch {
        actions.showErrorSnackbar(
          'Error updating group description. Please try again.'
        );
      } finally {
        editingDescription.value = false;
      }
    };

    onMounted(async () => {
      loading.value = true;
      try {
        const groupInfo = await server.getGroupInfo(Number(groupId));
        groupName.value = groupInfo.name;
        groupDescription.value =
          groupInfo.description || 'No group description';
      } catch {
        actions.showErrorSnackbar(
          'Error loading group information. Please try again.'
        );
      } finally {
        loading.value = false;
      }
    });

    watch(
      groupDescription,
      () => (editDescription.value = groupDescription.value)
    );

    return {
      loading,
      groupName,
      groupDescription,
      editingDescription,
      tab,
      saveDescriptionEdit,
      editDescription,
    };
  },
});
</script>
