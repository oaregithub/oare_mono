<template>
  <v-menu offset-y open-on-hover>
    <template #activator="{ on, attrs }">
      <v-icon v-bind="attrs" v-on="on" class="mb-1 ml-1">
        mdi-information-outline
      </v-icon>
    </template>
    <v-card class="pa-3">
      Brute character sequence search supports various intelligent search features:
      <ol>
        <li>
          <b>*</b> serves as a wildcard representing any consonant. e.g.: 'a-*a' will search for 'a-ba', 'a-na', 'a-da', etc.
        </li>
        <li>
          <b>&</b> serves as a wildcard representing various forms of a vowel when placed at the beginning of a sign. e.g.: '&tam' will search for 'tam', 'tám', 'tàm', 'tam₄', etc.
        </li>
        <li>
          <b>[]</b> serves as an indicator for a set of specified possible consonants. e.g.: 'a-[bd]a' will search for 'a-ba' and 'a-da'.
        </li>
        <li>
          Searches can be formatted similar to other databases. e.g.: 's,u2-ba1 tam4' will search for 'ṣú-ba tam₄'
        </li>
      </ol>
      Thus, '&[bdt]a*' would form a valid search that would return results for 'bar', 'dan', 'dam', 'tám', etc. 
    </v-card>
  </v-menu>
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api';

export default defineComponent({});
</script>

<style></style>
