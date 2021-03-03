<template>
  <OareContentView title="Search">
    <router-link to="/search/texts" class="oare-title mr-4">Texts</router-link>
    <router-link to="/search/dictionary" class="oare-title"
      >Dictionary</router-link
    >
    <router-view />
  </OareContentView>
</template>

<script lang="ts">
import Vue from 'vue';
import {
  defineComponent,
  ref,
  Ref,
  watch,
  computed,
} from '@vue/composition-api';
import TextsSearch from './TextsSearch/TextsSearch.vue';
import DictionarySearch from './DictionarySearch/DictionarySearch.vue';
import { updateUrl } from './utils';

export default defineComponent({
  name: 'SearchView',
  components: {
    TextsSearch,
    DictionarySearch,
  },
});
</script>

<style></style>
