<template>
  <v-menu offset-y open-on-hover>
    <template #activator="{ on, attrs }">
      <v-icon v-bind="attrs" v-on="on" class="mb-1 ml-1">
        mdi-information-outline
      </v-icon>
    </template>
    <v-card class="pa-3">
      <b>Words in Text Search</b>
      <br />
      This search function allows users to search for words and forms of words
      in texts.
      <ol>
        <li>Start by searching for a word or form in the autocomplete area.</li>
        <li>Select the word or form you are searching for.</li>
        <li>
          Then, check any other forms in relation to that word or form that you
          would like to search for.
        </li>
        <li>
          To specify the number of words in between words/forms you are
          searching for, select an option in 'words between'.
        </li>
      </ol>

      <b>Search Modes</b><br />

      Sequenced - Forces word forms to be in sequence (i.e., word/form #1,
      word/form #2, word/form #3)
      <br />
      Unsequenced - searches for word forms in any particular order
    </v-card>
  </v-menu>
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api';

export default defineComponent({});
</script>

<style></style>
