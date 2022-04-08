<template>
  <div>
    <span>Transliteration Search Settings</span>
    <v-menu offset-y open-on-hover>
      <template #activator="{ on, attrs }">
        <v-icon v-bind="attrs" v-on="on" class="mb-1 ml-1">
          mdi-information-outline
        </v-icon>
      </template>
      <v-card class="pa-3">
        NOTE: Respect Word Boundaries causes transliteration search to respect
        word boundaries except for the first and last word. Match Exactly forces
        transliteration search to respect ALL word boundaries.
      </v-card>
    </v-menu>
  </div>
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api';

export default defineComponent({});
</script>

<style></style>
