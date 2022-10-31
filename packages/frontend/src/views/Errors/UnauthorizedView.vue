<template>
  <OareContentView title="Unauthorized">
    You must be logged in to access the page you tried to navigate to. Please
    log in and try again. If you believe this is a mistake, please contact us at
    <a href="mailto:oarefeedback@byu.edu">oarefeedback@byu.edu</a>.

    <v-row v-if="message" class="ma-0 mt-4">
      <b class="mr-1">Error Details:</b>{{ message }}
    </v-row>

    <v-row class="ma-0 mt-6">
      <v-btn color="primary" to="/login">Log In</v-btn>
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
