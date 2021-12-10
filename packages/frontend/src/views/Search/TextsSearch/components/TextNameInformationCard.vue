<template>
  <v-menu offset-y open-on-hover>
    <template #activator="{ on, attrs }">
      <v-icon v-bind="attrs" v-on="on" class="mb-1 ml-1">
        mdi-information-outline
      </v-icon>
    </template>
    <v-card class="pa-3">
      The Text name search attempts to find all matches to Publication,
      Excavation, and/or Museum information. Generally speaking, publication
      info is based on abbreviations common within the Old Assyrian publications
      and following the CAD in eschewing commas except for page numbers. For
      example, 'TC 1 15', instead of 'TCL 4, 15'.
    </v-card>
  </v-menu>
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api';

export default defineComponent({});
</script>

<style></style>
