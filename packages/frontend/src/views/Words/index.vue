<template>
  <OareContentView
    title="Old Assyrian Lexicon"
    informationCard='This Lexicon is intended to include all common nouns, verbs, adjectives,
        etc., and month names. Much of the content follows entries from both the
        CAD and Kouwenberg &#39;s "Introduction to Old Assyrian" (Zaphon, 2019). Many
        spellings that do not yet have an example in the corpus are included,
        though they do not show up unless there is an actual example in the
        corpus to link to. Spellings are indexed and grouped under forms, which
        take parsing properties, and reflect a normalization, which are in turn
        grouped under lemmas. Standardization of normalization is ongoing.
        Indexing is ongoing with many thousand forms and spellings still not
        indexed. After these projects are finished, a project to standardize
        readings employed in transliterations based on accepted normalization
        will also be undertaken.'
    :loading="loading"
  >
    <dictionary
      :wordList="words"
      :letter="letter"
      route="words"
      :searchFilter="searchFilter"
    >
      <template #word="{ word }">
        <router-link :to="`/dictionaryWord/${word.uuid}`" class="mr-1">
          <mark v-if="word.forms.length <= 0" class="error">{{
            word.word
          }}</mark>
          <mark v-else :style="`${highlightWords(word.wordOccurrences)}`">{{
            word.word
          }}</mark>
        </router-link>
      </template>
      <template #translationsForDefinition="{ word }">
        <p>{{ word.wordOccurrences }}</p>
        <div v-if="partsOfSpeech(word).length > 0" class="mr-1">
          {{ itemPropertyString(partsOfSpeech(word)) }}
        </div>
        <div v-if="verbalThematicVowelTypes(word).length > 0" class="mr-3">
          {{ ` (${itemPropertyString(verbalThematicVowelTypes(word))})` }}
        </div>
        <p>
          <span v-for="(tr, idx) in getWordTranslations(word)" :key="tr.uuid">
            <b>{{ idx + 1 }}</b
            >. {{ tr.val }}
          </span>
          <span
            v-if="
              word.translationsForDefinition.length > 0 &&
              specialClassifications(word).length > 0
            "
            >;</span
          >
          <span v-if="specialClassifications(word).length > 0">
            {{ itemPropertyString(specialClassifications(word)) }}
          </span>
        </p>
      </template>
    </dictionary>
  </OareContentView>
</template>

<script lang="ts">
import { defineComponent, ref, Ref, watch } from '@vue/composition-api';
import Dictionary from '@/views/Dictionary/index.vue';
import { ItemPropertyRow, Word } from '@oare/types';
import sl from '@/serviceLocator';

export default defineComponent({
  name: 'WordsView',
  components: {
    Dictionary,
  },
  props: {
    letter: {
      type: String,
      required: true,
    },
  },

  setup(props) {
    const server = sl.get('serverProxy');
    const actions = sl.get('globalActions');

    const words: Ref<Word[]> = ref([]);
    const loading = ref(false);

    const searchFilter = (search: string, word: Word): boolean => {
      const lowerSearch = search ? search.toLowerCase() : '';

      return (
        word.word.toLowerCase().includes(lowerSearch) ||
        word.translationsForDefinition.some(tr =>
          tr.val.toLowerCase().includes(lowerSearch)
        ) ||
        word.discussionLemmas.some(tr =>
          tr.val.toLowerCase().includes(lowerSearch)
        ) ||
        word.properties.some(prop =>
          prop.valueName.toLowerCase().includes(lowerSearch)
        )
      );
    };

    const itemPropertyString = (properties: ItemPropertyRow[]) =>
      properties.map(prop => prop.valAbbreviation || prop.valueName).join(', ');

    watch(
      () => props.letter,
      async () => {
        loading.value = true;
        try {
          words.value = await server.getDictionaryWords(props.letter);
        } catch (err) {
          actions.showErrorSnackbar(
            'Failed to retrieve dictionary words',
            err as Error
          );
        } finally {
          loading.value = false;
        }
      },
      { immediate: true }
    );

    const getWordTranslations = (word: Word) => {
      return word.translationsForDefinition;
    };

    const getWordDiscussionLemmas = (word: Word) => {
      return word.discussionLemmas;
    };
    const partsOfSpeech = (word: Word) => {
      return word.properties.filter(
        prop => prop.variableName === 'Part of Speech'
      );
    };

    const verbalThematicVowelTypes = (word: Word) => {
      return word.properties.filter(
        prop => prop.variableName === 'Verbal Thematic Vowel Type'
      );
    };

    const specialClassifications = (word: Word) => {
      return word.properties.filter(
        prop => prop.variableName === 'Special Classifications'
      );
    };

    const highlightWords = (occurrences: number) => {
      if (occurrences >= 0 && occurrences <= 10) {
        return 'background: #caf0f8';
      } else if (occurrences >= 11 && occurrences <= 100) {
        return 'background: #90e0ef';
      } else if (occurrences >= 101 && occurrences <= 1000) {
        return 'background: #e0aaff';
      } else if (occurrences >= 1001 && occurrences <= 10000) {
        return 'background: #c77dff';
      } else if (occurrences >= 10001 && occurrences <= 25000) {
        return 'background: #ffccd5';
      } else if (occurrences >= 25001) {
        return 'background: #ff8fa3';
      } else {
        return '';
      }
    };

    return {
      words,
      loading,
      searchFilter,
      itemPropertyString,
      getWordTranslations,
      getWordDiscussionLemmas,
      partsOfSpeech,
      verbalThematicVowelTypes,
      specialClassifications,
      highlightWords,
    };
  },
});
</script>
