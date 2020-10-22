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
        <v-btn
          icon
          class="mt-n2 mr-1"
          :to="`/dictionaryWord/${word.uuid}/edit`"
          v-if="canEdit"
        >
          <v-icon>mdi-pencil</v-icon>
        </v-btn>
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
          <span v-for="(tr, idx) in word.translations" :key="tr.uuid">
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
            {{ word.specialClassifications.join(', ') }}
          </span>
        </p>
      </template>
    </DictionaryDisplay>
  </OareContentView>
</template>

<script lang="ts">
import {
  defineComponent,
  ref,
  Ref,
  onMounted,
  PropType,
} from '@vue/composition-api';
import DictionaryDisplay from '@/components/DictionaryDisplay/index.vue';
import defaultServer from '@/serverProxy';
import { DictionaryWord } from '@oare/types';
import defaultActions from '@/globalActions';

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
    server: {
      type: Object as PropType<typeof defaultServer>,
      default: () => defaultServer,
    },
    actions: {
      type: Object as PropType<typeof defaultActions>,
      default: () => defaultActions,
    },
  },
  setup({ actions, server }) {
    const words: Ref<DictionaryWord[]> = ref([]);
    const canEdit = ref(false);
    const loading = ref(false);

    const searchFilter = (search: string, word: DictionaryWord): boolean => {
      const lowerSearch = search ? search.toLowerCase() : '';

      return (
        word.word.toLowerCase().includes(lowerSearch) ||
        word.translations.some(tr =>
          tr.translation.toLowerCase().includes(lowerSearch)
        ) ||
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
      try {
        const { words: wordsResp } = await server.getDictionaryWords();
        const {
          canEdit: canEditResp,
        } = await server.getDictionaryPermissions();
        words.value = wordsResp;
        canEdit.value = canEditResp;
      } catch {
        actions.showErrorSnackbar('Failed to retrieve dictionary words');
      } finally {
        loading.value = false;
      }
    });

    return {
      words,
      loading,
      searchFilter,
      canEdit,
    };
  },
});
</script>

<style></style>
