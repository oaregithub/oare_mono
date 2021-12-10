<template>
  <OareContentView
    title="Onomasticon"
    informationCard="The list includes personal names and divine names. A project to combine
        similar renderings that may be the same name is underway, but still in
        the early stages. Indexing of variant spellings is not yet complete. See
        info on Words/Old Assyrian Lexicon for intended projects that also apply
        here."
    :loading="loading"
  >
    <DictionaryDisplay
      :wordList="names"
      :letter="letter"
      route="names"
      :searchFilter="searchFilter"
    >
      <template #word="{ word }">
        <router-link :to="`/namesWord/${word.uuid}`" class="mr-1">
          <mark v-if="word.forms.length <= 0" class="error">{{
            word.word
          }}</mark>
          <span v-else>{{ word.word }}</span>
        </router-link>
      </template>
      <template #translation="{ word }">
        <div>
          {{
            word.translations.length > 0
              ? word.translations[0].translation
              : '(no trans.)'
          }}
        </div>
      </template>
      <template #forms="{ word }">
        <div
          v-for="(formInfo, idx) in word.forms"
          :key="idx"
          class="d-flex flex-wrap pl-4"
        >
          <mark v-if="formInfo.spellings.length <= 0" class="error"
            ><em class="font-weight-bold mr-1">
              {{ formInfo.form }}
            </em></mark
          >
          <em v-else class="font-weight-bold mr-1">
            {{ formInfo.form }}
          </em>

          <div class="mr-1" v-if="formInfo.cases.length > 0">
            ({{ formInfo.cases.join('/') }})
          </div>
        </div>
      </template>
    </DictionaryDisplay>
  </OareContentView>
</template>

<script lang="ts">
import { defineComponent, ref, Ref, watch } from '@vue/composition-api';
import DictionaryDisplay from '@/components/DictionaryDisplay/index.vue';
import { Word } from '@oare/types';
import sl from '@/serviceLocator';

export default defineComponent({
  name: 'NamesView',
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

    const names: Ref<Word[]> = ref([]);
    const loading = ref(false);

    const searchFilter = (search: string, word: Word): boolean => {
      const lowerSearch = search ? search.toLowerCase() : '';

      return (
        word.word.toLowerCase().includes(lowerSearch) ||
        word.translations.some(tr =>
          tr.translation.toLowerCase().includes(lowerSearch)
        ) ||
        word.forms.some(form => {
          return (
            form.form.toLowerCase().includes(lowerSearch) ||
            form.spellings.some(spelling => {
              return (
                spelling &&
                spelling.spelling.toLowerCase().includes(lowerSearch)
              );
            })
          );
        })
      );
    };

    watch(
      () => props.letter,
      async () => {
        loading.value = true;
        try {
          names.value = await server.getNames(props.letter);
        } catch {
          actions.showErrorSnackbar('Failed to retrieve name words');
        } finally {
          loading.value = false;
        }
      },
      { immediate: true }
    );

    return {
      names,
      loading,
      searchFilter,
    };
  },
});
</script>
