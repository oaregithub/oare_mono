<template>
  <OareContentView title="Old Assyrian Lexicon" :loading="loading">
    <DictionaryDisplay
      :wordList="words"
      :letter="letter"
      route="words"
      :showForms="false"
      :searchFilter="searchFilter"
    >
      <template #word="{ word }">
        <router-link :to="`/dictionaryWord/${word.uuid}`" class="mr-1">{{
          word.word
        }}</router-link>
      </template>
      <template #translation="{ word }">
        <div v-if="word.partsOfSpeech.length > 0" class="mr-1">
          {{ word.partsOfSpeech.join(', ') }}
        </div>
        <div v-if="word.verbalThematicVowelTypes.length > 0" class="mr-1">
          {{ ` (${word.verbalThematicVowelTypes.join(', ')})` }}
        </div>
        <p>
          <span v-for="(tr, idx) in word.translations" :key="idx">
            <b>{{ idx + 1 }}</b
            >. {{ tr }}
          </span>
          <span
            v-if="
              word.translations.length > 0 &&
              word.specialClassifications.length > 0
            "
            >;</span
          >
          <span v-if="word.specialClassifications.length > 0">
            {{ word.specialClassifications.join(', ') }}
          </span>
        </p>
      </template>
    </DictionaryDisplay>
  </OareContentView>
</template>

<script lang="ts">
import { defineComponent, ref, Ref, onMounted } from '@vue/composition-api';
import DictionaryDisplay from '@/components/DictionaryDisplay/index.vue';
import server from '@/serverProxy';
import { DictionaryWord } from '@/types/words';

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
  setup() {
    const words: Ref<DictionaryWord[]> = ref([]);
    const loading = ref(false);

    const searchFilter = (search: string, word: DictionaryWord): boolean => {
      const lowerSearch = search ? search.toLowerCase() : '';

      return (
        word.word.toLowerCase().includes(lowerSearch) ||
        word.translations.some(tr => tr.toLowerCase().includes(lowerSearch)) ||
        word.partsOfSpeech.some(pos =>
          pos.toLowerCase().includes(lowerSearch)
        ) ||
        word.specialClassifications.some(sp =>
          sp.toLowerCase().includes(lowerSearch)
        ) ||
        word.verbalThematicVowelTypes.some(vt =>
          vt.toLowerCase().includes(lowerSearch)
        )
      );
    };

    onMounted(async () => {
      loading.value = true;
      const { words: wordsResp, canEdit } = await server.getDictionaryWords();
      words.value = wordsResp;
      loading.value = false;
    });

    return {
      words,
      loading,
      searchFilter,
    };
  },
});
</script>

<style></style>
