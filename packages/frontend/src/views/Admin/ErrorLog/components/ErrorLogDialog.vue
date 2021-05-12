<template>
  <oare-dialog
    :value="value"
    @input="$emit('input', $event)"
    title="Error Details"
    cancelText="Close"
    :showSubmit="false"
    :showCancel="false"
    :closeButton="true"
    :width="750"
    :persistent="false"
  >
    <v-container>
      <v-row class="py-2">
        <div>
          <h3>Status</h3>
          <v-select
            dense
            :items="statusItems"
            :label="error.status"
            @input="updateStatus"
            class="test-status"
          ></v-select>
        </div>
      </v-row>

      <v-row class="py-2">
        <div>
          <h3>User</h3>
          <span class="test-user-name">{{ error.userName || 'No User' }}</span>
        </div>
      </v-row>

      <v-row class="py-2">
        <div>
          <h3>Timestamp</h3>
          <span>{{ formatTimestamp(error.timestamp) }}</span>
        </div>
      </v-row>

      <v-row class="py-2">
        <div>
          <h3>Description</h3>
          <span class="test-description">{{ error.description }}</span>
        </div>
      </v-row>

      <v-row class="py-2" v-if="error.stacktrace">
        <div>
          <h3>Stacktrace</h3>
          <span class="test-stacktrace">{{ error.stacktrace }}</span>
        </div>
      </v-row>
    </v-container>
  </oare-dialog>
</template>

<script lang="ts">
import { defineComponent, PropType } from '@vue/composition-api';
import OareDialog from '@/components/base/OareDialog.vue';
import { ErrorsRowWithUser, ErrorStatus } from '@oare/types';
import sl from '@/serviceLocator';
import { formatTimestamp, resetAdminBadge } from '@/utils';

export default defineComponent({
  name: 'ErrorLogDialog',
  components: {
    OareDialog,
  },
  props: {
    value: {
      type: Boolean,
      default: false,
    },
    error: {
      type: Object as PropType<ErrorsRowWithUser>,
      required: true,
    },
  },
  setup({ error }, { emit }) {
    const server = sl.get('serverProxy');
    const actions = sl.get('globalActions');

    const statusItems: ErrorStatus[] = ['New', 'In Progress', 'Resolved'];

    const updateStatus = async (status: ErrorStatus) => {
      try {
        emit('update-status', status);
        await server.updateErrorStatus([error.uuid], error.status);
        await resetAdminBadge();
      } catch {
        actions.showErrorSnackbar(
          'Error updating error status. Please try again.',
          'updateErrorStatus failed'
        );
      }
    };

    return {
      formatTimestamp,
      updateStatus,
      statusItems,
    };
  },
});
</script>
