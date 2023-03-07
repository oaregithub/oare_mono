<template>
  <OareContentView title="Search">
    <router-link to="/search/texts" class="oare-title mr-4"
      >Text Name</router-link
    >
    <router-link
      to="/search/dictionary"
      class="oare-title mr-4"
      v-if="canDictionarySearch"
      >Dictionary</router-link
    >
    <router-link to="/search/wordsInTexts" class="oare-title"
      >Words In Texts</router-link
    >
    <router-view />
  </OareContentView>
</template>

<script lang="ts">
import { defineComponent, computed } from '@vue/composition-api';
import TextsSearch from './TextsSearch/TextsSearch.vue';
import WordsInTextsSearch from './TextsSearch/WordsInTextSearch.vue';
import DictionarySearch from './DictionarySearch/DictionarySearch.vue';
import sl from '@/serviceLocator';

export default defineComponent({
  name: 'SearchView',
  components: {
    TextsSearch,
    DictionarySearch,
    WordsInTextsSearch,
  },
  setup() {
    const store = sl.get('store');

    const canDictionarySearch = computed(
      () =>
        store.hasPermission('WORDS') ||
        store.hasPermission('NAMES') ||
        store.hasPermission('PLACES')
    );
    return {
      canDictionarySearch,
    };
  },
});
</script>
