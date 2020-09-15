<template>
  <div class="white--text pa-3 d-flex flex-column">
    <h2 class="mb-2">Quick Queries</h2>
    <router-link to="/search/texts" class="white--text no-underline">
      Go to advanced queries <v-icon>mdi-icon-right</v-icon>
    </router-link>
    <search-field
      class="test-text-input"
      label="Text"
      v-model="text"
      @keyup.enter.native="$router.push(searchRoute)"
      :disabled="textSearchDisabled"
    />
    <search-field
      class="mt-n3 test-transliteration-input"
      label="Transliteration"
      v-model="transliteration"
      @keyup.enter.native="$router.push(searchRoute)"
      :disabled="textSearchDisabled"
    />
    <search-field
      class="mt-n3 test-words-input"
      label="Words"
      v-model="dictionary"
      @keyup.enter.native="$router.push(searchRoute)"
      :disabled="dictionaryDisabled"
    />
    <v-btn color="error" class="mb-3 test-clear-btn" @click="clearSearch"
      >Clear</v-btn
    >
    <v-btn
      color="info"
      class="mb-3 test-search-btn"
      :to="searchRoute"
      :disabled="Object.keys(searchRoute.query).length < 1"
      >Search</v-btn
    >
  </div>
</template>

<script lang="ts">
import {
  defineComponent,
  reactive,
  toRefs,
  computed,
} from '@vue/composition-api';
import SearchField from './SearchField.vue';
import router from '../../../router';

export default defineComponent({
  name: 'OareSidebar',
  components: {
    SearchField,
  },
  setup() {
    const inputs = reactive({
      text: '',
      transliteration: '',
      dictionary: '',
      names: '',
      periods: '',
      parse: '',
    });

    const textSearchDisabled = computed(() => inputs.dictionary.trim() !== '');
    const dictionaryDisabled = computed(() => {
      return inputs.text.trim() !== '' || inputs.transliteration.trim() !== '';
    });

    const searchQuery = computed(() => {
      const { text, transliteration, dictionary } = inputs;

      if (dictionaryDisabled.value) {
        return {
          ...(text && { title: text }),
          ...(transliteration && { query: transliteration }),
        };
      } else {
        return {
          ...(dictionary && { dictionary }),
        };
      }
    });

    const searchRoute = computed(() => {
      const routeName = dictionaryDisabled.value
        ? 'textsSearch'
        : 'dictionarySearch';
      return {
        name: routeName,
        query: searchQuery.value,
      };
    });

    const clearSearch = () => {
      inputs.text = '';
      inputs.transliteration = '';
      inputs.dictionary = '';
    };

    return {
      ...toRefs(inputs),
      searchRoute,
      textSearchDisabled,
      dictionaryDisabled,
      clearSearch,
    };
  },
});
</script>

<style scoped>
.no-underline {
  text-decoration: none;
}
</style>
