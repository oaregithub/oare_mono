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
    <DictionaryDisplay
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
          <span v-else>{{ word.word }}</span>
        </router-link>
      </template>
      <template #translation="{ word }">
        <div v-if="word.partsOfSpeech.length > 0" class="mr-1">
          {{ itemPropertyString(word.partsOfSpeech) }}
        </div>
        <div v-if="word.verbalThematicVowelTypes.length > 0" class="mr-1">
          {{ ` (${itemPropertyString(word.verbalThematicVowelTypes)})` }}
        </div>
        <p>
          <span v-for="(tr, idx) in getWordTranslations(word)" :key="tr.uuid">
            <b>{{ idx + 1 }}</b
            >. {{ tr.translation }}
          </span>
          <span
            v-if="
              word.translations.length > 0 &&
              word.specialClassifications.length > 0
            "
            >;</span
          >
          <span v-if="word.specialClassifications.length > 0">
            {{ itemPropertyString(word.specialClassifications) }}
          </span>
        </p>
      </template>
    </DictionaryDisplay>
  </OareContentView>
</template>

<script lang="ts">
import { defineComponent, ref, Ref, watch } from '@vue/composition-api';
import DictionaryDisplay from '@/components/DictionaryDisplay/index.vue';
import { DictionaryWord, ItemProperty } from '@oare/types';
import sl from '@/serviceLocator';

export default defineComponent({
  name: 'WordsView',
  components: {
    DictionaryDisplay,
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

    const words: Ref<DictionaryWord[]> = ref([]);
    const loading = ref(false);

    const searchFilter = (search: string, word: DictionaryWord): boolean => {
      const lowerSearch = search ? search.toLowerCase() : '';

      return (
        word.word.toLowerCase().includes(lowerSearch) ||
        word.translations.some(tr =>
          tr.translation.toLowerCase().includes(lowerSearch)
        ) ||
        word.partsOfSpeech.some(pos =>
          pos.name.toLowerCase().includes(lowerSearch)
        ) ||
        word.specialClassifications.some(sp =>
          sp.name.toLowerCase().includes(lowerSearch)
        ) ||
        word.verbalThematicVowelTypes.some(vt =>
          vt.name.toLowerCase().includes(lowerSearch)
        )
      );
    };

    const itemPropertyString = (properties: ItemProperty[]) =>
      properties.map(prop => prop.name).join(', ');

    watch(
      () => props.letter,
      async () => {
        loading.value = true;
        try {
          const { words: wordsResp } = await server.getDictionaryWords(
            props.letter
          );
          words.value = wordsResp;
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

    const getWordTranslations = (word: DictionaryWord) => {
      return word.translations;
    };

    return {
      words,
      loading,
      searchFilter,
      itemPropertyString,
      getWordTranslations,
    };
  },
});
</script>
