<template>
  <v-menu offset-y open-on-hover>
    <template #activator="{ on, attrs }">
      <v-icon v-bind="attrs" v-on="on" class="mb-1 ml-1">
        mdi-information-outline
      </v-icon>
    </template>
    <v-card class="pa-3">
      <br />
      <span>The transliteration search supports the following features:</span>
      <ol>
        <li>
          Use <b>C</b> to represent all Assyrian consonants (e.g., 'a-Ca' will
          search for 'a-ba', 'a-na', 'a-ta', etc.).
        </li>
        <li>
          Use <b>&amp;</b> at the beginning of a sign to query all readings in
          that sequence (e.g., '&amp;tam' will search for 'tam', 'tám', 'tàm',
          'tam₄', etc.).
        </li>
        <li>
          Use <b>[]</b> to bracket a set of consonants to include in your query
          (e.g., 'a-[bp]a' will search for 'a-ba' and 'a-pa').
        </li>
        <li>
          Use <b>$</b> to query all instances of the sign regardless of reading
          entered (e.g., '$ba' will search for both the 'ba' and 'pá' readings
          of the sign BA).
        </li>
        <li>
          If preferred, use cdli style conventions (e.g., 's,u2-ba1-tam4' will
          search for 'ṣú-ba-tam₄').
        </li>
        Thus, '&amp;[bdt]aC' would form a valid search that would return results
        for 'bar', 'dan', 'dam', 'tám', etc.
        <li>
          Use <b>;</b> to enter mulitple strings for query in the same same text
          (e.g., a-na; mì-ma will search for co-occurences of the two strings in
          the same text).
        </li>
        <li>
          Use <b>!</b> ahead of a string to exclude texts which have that string
          (e.g., a-na; !mì-ma will search for texts with a-na but NOT mì-ma).
        </li>
      </ol>
      <br />
      <span><b>Transliteration Search Modes</b></span>
      <ol style="list-style: none">
        <li>Respect No Word Boundaries -- brute force character search</li>
        <li>
          Respect Word Boundaries -- respects word boundaries except for the
          beginning of the first word and end of the last word
        </li>
        <li>Respect All Word Boundaries -- respects all word boundaries</li>
      </ol>
      <br />
      <b>NOTE:</b> Any of these search features may increase time for search
      results somewhat, and combinations of multiple of these features moreso.
    </v-card>
  </v-menu>
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api';

export default defineComponent({});
</script>

<style></style>
