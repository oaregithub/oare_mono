<template>
  <v-menu offset-y open-on-click>
    <template #activator="{ on, attrs }">
      <v-icon v-bind="attrs" v-on="on" class="mb-1 ml-1">
        mdi-information-outline
      </v-icon>
    </template>
    <v-card class="pa-3">
      Coming soon
      <br />
      <span
        >Variable Description: {{ variableDescription }}
        <v-icon>mdi-pencil</v-icon></span
      >
      <br />
      <span
        >Value Description: {{ valueDescription }}
        <v-icon>mdi-pencil</v-icon></span
      >
    </v-card>
  </v-menu>
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api';

export default defineComponent({
  name: 'PropertyInfo',
  props: {
    variableUuid: {
      type: String,
    },
    valueUuid: {
      type: String,
    },
    variableDescription: {
      type: String,
    },
    valueDescription: {
      type: String,
    },
  },
});
</script>
