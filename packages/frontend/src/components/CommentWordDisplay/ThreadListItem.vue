<template>
  <div>
    <v-card
      :color="isSelected ? '#ebebeb' : 'white'"
      elevation="0"
      @click="selectThread"
    >
      <div class="pl-2 pr-2 pt-2 pb-2">
        <v-row class="test-select-thread" @click="selectThread">
          <v-col cols="9">
            <h2>
              {{ displayThreadName }}
            </h2>
          </v-col>
          <v-col cols="1">
            <v-icon
              @click="editThreadNameDialog = true"
              class="mb-n2 test-edit-thread-name-dialog"
              color="primary"
              >mdi-pencil</v-icon
            >
          </v-col>
        </v-row>
        <v-menu offset-y class="test-thread-menu">
          <template #activator="{ on, attrs }">
            <div class="mt-n3">
              <span class="text-subtitle-2">{{ thread.status }}</span>
              <v-icon
                class="mt-n1 test-status-dropdown"
                v-bind="attrs"
                v-if="user && user.isAdmin"
                v-on="on"
                >mdi-chevron-down</v-icon
              >
            </div>
          </template>
          <v-list>
            <v-list-item
              :key="index"
              @click="updateThreadStatus(status)"
              v-for="(status, index) in statuses"
              class="test-status-dropdown-item"
            >
              <v-list-item-title>{{ status }}</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
      </div>
      <v-divider />
    </v-card>

    <OareDialog
      class="test-edit-dialog"
      @submit="updateThreadName"
      cancelText="Cancel"
      submitText="Submit"
      title="Edit"
      v-model="editThreadNameDialog"
      :submitLoading="loading"
      :submitDisabled="!validThreadName"
    >
      <v-text-field
        label="New Thread Name"
        v-model="newThreadName"
        class="test-edit-thread-name"
        autofocus
      ></v-text-field>
      <span class="error--text" v-if="!validThreadName">{{
        editErrorMessage
      }}</span>
    </OareDialog>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, computed, ref } from '@vue/composition-api';
import { Thread, ThreadStatus } from '@oare/types';
import sl from '@/serviceLocator';
import { resetAdminBadge } from '@/utils';

export default defineComponent({
  props: {
    thread: {
      type: Object as PropType<Thread>,
      required: true,
    },
    isSelected: {
      type: Boolean,
      default: false,
    },
  },
  setup(props, { emit }) {
    const server = sl.get('serverProxy');
    const actions = sl.get('globalActions');
    const store = sl.get('store');

    const editThreadNameDialog = ref(false);
    const loading = ref(false);
    const newThreadName = ref(props.thread.name || '');
    const editErrorMessage = ref('');

    const statuses = ref<ThreadStatus[]>([
      'New',
      'Pending',
      'In Progress',
      'Completed',
    ]);

    const displayThreadName = computed(() => {
      return props.thread.name || 'Untitled';
    });

    const selectThread = () => {
      emit('selected', props.thread.uuid);
    };

    const validThreadName = computed(() => {
      let valid = true;
      if (newThreadName.value === '') {
        editErrorMessage.value = 'New thread name cannot be empty.';
        valid = false;
      }

      return valid;
    });

    const user = computed(() => store.getters.user);

    const updateThreadName = async () => {
      loading.value = true;
      try {
        await server.updateThreadName({
          threadUuid: props.thread.uuid,
          newName: newThreadName.value,
        });
        actions.showSnackbar(`Successfully edited the thread name.`);
        emit('nameUpdated', newThreadName.value);
        editThreadNameDialog.value = false;
      } catch {
        actions.showErrorSnackbar('Failed to edit thread name');
      } finally {
        loading.value = false;
        newThreadName.value = '';
      }
    };

    const updateThreadStatus = async (status: ThreadStatus) => {
      // Only update if status changes from the original value.
      if (status !== props.thread.status) {
        try {
          loading.value = true;
          props.thread.status = status;
          await server.updateThread(props.thread);

          actions.showSnackbar('Successfully updated the thread');
          emit('statusUpdated');
          await resetAdminBadge();
        } catch {
          actions.showErrorSnackbar('Failed to update the thread');
        } finally {
          loading.value = false;
        }
      }
    };

    return {
      displayThreadName,
      selectThread,
      editThreadNameDialog,
      statuses,
      loading,
      newThreadName,
      updateThreadName,
      editErrorMessage,
      validThreadName,
      user,
      updateThreadStatus,
    };
  },
});
</script>
