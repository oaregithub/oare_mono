<template>
  <OareContentView title="Forbidden">
    You do not have permission to access the page you tried to navigate to. If
    you believe this is a mistake, please contact us at
    <a href="mailto:oarefeedback@byu.edu">oarefeedback@byu.edu</a>.

    <v-row v-if="message" class="ma-0 mt-4">
      <b class="mr-1">Error Details:</b>{{ message }}
    </v-row>
  </OareContentView>
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api';

export default defineComponent({
  props: {
    message: {
      type: String,
      required: false,
    },
  },
});
</script>
