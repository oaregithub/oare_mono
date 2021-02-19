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
          ></v-select>
        </div>
      </v-row>

      <v-row class="py-2">
        <div>
          <h3>User</h3>
          <span>{{ error.user_uuid }}</span>
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
          <span>{{ error.description }}</span>
        </div>
      </v-row>

      <v-row class="py-2" v-if="error.stacktrace">
        <div>
          <h3>Stacktrace</h3>
          <span>{{ error.stacktrace }}</span>
        </div>
      </v-row>
    </v-container>
  </oare-dialog>
</template>

<script lang="ts">
import { defineComponent, PropType, ref, Ref } from '@vue/composition-api';
import OareDialog from '../../components/base/OareDialog.vue';
import { ErrorsRowWithUser, ErrorStatus } from '@oare/types';
import sl from '@/serviceLocator';

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
  setup({ error }) {
    const server = sl.get('serverProxy');
    const actions = sl.get('globalActions');

    const statusItems: ErrorStatus[] = ['New', 'In Progress', 'Resolved'];

    const formatTimestamp = (timestamp: Date) => {
      return new Date(timestamp).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
      });
    };

    const updateStatus = async (status: ErrorStatus) => {
      try {
        error.status = status;
        await server.updateErrorStatus({
          uuid: error.uuid,
          status: error.status,
        });
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