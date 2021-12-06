<template>
  <div class="white--text pa-3 d-flex flex-column">
    <h2 class="mb-2">Quick Queries</h2>
    <router-link to="/search/texts" class="white--text no-underline">
      Go to advanced queries <v-icon>mdi-icon-right</v-icon>
    </router-link>
    <search-field
      class="test-text-input"
      label="Text Name"
      v-model="text"
      @keyup.enter.native="performSearch"
      :disabled="textSearchDisabled"
    />
    <search-field
      class="mt-n3 test-transliteration-input"
      label="Transliteration"
      v-model="translit"
      @keyup.enter.native="performSearch"
      :disabled="textSearchDisabled"
      :displayHelp="true"
    />
    <search-field
      class="mt-n3 test-words-input"
      label="Words"
      v-model="word"
      @keyup.enter.native="performSearch"
      :disabled="dictionaryDisabled"
      v-if="isAdmin"
    />
    <v-btn color="error" class="mb-3 test-clear-btn" @click="clearSearch"
      >Clear</v-btn
    >
    <v-btn
      color="info"
      class="mb-3 test-search-btn"
      :disabled="!canSearch"
      @click="performSearch"
      >Search</v-btn
    >
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, ref } from '@vue/composition-api';
import SearchField from './SearchField.vue';
import sl from '@/serviceLocator';

export default defineComponent({
  name: 'OareSidebar',
  components: {
    SearchField,
  },
  setup() {
    const store = sl.get('store');
    const text = ref('');
    const translit = ref('');
    const word = ref('');

    const textSearchDisabled = computed(() => word.value.trim() !== '');
    const dictionaryDisabled = computed(() => {
      return text.value.trim() !== '' || translit.value.trim() !== '';
    });

    const performSearch = async () => {
      const routeName = dictionaryDisabled.value
        ? '/search/texts'
        : '/search/dictionary';

      const { protocol, pathname, host } = window.location;
      const urlParams = new URLSearchParams();

      if (text.value) {
        urlParams.set('title', text.value);
      }

      if (translit.value) {
        urlParams.set('translit', translit.value);
      }

      if (word.value) {
        urlParams.set('dictionary', word.value);
      }

      const newUrl = `${protocol}//${host}${routeName}?${urlParams.toString()}`;
      window.location.href = newUrl;
    };

    const isAdmin = computed(() => store.getters.isAdmin);

    const canSearch = computed(
      () => text.value || translit.value || word.value
    );

    const clearSearch = () => {
      text.value = '';
      translit.value = '';
      word.value = '';
    };

    return {
      text,
      translit,
      word,
      performSearch,
      textSearchDisabled,
      dictionaryDisabled,
      clearSearch,
      canSearch,
      isAdmin,
    };
  },
});
</script>

<style scoped>
.no-underline {
  text-decoration: none;
}
</style>
